import { Telnet } from 'telnet-client';
import prisma from '../db/prisma.js';

interface ProvisionParams {
  oltId: string;
  ponPort: string; // e.g., "1/1/1" for Rack/Shelf/Slot/Pon might be complex, let's say "1/1"
  onuId: number;
  snMac: string;
  name: string;
  profileName: string;
}

export async function provisionZteOnu(params: ProvisionParams) {
  const olt = await (prisma.olt as any).findUnique({ where: { id: params.oltId } });
  if (!olt || !olt.telnet_user || !olt.telnet_pass) {
    throw new Error('OLT Telnet credentials missing');
  }

  const connection = new Telnet();

  const telnetParams = {
    host: olt.ip_address,
    port: 23,
    shellPrompt: /#\s*$/,
    loginPrompt: /Username[:\s]*$/,
    passwordPrompt: /Password[:\s]*$/,
    timeout: 15000,
  };

  try {
    await connection.connect(telnetParams);
    
    // telnet-client connect() often handles login if prompts are matched, 
    // but if not, we can send them manually.
    // Fixed: connection.login is not public in some versions
    await connection.send(olt.telnet_user as string);
    await connection.send(olt.telnet_pass as string);

    // Enter configuration mode
    await connection.exec('conf t');
    
    // Command sequence for ZTE C300/C600 - simplified
    // interface gpon-olt_1/1/1
    // onu 1 type ZTE-F660 sn ZTEG12345678
    const commands = [
      `interface gpon-olt_${params.ponPort}`,
      `onu ${params.onuId} type ${params.profileName} sn ${params.snMac}`,
      `exit`,
      `interface gpon-onu_${params.ponPort}:${params.onuId}`,
      `name ${params.name}`,
      `description ${params.name}`,
      `exit`
    ];

    for (const cmd of commands) {
      const res = await connection.exec(cmd);
      console.log(`OLT (${olt.name}) EXEC: ${cmd} -> ${res}`);
    }

    return { success: true, message: `ONU ${params.snMac} provisioned on OLT ${olt.name}` };

  } catch (err) {
    console.error(`Provisioning Error (${olt.name}):`, err);
    throw err;
  } finally {
    await connection.destroy();
  }
}

export async function authorizeUnconfiguredOnu(oltId: string) {
  // Logic to 'show gpon onu unconfigured' and return results
}

export async function rebootZteOnu(oltId: string, ponPort: string, onuId: number) {
  const olt = await (prisma.olt as any).findUnique({ where: { id: oltId } });
  if (!olt || !olt.telnet_user || !olt.telnet_pass) throw new Error('OLT credentials missing');

  const connection = new Telnet();
  try {
    await connection.connect({ host: olt.ip_address, port: 23, shellPrompt: /#\s*$/, loginPrompt: /Username[:\s]*$/, passwordPrompt: /Password[:\s]*$/, timeout: 10000 });
    await connection.send(olt.telnet_user);
    await connection.send(olt.telnet_pass);

    // ZTE Command for rebooting a specific ONU
    await connection.exec(`interface gpon-olt_${ponPort}`);
    const res = await connection.exec(`onu reboot ${onuId}`);
    
    console.log(`[OLT-Reboot] Successfully sent reboot to ${ponPort}:${onuId} on ${olt.name}`);
    return { success: true, details: res };
  } catch (err: any) {
    console.error(`[OLT-Reboot] Error: ${err.message}`);
    throw err;
  } finally {
    await connection.destroy();
  }
}
