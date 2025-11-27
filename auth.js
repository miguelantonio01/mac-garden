// auth.js – manejo de usuario MAC Garden

const API_BASE = 'http://localhost:3000/api';

// ========== helpers de sesión ==========
function getCurrentUser() {
  const raw = localStorage.getItem('mac_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function setCurrentUser(user) {
  localStorage.setItem('mac_user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('mac_user');
  window.location.href = 'index.html';
}

// ========== render del menú de usuario en el nav ==========
function renderNavUserArea() {
  const user = getCurrentUser();
  const container = document.getElementById('nav-user');
  if (!container) return;

  if (!user) {
    // No hay sesión → mostrar botones de login / registro
    container.innerHTML = `
      <a href="login.html" class="nav-auth-link">Entrar</a>
      <a href="register.html" class="nav-auth-link nav-auth-primary">Registrarme</a>
    `;
  } else {
    const nombreCorto = user.nombre ? user.nombre.split(' ')[0] : 'Usuario';
    const inicial = nombreCorto.charAt(0).toUpperCase();
    const badge = user.tipo_cliente === 'mayorista' ? 'Mayorista' : 'Minorista';

    container.innerHTML = `
      <div class="user-menu">
        <div class="user-avatar">${inicial}</div>
        <div class="user-text">
          <span class="user-hi">Hola,</span>
          <span class="user-name">${nombreCorto}</span>
          <span class="user-badge">${badge}</span>
        </div>
        <button id="logout-btn" class="logout-btn">Salir</button>
      </div>
    `;

    const btn = document.getElementById('logout-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }
  }
}

// ========== registro ==========
async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;

  const payload = {
    nombre: form.nombre.value.trim(),
    email: form.email.value.trim(),
    telefono: form.telefono.value.trim(),
    password: form.password.value,
    direccion: form.direccion.value.trim(),
    ciudad: form.ciudad.value.trim(),
    tipo_cliente: form.tipo_cliente.value
  };

  try {
    const res = await fetch(`${API_BASE}/usuarios/registro`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Error registrando usuario');
      return;
    }

    alert('Registro exitoso. Ahora puedes iniciar sesión.');
    window.location.href = 'login.html';

  } catch (err) {
    console.error('Error en registro:', err);
    alert('Error de conexión en registro');
  }
}

// ========== login ==========
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;

  const payload = {
    email: form.email.value.trim(),
    password: form.password.value
  };

  try {
    const res = await fetch(`${API_BASE}/usuarios/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Error en login');
      return;
    }

    // Guardar usuario en localStorage
    setCurrentUser(data.usuario);
    alert('Sesión iniciada correctamente');
    window.location.href = 'index.html';

  } catch (err) {
    console.error('Error en login:', err);
    alert('Error de conexión en login');
  }
}

// ========== init en cada página ==========
function initAuth() {
  // Menú usuario en el header
  renderNavUserArea();

  // Form de registro (si existe en la página)
  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.addEventListener('submit', handleRegister);
  }

  // Form de login (si existe en la página)
  const logForm = document.getElementById('login-form');
  if (logForm) {
    logForm.addEventListener('submit', handleLogin);
  }
}

document.addEventListener('DOMContentLoaded', initAuth);
