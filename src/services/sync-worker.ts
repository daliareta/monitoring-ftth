import prisma from '../db/prisma.js';
import { syncPppoeToCustomers } from './mikrotik.js';
import { pollOltAdvanced, checkFiberCut } from './olt-manager.js';

export async function runGlobalSync() {
  console.log('[SyncWorker] Starting global synchronization...');

  // 1. Sync all Mikrotiks
  const routers = await prisma.router.findMany();
  for (const router of routers) {
    try {
      console.log(`  -> Syncing Router: ${router.name}`);
      await syncPppoeToCustomers(router.id);
    } catch (error) {
      console.error(`  -> Failed sync for router ${router.name}:`, error);
    }
  }

  // 2. Poll all OLTs
  const olts = await prisma.olt.findMany();
  for (const olt of olts) {
    try {
      console.log(`  -> Polling OLT: ${olt.name}`);
      const metrics = await pollOltAdvanced(olt.id);
      
      for (const metric of metrics) {
        await prisma.onuMetrics.create({
          data: {
            customer_id: metric.customer_id,
            rx_live: metric.rx_live,
            status: metric.status
          }
        });
      }

      const fiberAudit = await checkFiberCut(olt.id);
      if (fiberAudit.isFiberCut) {
         console.warn(`[ALERT] Potential Fiber Cut detected on OLT ${olt.name}! (${fiberAudit.losOnus}/${fiberAudit.totalOnus} ONUs LOS)`);
      }
    } catch (error) {
       console.error(`  -> Failed polling for OLT ${olt.name}:`, error);
    }
  }

  console.log('[SyncWorker] Global synchronization complete.');
}
