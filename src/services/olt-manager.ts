import snmp from 'net-snmp';
import prisma from '../db/prisma.js';

// OIDs for ZTE (C300/C600)
const ZTE_OIDS = {
  signal: '1.3.6.1.4.1.3902.1012.3.50.12.1.1.10', // zxAnPonRxOpticalPowerTable entry
  status: '1.3.6.1.4.1.3902.1012.3.28.2.1.4',     // zxGponOntPhaseState
};

// OIDs for HIOSO (EPON)
const HIOSO_OIDS = {
  signal: '1.3.6.1.4.1.3320.101.10.5.1.5',
  status: '1.3.6.1.4.1.3320.101.10.1.1.26', // Example status OID
};

export async function pollOltAdvanced(oltId: string) {
  const olt = await prisma.olt.findUnique({ 
    where: { id: oltId },
    include: { customers: true }
  });
  
  if (!olt) throw new Error('OLT not found');

  const oids = olt.type === 'ZTE' ? ZTE_OIDS : HIOSO_OIDS;
  const session = snmp.createSession(olt.ip_address, olt.snmp_community);

  const results = [];

  for (const customer of olt.customers) {
    try {
      // In a real scenario, we'd need to map the SN/MAC to an SNMP index
      // For now, we mock the index lookup or use the stored sn_mac if indexed
      const index = customer.sn_mac; // Simplified for demonstration

      // Perform Get
      const [signalVar, statusVar] = await new Promise<any[]>((resolve, reject) => {
        session.get([oids.signal + "." + index, oids.status + "." + index], (error, varbinds) => {
          if (error) reject(error);
          else resolve(varbinds || []);
        });
      });

      let rxPower = signalVar.value;
      if (olt.type === 'ZTE' && typeof rxPower === 'number') {
        // ZTE formula: INTEGER * 0.002 - 30
        rxPower = (rxPower * 0.002) - 30;
      }

      const statusMap: Record<number, 'ONLINE' | 'LOS' | 'OFFLINE'> = {
        1: 'ONLINE',
        2: 'LOS',
        3: 'OFFLINE'
      };

      results.push({
        customer_id: customer.id,
        rx_live: rxPower,
        status: statusMap[statusVar.value] || 'OFFLINE'
      });

    } catch (err) {
      console.error(`Error polling ONT ${customer.name}:`, err);
    }
  }

  session.close();
  return results;
}

export async function checkFiberCut(oltId: string) {
  const metrics = await pollOltAdvanced(oltId);
  const totalOnus = metrics.length;
  const losOnus = metrics.filter(m => m.status === 'LOS').length;

  // If more than 50% are LOS, likely a fiber cut
  const isFiberCut = totalOnus > 3 && (losOnus / totalOnus) > 0.5;

  return { isFiberCut, losOnus, totalOnus };
}
