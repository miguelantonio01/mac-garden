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

// ==========================
// MIDDLEWARE
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// =============================================
// CONEXIÓN A LA BASE DE DATOS
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
        console.log('✅ Conectado a MySQL');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Error conectando a MySQL:', err);
    });


// =============================================
// GET: Lista de productos
// =============================================
app.get('/api/productos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion, imagen_principal, precio_base, activo
            FROM productos
            WHERE activo = 1
            ORDER BY nombre ASC
        `);

        res.json(rows);
    } catch (error) {
        console.error("Error obteniendo productos:", error);
        res.status(500).json({ error: "Error obteniendo productos" });
    }
});

// =============================================
// GET: Producto individual
// =============================================
app.get('/api/productos/:id', async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT p.*, c.nombre AS categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = ? AND p.activo = 1
        `, [req.params.id]);

        if (productos.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(productos[0]);

    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ error: 'Error obteniendo producto' });
    }
});


// =============================================
// GET: Variantes de un producto
// =============================================
// =============================================
// GET: Variantes de un producto
// =============================================
app.get('/api/productos/:id/variantes', async (req, res) => {
    try {
        const productoId = req.params.id;

        const [variantes] = await pool.query(`
            SELECT 
                id,
                nombre_variante,
                precio_adicional,
                stock,
                activo
            FROM variantes_producto
            WHERE producto_id = ? AND activo = 1
        `, [productoId]);

        res.json(variantes);

    } catch (error) {
        console.error("Error obteniendo variantes:", error);
        res.status(500).json({ error: "Error obteniendo variantes" });
    }
});



// =============================================
// INICIAR SERVIDOR
// =============================================
app.listen(PORT, () => {
    console.log(`🌱 Servidor MAC Garden corriendo en http://localhost:${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}/api`);
});

