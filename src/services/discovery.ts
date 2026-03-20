import prisma from '../db/prisma.js';
import { fetchMikrotikPppoe } from './mikrotik.js';
import { createNotification } from './notifications.js';
// Add SNMP/Telnet imports later when OLT discovery is refined

export async function runTopologyDiscovery() {
  console.log('[Discovery] Starting global topology reconstruction...');
  const results = {
    newCustomers: 0,
    newOdps: 0,
    newOdcs: 0,
    errors: [] as string[]
  };

  try {
    // 1. Sync from ALL Routers (MikroTik)
    const routers = await (prisma as any).router.findMany();
    for (const router of routers) {
      try {
        const { secrets } = await fetchMikrotikPppoe(router.id);
        
        for (const secret of secrets) {
          const pppoeUser = secret.name;
          const comment = secret.comment || '';
          
          // Check if already in DB
          const existing = await prisma.customer.findUnique({ where: { pppoe_username: pppoeUser } });
          if (existing) continue;

          // HEURISTIC: Find ODP name in comment (e.g., "ODP-MAWAR-01 ...")
          const odpMatch = comment.match(/ODP-[\w-]+/i);
          const odpName = odpMatch ? odpMatch[0].toUpperCase() : 'ODP-DISCOVERED';

          // Ensure ODC exists
          let odc = await (prisma.odc as any).findFirst({ where: { name: 'DISCOVERED-HUB' } });
          if (!odc) {
            odc = await (prisma.odc as any).create({
              data: { name: 'DISCOVERED-HUB', location_lat: router.location_lat || -6.12, location_long: router.location_long || 106.46 }
            });
            results.newOdcs++;
          }

          // Ensure ODP exists
          let odp = await (prisma.odp as any).findFirst({ where: { name: odpName } });
          if (!odp) {
            odp = await (prisma.odp as any).create({
              data: { 
                name: odpName, 
                odc_id: odc.id, 
                total_ports: 8,
                location_lat: odc.location_lat + (Math.random() * 0.005 - 0.0025),
                location_long: odc.location_long + (Math.random() * 0.005 - 0.0025)
              }
            });
            results.newOdps++;
          }

          // Find OLT (Assign to first one if unknown)
          const olt = await (prisma.olt as any).findFirst();
          if (!olt) continue;

          // Create Customer
          const customer = await (prisma.customer as any).create({
            data: {
              billing_id: `AUTO-${pppoeUser}`,
              name: comment || pppoeUser,
              pppoe_username: pppoeUser,
              olt_id: olt.id,
              odp_id: odp.id,
              odp_port: 1,
              sn_mac: secret.service || 'UNKNOWN',
              router_id: router.id,
              location_lat: odp.location_lat + (Math.random() * 0.001 - 0.0005),
              location_long: odp.location_long + (Math.random() * 0.001 - 0.0005)
            }
          });

          // Create Notification for New Client
          await createNotification(
            'New Client Discovered',
            `Client ${customer.name} (PPPoE: ${customer.pppoe_username}) has been successfully integrated into ${odpName}.`,
            'NEW_CLIENT',
            'INFO'
          );

          results.newCustomers++;
        }
      } catch (err: any) {
        results.errors.push(`Router ${router.name}: ${err.message}`);
      }
    }

    // 2. Signal Health Audit (Self-Correction)
    console.log('[Discovery] Auditing signal health for existing clients...');
    const problematicCustomers = await (prisma.customer as any).findMany({
      include: { metrics: { orderBy: { created_at: 'desc' }, take: 1 } }
    });

    for (const customer of problematicCustomers) {
      const rx = customer.metrics[0]?.rx_live;
      if (rx && rx < -25) {
        await createNotification(
          'Critical Signal Threshold',
          `Client ${customer.name} (PPPoE: ${customer.pppoe_username}) has poor redaman: ${rx} dBm. Potential fiber issue or dirty connector.`,
          'SIGNAL',
          rx < -27 ? 'CRITICAL' : 'WARNING'
        );
      }
    }

  } catch (globalErr: any) {
    results.errors.push(`Global: ${globalErr.message}`);
  }

  return results;
}
