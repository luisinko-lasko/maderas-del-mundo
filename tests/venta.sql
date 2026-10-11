begin;
do $test$
declare
  v_user uuid;
  v_madera uuid := gen_random_uuid();
  v_order uuid;
  v_q integer;
  v_row public.pedidos%rowtype;
  v_error text;
  v_cp text;
  v_box uuid := gen_random_uuid();
  v_serie uuid := gen_random_uuid();
begin
  select id into v_user from auth.users order by created_at limit 1;
  perform set_config('request.jwt.claim.sub',v_user::text,true);
  insert into public.maderas(id,xilo_id,nombre,slug,precio,publicada)
    values(v_madera,2147483500,'Prueba condiciones venta','prueba-venta-'||v_madera,1.25,true);
  insert into public.piezas(madera_id,codigo)
    select v_madera,'TEST-'||gen_random_uuid() from generate_series(1,40);
  foreach v_q in array array[4,5,9,10,11,19,20,30,31] loop
    v_order := public.crear_pedido_desde_carrito(jsonb_build_array(jsonb_build_object('tipo','madera','id',v_madera,'cantidad',v_q)));
    select * into v_row from public.pedidos where id=v_order;
    if v_row.numero_piezas <> v_q then raise exception 'Recuento incorrecto: %',v_q; end if;
    if v_row.descuento_porcentaje <> (case when v_q>=20 then 20 when v_q>=10 then 10 else 0 end) then
      raise exception 'Descuento incorrecto: %',v_q;
    end if;
    if v_q in (4,31) then
      v_error := null;
      begin
        perform public.guardar_checkout(v_order,'envio','Test','Venta','test@example.invalid','600000000','Test','28043','Madrid','Madrid','España');
      exception when raise_exception then v_error:=sqlerrm; end;
      if v_error is null or (v_q=4 and v_error not like '%mínima de 5%') or (v_q=31 and v_error not like '%más de 30%') then
        raise exception 'Límite no rechazado (%): %',v_q,v_error;
      end if;
    else
      perform public.guardar_checkout(v_order,'envio','Test','Venta','test@example.invalid','600000000','Test','28043','Madrid','Madrid','España');
      select * into v_row from public.pedidos where id=v_order;
      if v_row.gastos_envio <> (case when v_q<=10 then 5 else 8 end) then raise exception 'Tarifa incorrecta: %',v_q; end if;
      if v_row.total <> round(v_q*1.25,2)-round(v_q*1.25*v_row.descuento_porcentaje/100,2)+v_row.gastos_envio then raise exception 'Total incorrecto'; end if;
      foreach v_cp in array array['07001','35001','38001','51001','52001','2804','00000','abcde'] loop
        v_error:=null;
        begin
          perform public.guardar_checkout(v_order,'envio','Test','Venta','test@example.invalid','600000000','Test',v_cp,'Test','Test','España');
        exception when raise_exception then v_error:=sqlerrm; end;
        if v_error is null or v_error not like '%península española%' then raise exception 'Destino no rechazado: %, %',v_cp,v_error; end if;
      end loop;
    end if;
    -- La recogida permite cualquier cantidad y no cobra envío.
    perform public.guardar_checkout(v_order,'recogida','Test','Venta','test@example.invalid','600000000');
    select * into v_row from public.pedidos where id=v_order;
    if v_row.gastos_envio <> 0 then raise exception 'Recogida con envío'; end if;
    perform public.cancelar_pedido(v_order);
  end loop;
  -- Una serie de 10 piezas y una caja de 20 euros: descuento sobre 100, no 120.
  insert into public.productos(id,nombre,tipo,precio,modo_caja) values(v_serie,'Serie prueba','serie',100,'opcional'),(v_box,'Caja prueba','caja',20,null);
  insert into public.producto_maderas(producto_id,madera_id,cantidad) values(v_serie,v_madera,10);
  insert into public.serie_cajas(serie_id,caja_id) values(v_serie,v_box);
  insert into public.inventario_productos(producto_id,stock) values(v_box,1);
  v_order := public.crear_pedido_desde_carrito(jsonb_build_array(jsonb_build_object('tipo','serie','id',v_serie,'cantidad',1,'caja_id',v_box)));
  perform public.guardar_checkout(v_order,'envio','Test','Venta','test@example.invalid','600000000','Test','28043','Madrid','Madrid','España');
  select * into v_row from public.pedidos where id=v_order;
  if v_row.numero_piezas<>10 or v_row.subtotal<>120 or v_row.descuento<>10 or v_row.total<>115 then raise exception 'Serie/caja incorrecta'; end if;
  -- La vía invitado escribe directamente con service_role: debe aplicar las mismas reglas.
  update public.pedidos set user_id=null,es_invitado=true,guest_token_hash='test-only',total=1 where id=v_order;
  select * into v_row from public.pedidos where id=v_order;
  if v_row.total<>115 then raise exception 'Importe manipulado no recalculado'; end if;
  v_error:=null;
  begin
    update public.pedidos set codigo_postal_entrega='07001' where id=v_order;
  exception when raise_exception then v_error:=sqlerrm; end;
  if v_error is null or v_error not like '%península española%' then raise exception 'Invitado: destino no bloqueado'; end if;
end;
$test$;
rollback;
select count(*) as fichas_prueba_restantes from public.maderas where xilo_id=2147483500;
