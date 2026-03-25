import snmp, { Session } from 'net-snmp';
import prisma from '../db/prisma.js';

// OIDs for ZTE (C300/C600)
const ZTE_OIDS = {
  sn: '1.3.6.1.4.1.3902.1012.3.28.1.1.5',     // zxGponOntSn
  signal: '1.3.6.1.4.1.3902.1012.3.50.12.1.1.10', // zxAnPonRxOpticalPowerTable entry
  status: '1.3.6.1.4.1.3902.1012.3.28.2.1.4',     // zxGponOntPhaseState
};

// OIDs for HIOSO (EPON)
const HIOSO_OIDS = {
  sn: '1.3.6.1.4.1.3320.101.10.1.1.3',      // Common EPON MAC table
  signal: '1.3.6.1.4.1.3320.101.10.5.1.5',  // RX Power
  status: '1.3.6.1.4.1.3320.101.10.1.1.26', // Status
};

/**
 * Helper to perform SNMP Walk and return a map of Index -> Value
 */
async function walkSnmp(session: Session, oid: string): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const results: Record<string, any> = {};
    session.subtree(oid, (varbinds) => {
      for (const vb of varbinds) {
        if (snmp.isVarbindError(vb)) {
          console.error('SNMP Walk Error:', snmp.varbindError(vb));
        } else {
          const index = vb.oid.replace(oid + '.', '');
          results[index] = vb.value;
        }
      }
    }, (error) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
}

/**
 * Discovers the mapping between ONU Serial Number (SN/MAC) and SNMP Index
 */
async function fetchOnuIndexMap(session: Session, type: 'ZTE' | 'HIOSO'): Promise<Record<string, string>> {
  const snOid = type === 'ZTE' ? ZTE_OIDS.sn : HIOSO_OIDS.sn;
  const rawMap = await walkSnmp(session, snOid);
  const indexMap: Record<string, string> = {};

  for (const [index, value] of Object.entries(rawMap)) {
    let snStr = '';
    if (Buffer.isBuffer(value)) {
      // ZTE SN is often 8 bytes (4 prefix chars + 4 hex bytes)
      if (type === 'ZTE' && value.length === 8) {
         const prefix = value.slice(0, 4).toString('ascii');
         const hex = value.slice(4).toString('hex').toUpperCase();
         snStr = prefix + hex;
      } else {
         snStr = value.toString('hex').toUpperCase();
      }
    } else {
      snStr = String(value);
    }
    indexMap[snStr] = index;
  }

  return indexMap;
}

export async function pollOltAdvanced(oltId: string) {
  const olt = await prisma.olt.findUnique({ 
    where: { id: oltId },
    include: { customers: true }
  });
  
  if (!olt) throw new Error('OLT not found');

  const oids = olt.type === 'ZTE' ? ZTE_OIDS : HIOSO_OIDS;
  const session = snmp.createSession(olt.ip_address, olt.snmp_community);

  try {
    console.log(`[SNMP] Discovering ONU indices for ${olt.name}...`);
    const indexMap = await fetchOnuIndexMap(session, olt.type as 'ZTE' | 'HIOSO');
    const results = [];

    for (const customer of olt.customers) {
      try {
        const index = indexMap[customer.sn_mac.toUpperCase()];
        if (!index) {
          console.warn(`[SNMP] Index not found for ONU ${customer.sn_mac} (${customer.name})`);
          continue;
        }

        // Perform Get for Signal and Status
        const varbinds = await new Promise<any[]>((resolve, reject) => {
          session.get([oids.signal + "." + index, oids.status + "." + index], (error, vbs) => {
            if (error) reject(error);
            else resolve(vbs || []);
          });
        });

        const signalVar = varbinds[0];
        const statusVar = varbinds[1];

        let rxPower = (signalVar && !snmp.isVarbindError(signalVar)) ? signalVar.value : null;
        
        // ZTE formula: INTEGER * 0.002 - 30
        if (olt.type === 'ZTE' && typeof rxPower === 'number' && rxPower !== 0) {
          rxPower = (rxPower * 0.002) - 30;
        } 
        // Hioso formula: often INTEGER / 10 (needs verification per model)
        else if (olt.type === 'HIOSO' && typeof rxPower === 'number') {
          rxPower = rxPower / 10;
        }

        const statusVal = (statusVar && !snmp.isVarbindError(statusVar)) ? statusVar.value : 0;
        
        // Generic status mapping
        const statusMap: Record<number, 'ONLINE' | 'LOS' | 'OFFLINE'> = {
          1: 'ONLINE', // often 1 or 5 for ZTE depending on OID
          2: 'LOS',
          3: 'OFFLINE',
          5: 'ONLINE'  // ZTE Phase State 5 is working
        };

        results.push({
          customer_id: customer.id,
          rx_live: typeof rxPower === 'number' ? parseFloat(rxPower.toFixed(2)) : -40,
          status: statusMap[statusVal] || (statusVal > 0 ? 'ONLINE' : 'OFFLINE')
        });

      } catch (err) {
        console.error(`[SNMP] Error polling customer ${customer.name}:`, err);
      }
    }

    return results;
  } finally {
    session.close();
  }
}

export async function checkFiberCut(oltId: string) {
  const metrics = await pollOltAdvanced(oltId);
  const totalOnus = metrics.length;
  if (totalOnus === 0) return { isFiberCut: false, losOnus: 0, totalOnus: 0 };

  const losOnus = metrics.filter(m => m.status === 'LOS' || m.status === 'OFFLINE').length;
  const isFiberCut = totalOnus > 5 && (losOnus / totalOnus) > 0.7;

  return { isFiberCut, losOnus, totalOnus };
}

/**
 * Fetches all physical ONUs currently connected to the OLT
 */
export async function discoverAllOnus(oltId: string) {
  const olt = await prisma.olt.findUnique({ where: { id: oltId } });
  if (!olt) throw new Error('OLT not found');

  const session = snmp.createSession(olt.ip_address, olt.snmp_community);
  try {
    const indexMap = await fetchOnuIndexMap(session, olt.type as 'ZTE' | 'HIOSO');
    const onus = [];

    for (const [sn, index] of Object.entries(indexMap)) {
      onus.push({
        sn,
        index,
        oltId: olt.id
      });
    }

    return onus;
  } finally {
    session.close();
  }
}
