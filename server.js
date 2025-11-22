// =============================================
// SERVER.JS - BACKEND MAC GARDEN
// Node.js + Express + MySQL
// =============================================

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
require("dotenv").config();


const app = express();
const PORT = 3000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors()); // Permite conexiones desde el navegador
app.use(express.json()); // Para leer JSON del frontend
app.use(express.static('public')); // Sirve archivos HTML/CSS/JS

// =============================================
// CONEXIÓN A LA BASE DE DATOS
// Cambia estos valores según tu configuración
// =============================================
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
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
// RUTAS - PRODUCTOS
// =============================================

// GET: Obtener todos los productos activos
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
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error obteniendo productos' });
    }
});

// GET: Obtener un producto específico con variantes
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

        const producto = productos[0];

        // Obtener variantes
        const [variantes] = await pool.query(`
            SELECT * FROM variantes_producto
            WHERE producto_id = ? AND activo = 1
        `, [req.params.id]);

        // Obtener imágenes
        const [imagenes] = await pool.query(`
            SELECT * FROM imagenes_producto
            WHERE producto_id = ?
            ORDER BY orden ASC
        `, [req.params.id]);

        producto.variantes = variantes;
        producto.imagenes = imagenes;

        res.json(producto);
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ error: 'Error obteniendo producto' });
    }
});

// GET: Obtener variantes de un producto
app.get('/api/productos/:id/variantes', async (req, res) => {
    try {
        const [variantes] = await pool.query(`
            SELECT * FROM variantes_producto
            WHERE producto_id = ? AND activo = 1
        `, [req.params.id]);
        res.json(variantes);
    } catch (error) {
        console.error('Error obteniendo variantes:', error);
        res.status(500).json({ error: 'Error obteniendo variantes' });
    }
});

// POST: Crear nuevo producto (ADMIN)
app.post('/api/productos', async (req, res) => {
    try {
        const { categoria_id, nombre, descripcion, precio_base, precio_mayorista, imagen_principal, stock_disponible } = req.body;

        const [result] = await pool.query(`
            INSERT INTO productos (categoria_id, nombre, descripcion, precio_base, precio_mayorista, imagen_principal, stock_disponible)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [categoria_id, nombre, descripcion, precio_base, precio_mayorista, imagen_principal, stock_disponible]);

        res.status(201).json({ 
            success: true, 
            id: result.insertId,
            message: 'Producto creado exitosamente' 
        });
    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ error: 'Error creando producto' });
    }
});

// PUT: Actualizar producto (ADMIN)
app.put('/api/productos/:id', async (req, res) => {
    try {
        const { nombre, descripcion, precio_base, precio_mayorista, stock_disponible } = req.body;

        await pool.query(`
            UPDATE productos 
            SET nombre = ?, descripcion = ?, precio_base = ?, precio_mayorista = ?, stock_disponible = ?
            WHERE id = ?
        `, [nombre, descripcion, precio_base, precio_mayorista, stock_disponible, req.params.id]);

        res.json({ success: true, message: 'Producto actualizado' });
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ error: 'Error actualizando producto' });
    }
});

// =============================================
// RUTAS - CATEGORÍAS
// =============================================

// GET: Obtener todas las categorías
app.get('/api/categorias', async (req, res) => {
    try {
        const [categorias] = await pool.query(`
            SELECT * FROM categorias
            WHERE activo = 1
            ORDER BY orden ASC, nombre ASC
        `);
        res.json(categorias);
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json({ error: 'Error obteniendo categorías' });
    }
});

// GET: Productos de una categoría
app.get('/api/categorias/:id/productos', async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT p.* FROM productos p
            WHERE p.categoria_id = ? AND p.activo = 1
            ORDER BY p.destacado DESC, p.nombre ASC
        `, [req.params.id]);
        res.json(productos);
    } catch (error) {
        console.error('Error obteniendo productos de categoría:', error);
        res.status(500).json({ error: 'Error obteniendo productos' });
    }
});

// =============================================
// RUTAS - USUARIOS
// =============================================

