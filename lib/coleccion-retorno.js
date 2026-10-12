export function numeroEspecie(valor) {
  const texto = String(valor ?? '');
  return /^[1-9]\d{0,8}$/.test(texto) ? Number(texto) : null;
}

export function destinoColeccion(valor) {
  const numero = numeroEspecie(valor);
  return numero ? `/coleccion/anadir/${numero}` : '';
}
