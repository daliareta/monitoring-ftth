import prisma from './src/db/prisma.js';

async function seedOffice() {
  try {
    // Check if any router exists
    const existing = await (prisma.router as any).findFirst();
    if (existing) {
      console.log('Office/Router already exists.');
      return;
    }

    await (prisma.router as any).create({
      data: {
        name: 'KANTOR PUSAT / CORE SERVER',
        ip_address: '10.50.10.1', // Placeholder from earlier conversation
        username: 'admin',
        password: 'password',
        location_lat: -6.1285,
        location_long: 106.46358
      }
    });

    console.log('Kantor Pusat successfully pinned to map!');
  } catch (err) {
    console.error('Seed Error:', err);
  }
}

seedOffice();
