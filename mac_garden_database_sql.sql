-- =============================================
-- BASE DE DATOS MAC GARDEN
-- Sistema completo de tienda online de plantas
-- =============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS mac_garden CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mac_garden;

-- =============================================
-- TABLA: usuarios
-- Gestiona clientes (minoristas y mayoristas)
-- =============================================
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo_cliente ENUM('minorista', 'mayorista') DEFAULT 'minorista',
    activo BOOLEAN DEFAULT 1,
    INDEX idx_email (email),
    INDEX idx_tipo (tipo_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- TABLA: categorias
-- Organiza productos por tipo (suculentas, trepadoras, etc.)
-- =============================================
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    imagen VARCHAR(255),
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- TABLA: productos
-- Catálogo principal de plantas y esquejes
-- =============================================
CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    categoria_id INT,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    precio_mayorista DECIMAL(10,2),
    imagen_principal VARCHAR(255),
    stock_disponible INT DEFAULT 0,
    stock_minimo INT DEFAULT 5,
    destacado BOOLEAN DEFAULT 0,
    activo BOOLEAN DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_categoria (categoria_id),
    INDEX idx_destacado (destacado),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- TABLA: variantes_producto
-- Tamaños y opciones de cada producto (pequeño, mediano, grande)
-- =============================================
CREATE TABLE variantes_producto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    nombre_variante VARCHAR(100) NOT NULL,
    precio_adicional DECIMAL(10,2) DEFAULT 0,
    stock INT DEFAULT 0,
    sku VARCHAR(50) UNIQUE,
    activo BOOLEAN DEFAULT 1,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_producto (producto_id),
    INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- TABLA: imagenes_producto
-- Múltiples fotos por producto (galería)
-- =============================================
CREATE TABLE imagenes_producto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    url_imagen VARCHAR(255) NOT NULL,
    orden INT DEFAULT 0,
    es_principal BOOLEAN DEFAULT 0,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- TABLA: pedidos
-- Órdenes de compra de los clientes
-- =============================================
CREATE TABLE pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'confirmado', 'en_preparacion', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    direccion_entrega TEXT,
    notas TEXT,
    fecha_entrega DATE,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_pedido),
    INDEX idx_numero (numero_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- TABLA: detalle_pedidos
-- Productos individuales en cada pedido
-- =============================================
CREATE TABLE detalle_pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    variante_id INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (variante_id) REFERENCES variantes_producto(id) ON DELETE SET NULL,
    INDEX idx_pedido (pedido_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- TABLA: inventario_movimientos
-- Historial de entradas/salidas de stock
-- =============================================
CREATE TABLE inventario_movimientos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    variante_id INT,
    tipo_movimiento ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    cantidad INT NOT NULL,
    motivo VARCHAR(255),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_responsable INT,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (variante_id) REFERENCES variantes_producto(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_responsable) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_producto (producto_id),
    INDEX idx_fecha (fecha),
    INDEX idx_tipo (tipo_movimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- INSERTAR DATOS DE EJEMPLO
-- =============================================

-- Categorías
INSERT INTO categorias (nombre, descripcion, orden) VALUES
('Buganvilias', 'Plantas trepadoras con flores coloridas', 1),
('Suculentas', 'Plantas de bajo mantenimiento', 2),
('Plantas Colgantes', 'Ideales para macetas colgantes', 3),
('Follaje Decorativo', 'Plantas de interior con hojas llamativas', 4),
('Plantas Tropicales', 'Especies tropicales de clima cálido', 5);

-- Productos (basados en tu catálogo actual)
INSERT INTO productos (categoria_id, nombre, descripcion, precio_base, precio_mayorista, imagen_principal, stock_disponible, destacado) VALUES
(1, 'Buganvilia fucsia', 'Esqueje de buganvilia con flores fucsia vibrantes. Planta trepadora resistente.', 25.00, 20.00, 'img/buganvilia_fucsia.jpg', 50, 1),
(1, 'Buganvilia blanca', 'Esqueje de buganvilia de flores blancas elegantes.', 25.00, 20.00, 'img/buganvilia_blanca.jpg', 40, 1),
(2, 'Echeveria mix', 'Mezcla de echeverias de diferentes colores y formas.', 45.00, 38.00, 'img/echeveria_mix.jpg', 80, 1),
(2, 'Sedum', 'Suculenta de fácil propagación y mantenimiento.', 35.00, 28.00, 'img/sedum.jpg', 100, 0),
(3, 'Tradescantia púrpura', 'Planta colgante con hojas moradas llamativas.', 20.00, 15.00, 'img/tradescantia_purpura.jpg', 60, 1),
(2, 'Portulacaria (Jade)', 'Árbol de jade miniatura, ideal para bonsái.', 35.00, 28.00, 'img/portulacaria_(jade).jpg', 45, 0),
(4, 'Croton mini', 'Planta de follaje multicolor muy decorativa.', 30.00, 24.00, 'img/croton_mini.jpg', 35, 0),
(4, 'Ixora mini', 'Arbusto compacto con flores en racimo.', 30.00, 24.00, 'img/ixora_mini.jpg', 40, 0),
(4, 'Dracaena', 'Planta de interior resistente y elegante.', 40.00, 32.00, 'img/dracaena.jpg', 30, 0),
(2, 'Sansevieria baby', 'Lengua de suegra en tamaño miniatura.', 25.00, 20.00, 'img/sansevieria_baby.webp', 70, 1),
(2, 'Aloe vera juvenil', 'Planta medicinal en etapa juvenil.', 30.00, 24.00, 'img/aloe_vera_juvenil.jpg', 55, 0),
(5, 'Philodendron', 'Esqueje de philodendron, planta trepadora tropical.', 120.00, 95.00, 'img/philodendron_cutting.jpg', 25, 1),
(5, 'Monstera', 'Esqueje de monstera deliciosa, planta icónica.', 150.00, 120.00, 'img/monstera_cutting.jpg', 20, 1),
(3, 'Pothos marble queen', 'Pothos variegado con hojas blancas y verdes.', 90.00, 72.00, 'img/pothos_marble_queen.jpg', 35, 1),
(4, 'Coleus', 'Planta de follaje colorido para interiores y exteriores.', 22.00, 18.00, 'img/coleus.jpg', 65, 0);

-- Variantes para Buganvilias
INSERT INTO variantes_producto (producto_id, nombre_variante, precio_adicional, stock, sku) VALUES
(1, 'Pequeño', 0, 20, 'BUG-FUC-PEQ'),
(1, 'Mediano', 10.00, 20, 'BUG-FUC-MED'),
(1, 'Grande', 20.00, 10, 'BUG-FUC-GRA'),
(2, 'Pequeño', 0, 15, 'BUG-BLA-PEQ'),
(2, 'Mediano', 10.00, 15, 'BUG-BLA-MED'),
(2, 'Grande', 20.00, 10, 'BUG-BLA-GRA');

-- Variantes para Echeveria
INSERT INTO variantes_producto (producto_id, nombre_variante, precio_adicional, stock, sku) VALUES
(3, 'Esqueje pequeño', 0, 30, 'ECH-MIX-ESQ'),
(3, 'Maceta 3"', 15.00, 30, 'ECH-MIX-MAC3'),
(3, 'Maceta 5"', 30.00, 20, 'ECH-MIX-MAC5');

-- Variantes para Sedum
INSERT INTO variantes_producto (producto_id, nombre_variante, precio_adicional, stock, sku) VALUES
(4, 'Recorte fresco', 0, 40, 'SED-REC'),
(4, 'Enraizado', 10.00, 35, 'SED-ENR'),
(4, 'Maceta', 20.00, 25, 'SED-MAC');

-- Usuario administrador de ejemplo (password: admin123)
INSERT INTO usuarios (nombre, email, telefono, password_hash, tipo_cliente) VALUES
('Administrador', 'admin@macgarden.com', '8496079790', '$2b$10$XYZ...', 'mayorista');

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista: Productos con categoría
CREATE VIEW vista_productos_completos AS
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.precio_base,
    p.precio_mayorista,
    p.imagen_principal,
    p.stock_disponible,
    p.destacado,
    c.nombre AS categoria_nombre,
    COUNT(DISTINCT v.id) AS cantidad_variantes,
    COUNT(DISTINCT i.id) AS cantidad_imagenes
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN variantes_producto v ON p.id = v.producto_id
LEFT JOIN imagenes_producto i ON p.id = i.producto_id
WHERE p.activo = 1
GROUP BY p.id;

-- Vista: Pedidos con información del cliente
CREATE VIEW vista_pedidos_completos AS
SELECT 
    pe.id,
    pe.numero_pedido,
    pe.fecha_pedido,
    pe.estado,
    pe.total,
    u.nombre AS cliente_nombre,
    u.email AS cliente_email,
    u.telefono AS cliente_telefono,
    COUNT(d.id) AS cantidad_items
FROM pedidos pe
LEFT JOIN usuarios u ON pe.usuario_id = u.id
LEFT JOIN detalle_pedidos d ON pe.id = d.pedido_id
GROUP BY pe.id;

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS
-- =============================================

-- Procedimiento: Crear pedido completo
DELIMITER //
CREATE PROCEDURE crear_pedido(
    IN p_usuario_id INT,
    IN p_total DECIMAL(10,2),
    IN p_direccion TEXT,
    IN p_notas TEXT
)
BEGIN
    DECLARE nuevo_numero VARCHAR(50);
    
    -- Generar número de pedido único
    SET nuevo_numero = CONCAT('PED-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
    
    -- Insertar pedido
    INSERT INTO pedidos (usuario_id, numero_pedido, subtotal, total, direccion_entrega, notas)
    VALUES (p_usuario_id, nuevo_numero, p_total, p_total, p_direccion, p_notas);
    
    -- Devolver el ID del pedido
    SELECT LAST_INSERT_ID() AS pedido_id, nuevo_numero AS numero_pedido;
END //
DELIMITER ;

-- Procedimiento: Actualizar stock después de venta
DELIMITER //
CREATE PROCEDURE actualizar_stock_venta(
    IN p_producto_id INT,
    IN p_variante_id INT,
    IN p_cantidad INT
)
BEGIN
    -- Actualizar stock del producto
    UPDATE productos 
    SET stock_disponible = stock_disponible - p_cantidad
    WHERE id = p_producto_id;
    
    -- Si hay variante, actualizar también
    IF p_variante_id IS NOT NULL THEN
        UPDATE variantes_producto
        SET stock = stock - p_cantidad
        WHERE id = p_variante_id;
    END IF;
    
    -- Registrar movimiento de inventario
    INSERT INTO inventario_movimientos (producto_id, variante_id, tipo_movimiento, cantidad, motivo)
    VALUES (p_producto_id, p_variante_id, 'salida', p_cantidad, 'Venta');
END //
DELIMITER ;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger: Calcular subtotal en detalle_pedidos
DELIMITER //
CREATE TRIGGER calc_subtotal_detalle BEFORE INSERT ON detalle_pedidos
FOR EACH ROW
BEGIN
    SET NEW.subtotal = NEW.cantidad * NEW.precio_unitario;
END //
DELIMITER ;

-- =============================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =============================================

CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_usuarios_nombre ON usuarios(nombre);
CREATE INDEX idx_pedidos_fecha_estado ON pedidos(fecha_pedido, estado);

-- =============================================
-- PERMISOS (opcional, para usuario de app)
-- =============================================

-- Crear usuario para la aplicación
-- CREATE USER 'mac_app'@'localhost' IDENTIFIED BY 'tu_password_seguro';
-- GRANT SELECT, INSERT, UPDATE ON mac_garden.* TO 'mac_app'@'localhost';
-- FLUSH PRIVILEGES;