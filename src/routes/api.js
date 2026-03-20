import { Router } from 'express';
import prisma from '../db/prisma.js';
const router = Router();
// 1. POST /api/provisioning
// Endpoint to register a new customer, save their coordinates, and link them to a specific ODP and OLT.
router.post('/provisioning', async (req, res) => {
    try {
        const { billing_id, name, pppoe_username, olt_id, odp_id, odp_port, sn_mac, rx_installation, location_lat, location_long, } = req.body;
        // Basic validation
        if (!billing_id || !name || !pppoe_username || !olt_id || !odp_id || odp_port === undefined || !sn_mac || location_lat === undefined || location_long === undefined) {
            return res.status(400).json({ error: 'Missing required provision attributes' });
        }
        const newCustomer = await prisma.customer.create({
            data: {
                billing_id,
                name,
                pppoe_username,
                olt_id,
                odp_id,
                odp_port,
                sn_mac,
                rx_installation,
                location_lat,
                location_long,
            },
        });
        res.status(201).json({ message: 'Customer provisioned successfully', data: newCustomer });
    }
    catch (error) {
        console.error('Provisioning Error:', error);
        res.status(500).json({ error: 'Failed to provision customer', details: error.message });
    }
});
// 2. GET /api/network-map
// Endpoint to fetch all ODPs and Customers, returning structured data to draw the map and lines.
router.get('/network-map', async (req, res) => {
    try {
        const odps = await prisma.odp.findMany({
            include: {
                customers: {
                    include: {
                        metrics: {
                            orderBy: { created_at: 'desc' },
                            take: 1, // Only get the latest metric
                        },
                    },
                },
            },
        });
        // We can format this to be map-friendly
        const mapData = odps.map(odp => ({
            id: odp.id,
            name: odp.name,
            location: [odp.location_lat, odp.location_long],
            type: 'ODP',
            total_ports: odp.total_ports,
            customers: odp.customers.map(c => {
                const latestMetric = c.metrics[0];
                return {
                    id: c.id,
                    name: c.name,
                    location: [c.location_lat, c.location_long],
                    type: 'CUSTOMER',
                    status: latestMetric ? latestMetric.status : 'OFFLINE',
                    rx_live: latestMetric ? latestMetric.rx_live : null,
                    rx_installation: c.rx_installation,
                    odp_port: c.odp_port,
                };
            }),
        }));
        res.json({ data: mapData });
    }
    catch (error) {
        console.error('Network Map Error:', error);
        res.status(500).json({ error: 'Failed to fetch network map' });
    }
});
// 3. POST /api/acs/change-wifi
// Endpoint to accept customer_id, new_ssid, and new_password and push TR-069 SetParameterValues to GenieACS
router.post('/acs/change-wifi', async (req, res) => {
    try {
        const { customer_id, new_ssid, new_password } = req.body;
        if (!customer_id || !new_ssid || !new_password) {
            return res.status(400).json({ error: 'Missing required wifi parameters' });
        }
        const customer = await prisma.customer.findUnique({
            where: { id: customer_id },
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        // Usually, GenieACS device ID is mapped by OUI-ProductClass-SerialNumber or MAC
        // Assuming sn_mac is used as the GenieACS device identifier
        const deviceId = customer.sn_mac;
        // Example Node.js fetch call to GenieACS NBI (Northbound Interface)
        // The exact URL and authorization depends on the local GenieACS setup
        const acsUrl = process.env.GENIE_ACS_URL || 'http://localhost:7557';
        const acsTasksUrl = `${acsUrl}/devices/${encodeURIComponent(deviceId)}/tasks`;
        // TR-069 parameters for WiFi (varies by vendor, standard IGD/Device.WiFi)
        // Note: The specific parameter paths often depend on the specific modem model.
        const wifiParameters = [
            { name: 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID', value: new_ssid },
            { name: 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.PreSharedKey', value: new_password }
        ];
        console.log(`[TR-069] Dispatching SetParameterValues for ${deviceId}`);
        // Fetch API logic to GenieACS
        const response = await fetch(acsTasksUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${process.env.GENIE_ACS_AUTH_TOKEN}`,
            },
            body: JSON.stringify({
                name: 'setParameterValues',
                parameterValues: wifiParameters
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('GenieACS Error:', errorText);
            return res.status(response.status).json({ error: 'Failed to communicate with GenieACS server' });
        }
        res.json({ message: 'WiFi change task queued successfully via TR-069' });
    }
    catch (error) {
        console.error('Change WiFi Error:', error);
        res.status(500).json({ error: 'Failed to change WiFi password', details: error.message });
    }
});
export default router;
//# sourceMappingURL=api.js.map