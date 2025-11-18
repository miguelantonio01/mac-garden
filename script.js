function waLink(product){
  const number = '18496079790';
  const text = `Hola! Me interesa el producto: ${product.name} - Precio: ${product.price}. ¿Está disponible?`;
  const url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(text);
  window.open(url, '_blank');
}
