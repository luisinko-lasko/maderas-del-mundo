alter table public.pedidos
  add column subtotal numeric(10,2) not null default 0,
  add column descuento numeric(10,2) not null default 0,
  add column descuento_porcentaje integer not null default 0,
  add column gastos_envio numeric(10,2) not null default 0,
  add column numero_piezas integer not null default 0,
  add column venta_version text;
alter table public.pedido_lineas
  add column precio_caja_unitario numeric(10,2) not null default 0;

create or replace function public.fijar_precio_caja_pedido()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.precio_caja_unitario := 0;
  if new.caja_id is not null then
    select coalesce(precio,0) into new.precio_caja_unitario
      from public.productos where id = new.caja_id;
  end if;
  return new;
end;
$$;
revoke all on function public.fijar_precio_caja_pedido() from public, anon, authenticated;
create trigger fijar_precio_caja_pedido before insert on public.pedido_lineas
for each row execute function public.fijar_precio_caja_pedido();

create or replace function public.calcular_condiciones_venta()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_base numeric(10,2);
  v_cp text;
  v_pais text;
begin
  -- Los pedidos finalizados conservan los importes aceptados al comprar.
  if new.estado not in ('reservado','pendiente_pago') then return new; end if;
  select coalesce(sum(cantidad * precio_unitario),0),
         coalesce(sum(case when tipo in ('madera','serie') then
           cantidad * greatest(0,precio_unitario - precio_caja_unitario) else 0 end),0)
    into new.subtotal, v_base
    from public.pedido_lineas where pedido_id = new.id;
  select count(*) into new.numero_piezas
    from public.pedido_piezas pp join public.pedido_lineas pl on pl.id=pp.pedido_linea_id
    where pl.pedido_id = new.id;
  new.descuento_porcentaje := case when new.numero_piezas >= 20 then 20
    when new.numero_piezas >= 10 then 10 else 0 end;
  new.descuento := round(v_base * new.descuento_porcentaje / 100,2);
  new.gastos_envio := 0;
  if new.estado = 'pendiente_pago' and new.entrega = 'envio' then
    if new.numero_piezas < 5 then
      raise exception 'El envío a domicilio requiere una compra mínima de 5 piezas';
    end if;
    if new.numero_piezas > 30 then
      raise exception 'Para enviar más de 30 piezas, consulta en contacto@maderasdelmundo.es';
    end if;
    v_cp := btrim(coalesce(new.codigo_postal_entrega,''));
    v_pais := lower(btrim(coalesce(new.pais_entrega,'')));
    if v_pais not in ('españa','espana','spain','es')
       or v_cp !~ '^[0-9]{5}$'
       or left(v_cp,2) not between '01' and '50'
       or left(v_cp,2) in ('07','35','38') then
      raise exception 'Solo enviamos a la península española. Para otros destinos, consulta en contacto@maderasdelmundo.es';
    end if;
    new.gastos_envio := case when new.numero_piezas <= 10 then 5 else 8 end;
  end if;
  new.total := new.subtotal - new.descuento + new.gastos_envio;
  new.venta_version := '2026-10-11';
  return new;
end;
$$;
revoke all on function public.calcular_condiciones_venta() from public, anon, authenticated;
create trigger calcular_condiciones_venta before update on public.pedidos
for each row execute function public.calcular_condiciones_venta();

-- Inicializar también las reservas que existían antes de esta actualización.
update public.pedido_lineas pl set precio_caja_unitario=coalesce((select precio from public.productos where id=pl.caja_id),0)
where pl.caja_id is not null and exists(select 1 from public.pedidos p where p.id=pl.pedido_id and p.estado='reservado' and p.venta_version is null);
update public.pedidos set total=total where estado='reservado' and venta_version is null;
