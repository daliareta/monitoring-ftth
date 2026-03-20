import cron from 'node-cron';
import prisma from '../db/prisma.js';
import { pollOlt } from './snmp.js';
import { syncPppoeToCustomers } from './mikrotik.js';

export function startSnmpWorker() {
  console.log('Starting SNMP Polling Worker...');
  
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Worker] Running SNMP poll cycle at', new Date().toISOString());
    try {
      // 0. Sync MikroTik PPPoE first to discover new customers
      const routers = await (prisma as any).router.findMany();
      for (const router of routers) {
        try {
          console.log(`[Worker] Syncing MikroTik ${router.name}...`);
          await syncPppoeToCustomers(router.id);
        } catch (err) {
          console.error(`[Worker] Failed to sync MikroTik ${router.name}:`, err);
        }
      }

      // 1. Fetch all OLTs and their associated Customers
      const olts = await prisma.olt.findMany({
        include: {
          customers: true,
        },
      });

      // 2. Poll each customer's metrics
      for (const olt of olts) {
        if (!olt.customers.length) continue;

        console.log(`[Worker] Polling OLT ${olt.name} (${olt.ip_address}) for ${olt.customers.length} customers`);

        for (const customer of olt.customers) {
          try {
            // Wait for metrics from the polling service
            const metrics = await pollOlt(olt.ip_address, olt.snmp_community, olt.type, customer.sn_mac);
            
            // 3. Insert into OnuMetrics table
            await prisma.onuMetrics.create({
              data: {
                customer_id: customer.id,
                rx_live: metrics.rx_live,
                tx_live: metrics.tx_live,
                status: metrics.status,
              },
            });
            console.log(`  -> Customer ${customer.id} metrics recorded.`);
          } catch (error) {
            console.error(`  -> Failed to poll customer ${customer.id}:`, error);
            
            // Mark as OFFLINE if polling completely fails
            await prisma.onuMetrics.create({
              data: {
                customer_id: customer.id,
                status: 'OFFLINE',
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('[Worker] Fatal error during polling cycle:', error);
    }
  });
}
