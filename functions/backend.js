const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Conexión a MongoDB sin opciones obsoletas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('No se pudo conectar a MongoDB:', err));

const deviceSchema = new mongoose.Schema({
    deviceID: { type: String, unique: true },
    scanned: { type: Boolean, default: false },
});

const Device = mongoose.model('Device', deviceSchema, 'qrtracking');

// Nota: Aquí ajustamos las rutas para que sean relativas
app.post('/api/check-device', async (req, res) => {
    const { deviceID } = req.body;
    try {
        let device = await Device.findOne({ deviceID });

        if (!device) {
            device = new Device({ deviceID });
            await device.save();
            return res.json({ firstTime: true });
        }

        res.json({ firstTime: device.scanned ? false : true });
    } catch (error) {
        console.error('Error en check-device:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/mark-scanned', async (req, res) => {
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
        console.error('Error en mark-scanned:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Aquí está el módulo que permite manejar el serverless
module.exports.handler = serverless(app);
