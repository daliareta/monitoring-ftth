import { pollOltAdvanced } from './src/services/olt-manager.js';
import prisma from './src/db/prisma.js';

async function testSnmp() {
  console.log('--- OLT SNMP Connectivity Test ---');
  
  const olts = await prisma.olt.findMany();
  if (olts.length === 0) {
    console.error('No OLTs found in database. Please add an OLT via the UI/API first.');
    return;
  }

  for (const olt of olts) {
    console.log(`Testing OLT: ${olt.name} (${olt.ip_address})...`);
    try {
      const results = await pollOltAdvanced(olt.id);
      console.log(`Successfully polled ${results.length} ONUs:`);
      console.table(results);
    } catch (err: any) {
      console.error(`Failed to poll ${olt.name}:`, err.message);
    }
  }
}

testSnmp().catch(console.error);
