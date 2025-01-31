const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const crypto = require('crypto');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const moment = require('moment');
moment.locale('es'); // Esto es para configurar el idioma en español
const xlsx = require('xlsx');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Busboy = require('busboy');

const { Storage } = require('@google-cloud/storage');
const csvParser = require('csv-parser');
const PdfPrinter = require('pdfmake')
// Configura Multer para manejar la subida de archivos
const upload = multer({ storage: multer.memoryStorage() });

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

exports.delete = async (req, res) => {
  cors(corsOptions)(req, res, async () => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'El ID del usuario es obligatorio' });
    }

    const uri = 'mongodb+srv://ninis:123698745Abc@cluster0.l3pzmhv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

    try {
      const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      const db = client.db('basedatos');
      const usersCollection = db.collection('users');

      const existingUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!existingUser) {
        await client.close();
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      await usersCollection.deleteOne({ _id: new ObjectId(userId) });

      await client.close();
      res.status(200).json({ 
        message: 'Usuario eliminado exitosamente',
        deletedUserId: userId 
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });
};