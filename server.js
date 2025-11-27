// =============================================
// SERVER.JS - BACKEND MAC GARDEN
// =============================================

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// =============================================
// CONEXIÓN A MYSQL (POOL)
// =============================================
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test de conexión
pool.getConnection()
    .then(conn => {
        console.log('✅ Conectado a MySQL correctamente');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Error conectando a MySQL:', err);
    });

// =============================================
// GET: Todos los productos
// =============================================
app.get('/api/productos', async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT 
                p.*, 
                c.nombre AS categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = 1
            ORDER BY p.destacado DESC, p.nombre ASC
        `);

        res.json(productos);
    } catch (error) {
        console.error("❌ Error obteniendo productos:", error);
        res.status(500).json({ error: "Error obteniendo productos" });
    }
});

// =============================================
// GET: Variantes de un producto
// =============================================
app.get('/api/productos/:id/variantes', async (req, res) => {
    try {
        const [variantes] = await pool.query(`
            SELECT 
                id,
                nombre_variante,
                precio_adicional,
                stock,
                activo
            FROM variantes_producto
            WHERE producto_id = ? 
              AND activo = 1
        `, [req.params.id]);

        res.json(variantes);

    } catch (error) {
        console.error("❌ Error obteniendo variantes:", error);
        res.status(500).json({ error: "Error obteniendo variantes" });
    }
});

// =============================================
// GET: Producto individual
// =============================================
app.get('/api/productos/:id', async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT 
                p.*, 
                c.nombre AS categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = ? AND p.activo = 1
        `, [req.params.id]);

        if (productos.length === 0)
            return res.status(404).json({ error: "Producto no encontrado" });

        res.json(productos[0]);

    } catch (error) {
        console.error("❌ Error obteniendo producto:", error);
        res.status(500).json({ error: "Error obteniendo producto" });
    }
});

// =============================================
// RUTAS - USUARIOS
// =============================================

// POST: Registrar nuevo usuario
app.post('/api/usuarios/registro', async (req, res) => {
  try {
    const { nombre, email, telefono, password, direccion, ciudad, tipo_cliente } = req.body;

    // ¿Ya existe ese email?
    const [existe] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existe.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Encriptar contraseña
    const password_hash = await bcrypt.hash(password, 10);

    const tipo = tipo_cliente === 'mayorista' ? 'mayorista' : 'minorista';

    // Insertar usuario
    const [result] = await pool.query(`
      INSERT INTO usuarios 
        (nombre, email, telefono, password_hash, direccion, ciudad, tipo_cliente)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [nombre, email, telefono || '', password_hash, direccion || '', ciudad || '', tipo]);

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Usuario registrado exitosamente'
    });

  } catch (error) {
    console.error('Error registrando usuario:', error);
    res.status(500).json({ error: 'Error registrando usuario' });
  }
});

// POST: Login
app.post('/api/usuarios/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [usuarios] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = usuarios[0];

    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // No mandamos el hash al frontend
    delete usuario.password_hash;

    res.json({
      success: true,
      usuario,
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en login' });
  }
});

// GET: Perfil simple
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const [usuarios] = await pool.query(`
      SELECT id, nombre, email, telefono, direccion, ciudad, tipo_cliente, fecha_registro
      FROM usuarios
      WHERE id = ? AND activo = 1
    `, [req.params.id]);

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuarios[0]);

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
});

// =============================================
// INICIAR SERVIDOR
// =============================================
app.listen(PORT, () => {
    console.log(`🌱 Servidor MAC Garden corriendo en http://localhost:${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}/api`);
});
