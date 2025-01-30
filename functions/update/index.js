exports.updateUser = async (req, res) => {
  cors(corsOptions)(req, res, async () => {
    const { userId } = req.params; // Se recibe el ID del usuario desde la URL
    const { nombre, apellido_paterno, apellido_materno, email, password, checkMedico } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'El ID del usuario es obligatorio' });
    }

    // Conexión a MongoDB
    const uri = 'mongodb+srv://ninis:123698745Abc@cluster0.l3pzmhv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

    try {
      const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      const db = client.db('basedatos');
      const usersCollection = db.collection('users');

      // Verificar si el usuario existe
      const existingUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!existingUser) {
        await client.close();
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Crear objeto con los campos a actualizar
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

      // Actualizar la fecha de modificación
      updateFields.fecha_actualizacion = moment().utcOffset('-06:00').toDate();

      // Realizar la actualización en la base de datos
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateFields }
      );

      // Obtener el usuario actualizado para devolverlo en la respuesta
      const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

      await client.close();
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
      console.error(err);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });
};
