function waLink(product){
  const number = '18496079790';
  const text = `Hola! Me interesa el producto: ${product.name} - Precio: ${product.price}. ¿Está disponible?`;
  const url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(text);
  window.open(url, '_blank');
}

let cart = JSON.parse(localStorage.getItem('mac_cart') || '[]');

function saveCart(){
  localStorage.setItem('mac_cart', JSON.stringify(cart));
  renderCart();
  updateCount();
}

function addToCart(id){
  const prod = window.products.find(p => p.id === id);
  cart.push(prod);
  saveCart();
}

function renderCart(){
  const box = document.getElementById('cart-items');
  if(!box) return;
  box.innerHTML = '';

  cart.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span>${item.name} — ${item.price}</span>
      <button onclick="removeItem(${i})">❌</button>
    `;
    box.appendChild(div);
  });

  const wa = document.getElementById('cart-whatsapp');
  const msg = cart.map(i => `• ${i.name} (${i.price})`).join('%0A');
  wa.href = 'https://wa.me/18496079790?text=Hola!%20Quiero%20comprar:%0A' + msg;
}

function removeItem(i){
  cart.splice(i,1);
  saveCart();
}

function updateCount(){
  document.getElementById('cart-count').innerText = cart.length;
}

function toggleCart(){
  document.getElementById('cart-panel').classList.toggle('open');
}

window.addEventListener('load', () => {
  updateCount();
  renderCart();
});