// POST: Registrar nuevo usuario
app.post('/api/usuarios/registro', async (req, res) => {
    try {
        const { nombre, email, telefono, password, direccion, ciudad, tipo_cliente } = req.body;

        // Verificar si el email ya existe
        const [existe] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Encriptar contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // Insertar usuario
        const [result] = await pool.query(`
            INSERT INTO usuarios (nombre, email, telefono, password_hash, direccion, ciudad, tipo_cliente)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [nombre, email, telefono, password_hash, direccion, ciudad, tipo_cliente || 'minorista']);

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

// POST: Login de usuario
app.post('/api/usuarios/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const [usuarios] = await pool.query(`
            SELECT * FROM usuarios WHERE email = ? AND activo = 1
        `, [email]);

        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = usuarios[0];

        // Verificar contraseña
        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // No enviar el password_hash al frontend
        delete usuario.password_hash;

        res.json({ 
            success: true, 
            usuario: usuario,
            message: 'Login exitoso' 
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en login' });
    }
});

// GET: Obtener perfil de usuario
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const [usuarios] = await pool.query(`
            SELECT id, nombre, email, telefono, direccion, ciudad, tipo_cliente, fecha_registro
            FROM usuarios WHERE id = ? AND activo = 1
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
// RUTAS - PEDIDOS
// =============================================

// POST: Crear nuevo pedido
app.post('/api/pedidos', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { usuario_id, items, direccion_entrega, notas } = req.body;

        // Calcular total
        let total = 0;
        for (const item of items) {
            total += item.precio_unitario * item.cantidad;
        }

        // Generar número de pedido
        const numero_pedido = `PED-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Insertar pedido
        const [pedidoResult] = await connection.query(`
            INSERT INTO pedidos (usuario_id, numero_pedido, subtotal, total, direccion_entrega, notas)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [usuario_id, numero_pedido, total, total, direccion_entrega, notas]);

        const pedido_id = pedidoResult.insertId;

        // Insertar detalles del pedido
        for (const item of items) {
            await connection.query(`
                INSERT INTO detalle_pedidos (pedido_id, producto_id, variante_id, cantidad, precio_unitario)
                VALUES (?, ?, ?, ?, ?)
            `, [pedido_id, item.producto_id, item.variante_id, item.cantidad, item.precio_unitario]);

            // Actualizar stock
            await connection.query(`
                UPDATE productos SET stock_disponible = stock_disponible - ?
                WHERE id = ?
            `, [item.cantidad, item.producto_id]);

            if (item.variante_id) {
                await connection.query(`
                    UPDATE variantes_producto SET stock = stock - ?
                    WHERE id = ?
                `, [item.cantidad, item.variante_id]);
            }

            // Registrar movimiento de inventario
            await connection.query(`
                INSERT INTO inventario_movimientos (producto_id, variante_id, tipo_movimiento, cantidad, motivo)
                VALUES (?, ?, 'salida', ?, 'Venta')
            `, [item.producto_id, item.variante_id, item.cantidad]);
        }

        await connection.commit();

        res.status(201).json({ 
            success: true, 
            pedido_id: pedido_id,
            numero_pedido: numero_pedido,
            message: 'Pedido creado exitosamente' 
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creando pedido:', error);
        res.status(500).json({ error: 'Error creando pedido' });
    } finally {
        connection.release();
    }
});

// GET: Obtener pedidos de un usuario
app.get('/api/usuarios/:id/pedidos', async (req, res) => {
    try {
        const [pedidos] = await pool.query(`
            SELECT 
                p.*,
                COUNT(d.id) AS cantidad_items
            FROM pedidos p
            LEFT JOIN detalle_pedidos d ON p.id = d.pedido_id
            WHERE p.usuario_id = ?
            GROUP BY p.id
            ORDER BY p.fecha_pedido DESC
        `, [req.params.id]);

        res.json(pedidos);
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        res.status(500).json({ error: 'Error obteniendo pedidos' });
    }
});

// GET: Obtener detalle de un pedido
app.get('/api/pedidos/:id', async (req, res) => {
    try {
        // Obtener pedido
        const [pedidos] = await pool.query(`
            SELECT p.*, u.nombre AS cliente_nombre, u.email AS cliente_email
            FROM pedidos p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (pedidos.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const pedido = pedidos[0];

        // Obtener detalles
        const [detalles] = await pool.query(`
            SELECT 
                d.*,
                p.nombre AS producto_nombre,
                p.imagen_principal,
                v.nombre_variante
            FROM detalle_pedidos d
            LEFT JOIN productos p ON d.producto_id = p.id
            LEFT JOIN variantes_producto v ON d.variante_id = v.id
            WHERE d.pedido_id = ?
        `, [req.params.id]);

        pedido.detalles = detalles;

        res.json(pedido);
    } catch (error) {
        console.error('Error obteniendo pedido:', error);
        res.status(500).json({ error: 'Error obteniendo pedido' });
    }
});

// PUT: Actualizar estado de pedido (ADMIN)
app.put('/api/pedidos/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;

        await pool.query(`
            UPDATE pedidos SET estado = ?
            WHERE id = ?
        `, [estado, req.params.id]);

        res.json({ success: true, message: 'Estado actualizado' });
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ error: 'Error actualizando estado' });
    }
});

// =============================================
// RUTAS - INVENTARIO
// =============================================

// POST: Agregar stock (ADMIN)
app.post('/api/inventario/agregar', async (req, res) => {
    try {
        const { producto_id, variante_id, cantidad, motivo } = req.body;

        // Actualizar stock del producto
        await pool.query(`
            UPDATE productos SET stock_disponible = stock_disponible + ?
            WHERE id = ?
        `, [cantidad, producto_id]);

        // Si hay variante, actualizar también
        if (variante_id) {
            await pool.query(`
                UPDATE variantes_producto SET stock = stock + ?
                WHERE id = ?
            `, [cantidad, variante_id]);
        }

        // Registrar movimiento
        await pool.query(`
            INSERT INTO inventario_movimientos (producto_id, variante_id, tipo_movimiento, cantidad, motivo)
            VALUES (?, ?, 'entrada', ?, ?)
        `, [producto_id, variante_id, cantidad, motivo]);

        res.json({ success: true, message: 'Stock actualizado' });
    } catch (error) {
        console.error('Error agregando stock:', error);
        res.status(500).json({ error: 'Error agregando stock' });
    }
});

// GET: Historial de movimientos de inventario
app.get('/api/inventario/movimientos', async (req, res) => {
    try {
        const [movimientos] = await pool.query(`
            SELECT 
                im.*,
                p.nombre AS producto_nombre,
                v.nombre_variante
            FROM inventario_movimientos im
            LEFT JOIN productos p ON im.producto_id = p.id
            LEFT JOIN variantes_producto v ON im.variante_id = v.id
            ORDER BY im.fecha DESC
            LIMIT 100
        `);

        res.json(movimientos);
    } catch (error) {
        console.error('Error obteniendo movimientos:', error);
        res.status(500).json({ error: 'Error obteniendo movimientos' });
    }
});

// GET: Productos con stock bajo
app.get('/api/inventario/stock-bajo', async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT * FROM productos
            WHERE stock_disponible <= stock_minimo AND activo = 1
            ORDER BY stock_disponible ASC
        `);

        res.json(productos);
    } catch (error) {
        console.error('Error obteniendo stock bajo:', error);
        res.status(500).json({ error: 'Error obteniendo stock bajo' });
    }
});

// =============================================
// RUTAS - ESTADÍSTICAS (ADMIN)
// =============================================

// GET: Dashboard de estadísticas
app.get('/api/estadisticas/dashboard', async (req, res) => {
    try {
        // Total de ventas
        const [ventas] = await pool.query(`
            SELECT 
                COUNT(*) AS total_pedidos,
                SUM(total) AS total_ventas,
                AVG(total) AS promedio_venta
            FROM pedidos
            WHERE estado != 'cancelado'
        `);

        // Productos más vendidos
        const [topProductos] = await pool.query(`
            SELECT 
                p.nombre,
                SUM(d.cantidad) AS total_vendido
            FROM detalle_pedidos d
            JOIN productos p ON d.producto_id = p.id
            JOIN pedidos pe ON d.pedido_id = pe.id
            WHERE pe.estado != 'cancelado'
            GROUP BY p.id
            ORDER BY total_vendido DESC
            LIMIT 5
        `);

        // Total de clientes
        const [clientes] = await pool.query(`
            SELECT COUNT(*) AS total_clientes FROM usuarios WHERE activo = 1
        `);

        // Stock total
        const [stock] = await pool.query(`
            SELECT SUM(stock_disponible) AS stock_total FROM productos WHERE activo = 1
        `);

        res.json({
            ventas: ventas[0],
            top_productos: topProductos,
            total_clientes: clientes[0].total_clientes,
            stock_total: stock[0].stock_total
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// =============================================
// INICIAR SERVIDOR
// =============================================
app.listen(PORT, () => {
    console.log(`🌱 Servidor MAC Garden corriendo en http://localhost:${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}/api`);
});