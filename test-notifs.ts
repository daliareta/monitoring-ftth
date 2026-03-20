import prisma from './src/db/prisma.js';

async function testNotifications() {
  const notifications = [
    {
      title: 'Fiber Cut Detected',
      message: 'Multiple ONUs offline on OLT-ZTE-01 / PON-04. Potential cable break at ODP-MAWAR-02.',
      type: 'SIGNAL',
      severity: 'CRITICAL'
    },
    {
      title: 'New Client Sync',
      message: 'New PPPoE user "sanwanay-user-09" discovered on Router-Core.',
      type: 'NEW_CLIENT',
      severity: 'INFO'
    },
    {
      title: 'High Temperature Alert',
      message: 'MikroTik CCR Cabinet sensor reported 55°C. Check cooling system.',
      type: 'SYSTEM',
      severity: 'WARNING'
    }
  ];

  for (const n of notifications) {
    await (prisma as any).notification.create({ data: n });
  }

  console.log('Test notifications created!');
}

testNotifications();
