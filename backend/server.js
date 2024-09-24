const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importar CORS

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Habilitar CORS
app.use(bodyParser.json());

// Conexión a MongoDB
mongoose.connect('mongodb+srv://frangvleano:jazmin170115.@cluster0.8kfl4.mongodb.net/qrtracking?retryWrites=true&w=majority&appName=Cluster0')
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('No se pudo conectar a MongoDB:', err));

// Esquema y modelo para los dispositivos
const deviceSchema = new mongoose.Schema({
    deviceID: { type: String, unique: true }, // Asegurarse que el ID sea único
    scanned: { type: Boolean, default: false },
});

const Device = mongoose.model('Device', deviceSchema, 'qrtracking');

// Endpoint para verificar y registrar dispositivos
app.post('/check-device', async (req, res) => {
    const { deviceID } = req.body;
    console.log(`Verificando dispositivo: ${deviceID}`);

    try {
        let device = await Device.findOne({ deviceID });

        if (!device) {
            console.log(`Dispositivo no encontrado: ${deviceID}`);
            
            // Registrar dispositivo nuevo
            device = new Device({ deviceID });
            try {
                await device.save();
                console.log(`Código guardado correctamente: ${deviceID}`);
                return res.json({ firstTime: true });
            } catch (err) {
                console.error('Error al guardar el dispositivo:', err);
                return res.status(500).json({ error: 'No se pudo guardar el dispositivo' });
            }
        }

        console.log(`Dispositivo encontrado: ${deviceID}`);
        res.json({ firstTime: false });
    } catch (error) {
        console.error('Error al verificar el dispositivo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para marcar un dispositivo como escaneado
app.post('/mark-scanned', async (req, res) => {
    const { deviceID } = req.body;
    console.log(`Marcando dispositivo como escaneado: ${deviceID}`);

    try {
        const device = await Device.findOne({ deviceID });

        if (!device) {
            console.log(`Dispositivo no encontrado para marcar: ${deviceID}`);
            return res.status(404).json({ error: 'Dispositivo no encontrado' });
        }

        if (device.scanned) {
            console.log(`El dispositivo ya ha sido escaneado: ${deviceID}`);
            return res.status(400).json({ error: 'El dispositivo ya ha sido escaneado' });
        }

        device.scanned = true;
        await device.save();
        
        console.log(`Dispositivo marcado como escaneado: ${deviceID}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error al marcar el dispositivo como escaneado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
