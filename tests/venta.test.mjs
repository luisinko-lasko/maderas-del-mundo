import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { porcentajeDescuento, costeEnvio, errorEnvio, lineasStripe, comprobarImporteStripe } = await import('data:text/javascript;base64,' + readFileSync(new URL('../lib/venta.js', import.meta.url)).toString('base64'));
test('límites de cantidad, tarifas y descuentos no acumulables', () => {
  for (const [n, descuento, envio] of [[4,0,null],[5,0,5],[9,0,5],[10,10,5],[11,10,8],[19,10,8],[20,20,8],[30,20,8],[31,20,null]]) {
    assert.equal(porcentajeDescuento(n), descuento);
    assert.equal(costeEnvio(n), envio);
  }
});
test('direcciones admitidas y exclusiones', () => {
  for (const cp of ['28043','08001','15001','50001']) assert.equal(errorEnvio(10,'España',cp),'');
  for (const cp of ['07001','35001','38001','51001','52001','00000','99999','2804','abcde']) assert.ok(errorEnvio(10,'España',cp));
  assert.ok(errorEnvio(10,'Portugal','28043'));
  assert.ok(errorEnvio(4,'España','28043'));
  assert.ok(errorEnvio(31,'España','28043'));
});
test('Stripe excluye las cajas del descuento y cobra envío por separado', () => {
  const pedido = {venta_version:'2026-10-11',entrega:'envio',pais_entrega:'España',codigo_postal_entrega:'28043',numero_piezas:10,subtotal:120,descuento:10,descuento_porcentaje:10,gastos_envio:5,total:115,pedido_lineas:[{cantidad:1,precio_caja_unitario:20}]};
  const filas=lineasStripe(pedido);
  assert.deepEqual(filas.map(l=>l.price_data.unit_amount), [9000,2000,500]);
  comprobarImporteStripe({currency:'eur',amount_total:11500}, pedido);
  assert.throws(()=>comprobarImporteStripe({currency:'eur',amount_total:11000}, pedido));
  assert.throws(()=>lineasStripe({...pedido,total:114}));
  assert.throws(()=>lineasStripe({...pedido,codigo_postal_entrega:'07001'}));
  const recogida={...pedido,entrega:'recogida',numero_piezas:1,subtotal:4.5,descuento:0,descuento_porcentaje:0,gastos_envio:0,total:4.5,pedido_lineas:[]};
  assert.equal(lineasStripe(recogida)[0].price_data.unit_amount,450);
});
