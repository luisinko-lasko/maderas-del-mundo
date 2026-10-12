import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const codigo = await readFile(new URL('../lib/coleccion-retorno.js', import.meta.url), 'utf8');
const {numeroEspecie, destinoColeccion} = await import('data:text/javascript;base64,' + Buffer.from(codigo).toString('base64'));
test('retorno QR conserva solo una especie numérica y no acepta destinos externos', () => {
  assert.equal(destinoColeccion('86'), '/coleccion/anadir/86');
  assert.equal(numeroEspecie(1), 1);
  for (const valor of ['//evil.example', 'https://evil.example', '1/../../admin', '0', '-1', '1.2', '01', '', null]) {
    assert.equal(destinoColeccion(valor), '');
  }
});
