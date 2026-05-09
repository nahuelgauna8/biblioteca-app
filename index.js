// ================= IMPORTACIONES =================

// Carga variables de entorno (.env)
require('dotenv').config();

// Librerías necesarias
const express = require('express');     // framework backend
const { Pool } = require('pg');         // conexión a PostgreSQL
const cors = require('cors');           // permitir conexiones externas
const bcrypt = require('bcryptjs');     // encriptar contraseñas
const jwt = require('jsonwebtoken');    // generar tokens
const path = require('path');           // manejar rutas de archivos

// ================= CONFIGURACIÓN =================

// Crear aplicación express
const app = express();

// Middleware básicos
app.use(cors());             // habilita CORS
app.use(express.json());     // permite recibir JSON

// Servir frontend (carpeta public)
app.use(express.static(path.join(__dirname, 'public')));

// ================= BASE DE DATOS =================

// Configuración de PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'biblioteca',
  password: '1234',
  port: 5432,
});

// ================= MIDDLEWARE JWT =================

// Verifica si el usuario tiene token válido
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Si no hay token
  if (!authHeader) {
    return res.status(403).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ================= RUTAS =================

// -------- LIBROS --------

// Obtener todos los libros (requiere token)
app.get('/libros', verificarToken, async (req, res) => {
  const result = await pool.query('SELECT * FROM libros');
  res.json(result.rows);
});

// Crear libro
app.post('/libros', verificarToken, async (req, res) => {
  const { titulo, autor, stock, id_categoria } = req.body;

  try {
    await pool.query(
      'INSERT INTO libros (titulo, autor, stock, id_categoria) VALUES ($1, $2, $3, $4)',
      [titulo, autor, stock, id_categoria]
    );

    res.json({ mensaje: 'Libro creado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Editar libro
app.put('/libros/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { titulo, autor, stock, id_categoria } = req.body;

  try {
    await pool.query(
      'UPDATE libros SET titulo=$1, autor=$2, stock=$3, id_categoria=$4 WHERE id=$5',
      [titulo, autor, stock, id_categoria, id]
    );

    res.json({ mensaje: 'Libro actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar libro
app.delete('/libros/:id', verificarToken, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      'DELETE FROM libros WHERE id = $1',
      [id]
    );

    res.json({ mensaje: 'Libro eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// -------- PRÉSTAMOS (CON TRANSACCIÓN) --------

// Prestar libro (usa transacción)
app.post('/prestar', async (req, res) => {
  const { id_usuario, id_libro } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // verificar stock
    const result = await client.query(
      'SELECT stock FROM libros WHERE id = $1',
      [id_libro]
    );

    if (result.rows.length === 0) {
      throw new Error('El libro no existe');
    }

    if (result.rows[0].stock <= 0) {
      throw new Error('No hay stock disponible');
    }

    // insertar préstamo
    await client.query(
      'INSERT INTO prestamos (id_usuario, id_libro) VALUES ($1, $2)',
      [id_usuario, id_libro]
    );

    // descontar stock
    await client.query(
      'UPDATE libros SET stock = stock - 1 WHERE id = $1',
      [id_libro]
    );

    await client.query('COMMIT');

    res.json({ mensaje: 'Libro prestado correctamente (transacción)' });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Devolver libro
app.put('/devolver/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      "UPDATE prestamos SET estado = 'devuelto' WHERE id = $1",
      [id]
    );

    res.json({ mensaje: 'Libro devuelto correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// -------- USUARIOS --------

// Registrar usuario
app.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)',
      [nombre, email, hashedPassword]
    );

    res.json({ mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login usuario
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    // generar token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
  token,
  user: {
    id: user.id,
    email: user.email,
    nombre: user.nombre
  }
});

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ================= SERVIDOR =================

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});