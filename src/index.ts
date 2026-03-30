import 'dotenv/config';
import express from 'express';
import prisma from './db/prisma.js';
import { startSnmpWorker } from './services/worker.js';
import apiRouter from './routes/api.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Start the background worker
startSnmpWorker();

// Auto-seed Office Location if DB is empty
const autoSeed = async () => {
  try {
    const existing = await (prisma.router as any).findFirst();
    if (!existing) {
      await (prisma.router as any).create({
        data: {
          name: 'KANTOR PUSAT / CORE SERVER',
          ip_address: '10.50.10.1',
          username: 'admin',
          password: 'password',
          location_lat: -6.1285,
          location_long: 106.46358
        }
      });
      console.log('✅ Auto-Seed: Kantor Pusat successfully pinned to map!');
    }
  } catch (err) {
    console.error('❌ Auto-Seed Error:', err);
  }
};
autoSeed();

// API Routes
// API Routes
app.use('/api', apiRouter);

// Diagnostic route
app.get('/api/test-db', async (req, res) => {
  try {
    const count = await (prisma as any).olt.count();
    res.json({ status: 'connected', olt_count: count });
  } catch (error: any) {
    console.error('Diagnostic DB Error:', error);
    res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('!!! GLOBAL ERROR !!!', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Backend service listening on port ${PORT}`);
});
