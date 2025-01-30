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
}


const storage = new Storage();
const bucketName = 'clinic-backup';
const tracesFolder = 'clinic_folder';

exports.register = async (req, res) => {
  cors(corsOptions) // Para permitir el acceso a la API desde cualquier origen
      (req, res, async () => {
        const { nombre, apellido_paterno, apellido_materno, email, password, checkMedico} = req.body;

        if (!nombre || !email || !password) { // Hay que validar los demás campos
          return res.status(400).json({ message: 'Nombre, apellido, email y contraseña son obligatorios' });
        }

        // Reemplaza con tus credenciales y la dirección de conexión a MongoDB Atlas
        const uri = 'mongodb+srv://ninis:123698745Abc@cluster0.l3pzmhv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
        try {
          const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

          const db = client.db('basedatos');
          const usersCollection = db.collection('users');

          // Comprueba si el correo electrónico ya está registrado
          const existingUser = await usersCollection.findOne({ email });

          if (existingUser) {
            res.status(409).json({ message: 'El correo electrónico ya está registrado' });
          } else {
            const hash = crypto.createHash('sha256');
            hash.update(password);
            const hashedPassword = hash.digest('hex');
            const fechaUTC = moment(new Date()); // 'fecha' es la fecha en formato UTC
            const fechaCiudadMexico = fechaUTC.utcOffset('-06:00'); // Ajustar a la hora de la Ciudad de México (GMT-6)

            const newUser = {
              nombre,
              apellido_paterno,
              apellido_materno,
              email,
              esDoctor: checkMedico,
              password: hashedPassword,
              fecha_registro: fechaCiudadMexico.toDate(),
              fecha_actualizacion: fechaCiudadMexico.toDate(),
              ensayos: [],
              segmentos: []
            };

            await usersCollection.insertOne(newUser);
            res.status(201).json({ message: 'Usuario registrado exitosamente' });
          }

          await client.close();
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: 'Error interno del servidor' });
        }
      });

};
