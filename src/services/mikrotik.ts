import pkg from 'mikro-routeros';
const { RouterOSClient } = pkg;
import prisma from '../db/prisma.js';

export async function fetchMikrotikPppoe(routerId: string) {
  const router = await (prisma.router as any).findUnique({ where: { id: routerId } });
  if (!router) throw new Error('Router not found');

  const client = new RouterOSClient(router.ip_address, router.api_port);

  try {
    await client.connect();
    await client.login(router.username, router.password);
    
    // Fetch PPPoE Secrets (Configured Users)
    const secrets = await client.runQuery('/ppp/secret/print');
    
    // Fetch Active PPPoE Sessions
    const active = await client.runQuery('/ppp/active/print');

    return { secrets, active };
  } catch (error) {
    console.error(`Mikrotik Connection Error (${router.name}):`, error);
    throw error;
  } finally {
    client.close();
  }
}

export async function syncPppoeToCustomers(routerId: string) {
  const { secrets, active } = await fetchMikrotikPppoe(routerId);
  
  // Logic to update customer entries if pppoe_username matches
  for (const secret of secrets) {
    const pppoeUser = secret.name;
    const remoteAddress = secret['remote-address'];
    const comment = secret.comment || '';

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { pppoe_username: pppoeUser }
    });

    if (customer) {
      await (prisma.customer as any).update({
        where: { id: customer.id },
        data: { 
          router_id: routerId,
          modem_ip: remoteAddress || (customer as any).modem_ip
        }
      });
    } else {
      // --- SMART AUTO-DISCOVERY ---
      
      // 1. Ensure we have an OLT (Placeholder if necessary)
      let olt = await (prisma.olt as any).findFirst();
      if (!olt) {
        olt = await (prisma.olt as any).create({
          data: {
            name: "DEFAULT-DISCOVERED-OLT",
            ip_address: "127.0.0.1",
            snmp_community: "public",
            type: "ZTE"
          }
        });
      }

      // 2. Ensure we have an ODC (Placeholder if necessary)
      let odc = await (prisma.odc as any).findFirst();
      if (!odc) {
        odc = await (prisma.odc as any).create({
          data: {
            name: "DEFAULT-DISCOVERED-ODC",
            location_lat: -6.1285,
            location_long: 106.46358
          }
        });
      }

      // 3. Try to find/create ODP from Comment
      const odpNameFromComment = comment.split(' ')[0] || "ODP-PENDING-MAPPING";
      let odp = await (prisma.odp as any).findFirst({
        where: { name: { contains: odpNameFromComment, mode: 'insensitive' } }
      });

      if (!odp) {
        odp = await (prisma.odp as any).create({
          data: {
            name: odpNameFromComment,
            odc_id: odc.id,
            total_ports: 8,
            location_lat: odc.location_lat + (Math.random() * 0.01 - 0.005), // Random scatter near ODC
            location_long: odc.location_long + (Math.random() * 0.01 - 0.005)
          }
        });
      }

      // 4. Create New Customer
      await (prisma.customer as any).create({
        data: {
          billing_id: `AUTO-${pppoeUser}`,
          name: comment || pppoeUser,
          pppoe_username: pppoeUser,
          router_id: routerId,
          olt_id: olt.id,
          odp_id: odp.id,
          odp_port: 1, 
          sn_mac: secret['service'] || pppoeUser, // Placeholder
          location_lat: odp.location_lat + (Math.random() * 0.002 - 0.001),
          location_long: odp.location_long + (Math.random() * 0.002 - 0.001),
          modem_ip: remoteAddress
        }
      });
      console.log(`[Smart-Sync] Auto-discovered Customer & ODP: ${pppoeUser} -> ${odpNameFromComment}`);
    }
  }
  
  return { syncedCount: secrets.length };
}

export async function updateMikrotikPppoePassword(routerId: string, pppoeUsername: string, newPassword: string) {
  const router = await (prisma.router as any).findUnique({ where: { id: routerId } });
  if (!router) throw new Error('Router not found');

  const client = new RouterOSClient(router.ip_address, router.api_port);

  try {
    await client.connect();
    await client.login(router.username, router.password);

    // 1. Find the ID of the secret
    const secrets = await client.runQuery(`/ppp/secret/print`, { name: pppoeUsername });
    if (!secrets || secrets.length === 0) {
      throw new Error(`PPPoE Secret for ${pppoeUsername} not found on router.`);
    }

    const secretId = secrets[0]['.id'];

    // 2. Set new password
    await client.runQuery('/ppp/secret/set', { 
      '.id': secretId,
      'password': newPassword 
    });

    console.log(`[Mikrotik] Password updated for ${pppoeUsername} on ${router.name}`);
    return { success: true };
  } catch (error) {
    console.error(`Mikrotik Update Error:`, error);
    throw error;
  } finally {
    client.close();
  }
}
