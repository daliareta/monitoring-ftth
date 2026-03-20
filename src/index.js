import express from 'express';
import dotenv from 'dotenv';
import { startSnmpWorker } from './services/worker.js';
import apiRouter from './routes/api.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
// Start the background worker
startSnmpWorker();
// API Routes
app.use('/api', apiRouter);
// Placeholder for future API endpoints
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.listen(PORT, () => {
    console.log(`Backend service listening on port ${PORT}`);
});
//# sourceMappingURL=index.js.map