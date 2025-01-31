const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const moment = require('moment');
moment.locale('es');
const xlsx = require('xlsx');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Busboy = require('busboy');

const { Storage } = require('@google-cloud/storage');
const csvParser = require('csv-parser');
const PdfPrinter = require('pdfmake');

const upload = multer({ storage: multer.memoryStorage() });

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
}

const corsMiddleware = cors(corsOptions);

exports.update = async (req, res) => {
  corsMiddleware(req, res, async () => {
    console.log("🔹 [LOG] Iniciando función update...");

    console.log("🔹 [LOG] URL:", req.url);
    console.log("🔹 [LOG] Path:", req.path);
    console.log("🔹 [LOG] Params:", req.params);
    console.log("🔹 [LOG] Body recibido:", req.body);

    const { userId } = req.params;
    const { nombre, apellido_paterno, apellido_materno, email, password, checkMedico } = req.body;

    if (!userId) {
      console.error("❌ [ERROR] El ID del usuario es obligatorio");
      return res.status(400).json({ message: 'El ID del usuario es obligatorio' });
    }

    const uri = 'mongodb+srv://ninis:123698745Abc@cluster0.l3pzmhv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

    try {
      console.log("🔹 [LOG] Conectando a MongoDB...");
      const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      const db = client.db('basedatos');
      const usersCollection = db.collection('users');

      console.log(`🔹 [LOG] Buscando usuario con ID: ${userId}`);
      const existingUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (!existingUser) {
        console.error("❌ [ERROR] Usuario no encontrado");
        await client.close();
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      let updateFields = {};
      if (nombre) updateFields.nombre = nombre;
      if (apellido_paterno) updateFields.apellido_paterno = apellido_paterno;
      if (apellido_materno) updateFields.apellido_materno = apellido_materno;
      if (email) updateFields.email = email;
      if (checkMedico !== undefined) updateFields.esDoctor = checkMedico;
      if (password) {
        const hash = crypto.createHash('sha256');
        hash.update(password);
        updateFields.password = hash.digest('hex');
      }

      updateFields.fecha_actualizacion = moment().utcOffset('-06:00').toDate();

      console.log("🔹 [LOG] Campos a actualizar:", updateFields);

      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateFields }
      );

      console.log("🔹 [LOG] Usuario actualizado, buscando información final...");
      const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

      await client.close();

      console.log("✅ [LOG] Usuario actualizado exitosamente:", updatedUser);

      res.status(200).json({
        message: 'Usuario actualizado exitosamente',
        user: {
          _id: updatedUser._id,
          nombre: updatedUser.nombre,
          apellido: `${updatedUser.apellido_paterno || ''} ${updatedUser.apellido_materno || ''}`.trim(),
          email: updatedUser.email
        }
      });

    } catch (err) {
      console.error("❌ [ERROR] Error en la actualización:", err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });
};
