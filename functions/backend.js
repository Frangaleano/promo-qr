const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const serverless = require('serverless-http'); // Importar serverless-http

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conexión a MongoDB utilizando una variable de entorno
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('No se pudo conectar a MongoDB:', err));

// Esquema y modelo para los dispositivos
const deviceSchema = new mongoose.Schema({
    deviceID: { type: String, unique: true },
    scanned: { type: Boolean, default: false },
});

const Device = mongoose.model('Device', deviceSchema, 'qrtracking');

// Endpoint para verificar y registrar dispositivos
app.post('/check-device', async (req, res) => {
    const { deviceID } = req.body;
    try {
        let device = await Device.findOne({ deviceID });

        if (!device) {
            device = new Device({ deviceID });
            await device.save();
            return res.json({ firstTime: true });
        }

        res.json({ firstTime: false });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para marcar un dispositivo como escaneado
app.post('/mark-scanned', async (req, res) => {
    const { deviceID } = req.body;

    try {
        const device = await Device.findOne({ deviceID });

        if (!device) {
            return res.status(404).json({ error: 'Dispositivo no encontrado' });
        }

        if (device.scanned) {
            return res.status(400).json({ error: 'El dispositivo ya ha sido escaneado' });
        }

        device.scanned = true;
        await device.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Exportar la aplicación como una función serverless
module.exports.handler = serverless(app);
