/* ==========================================================================
   PÁGINA PRINCIPAL — Hero animado, catálogo, galería, carrito,
   configurador "Personaliza tu rosa", ocasiones, FAQ, envíos y contacto.
   Requiere: config.js, comun.js y rosa.js. GSAP es opcional.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.RPTV_CONFIG;
  var U = window.RPTV;
  var $ = U.$, $$ = U.$$, precio = U.formatoPrecio;
  var reducido = U.movimientoReducido;
  var esMovil = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;

  var CATEGORIAS = {
    rosas: 'Rosas eternas de satín',
    cartas: 'Cartas de amor',
    chocolates: 'Chocolates',
    presentaciones: 'Presentaciones'
  };

  function producto(id) {
    for (var i = 0; i < CFG.productos.length; i++) if (CFG.productos[i].id === id) return CFG.productos[i];
    return null;
  }
  function escapar(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function conRetraso(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  /* =========================== 1. HERO ================================ */
  function hero() {
    var seccion = $('#inicio');
    var lienzo = $('#lienzo-rosa');
    var contenido = $('.hero__contenido');
    var control = $('#control-animacion');
    if (!lienzo || !window.RosaEterna) { seccion.classList.add('armada'); return; }

    var armar = function () { seccion.classList.add('armada'); };
    var escena = RosaEterna.crearEscena(lienzo, {
      movil: esMovil,
      reducido: reducido,
      margenSuperior: 84,
      alArmar: armar
    });
    window.escenaRosa = escena; // acceso para depurar desde la consola

    // Coloca el título justo debajo de la rosa sin salirse de la pantalla
    function ubicarTexto() {
      var alto = seccion.clientHeight;
      var arriba = Math.min(escena.fondoRosa, alto - contenido.offsetHeight - (alto > 700 ? 64 : 28));
      seccion.style.setProperty('--rosa-fondo', Math.max(escena.fondoRosa * 0.82, arriba) + 'px');
    }
    ubicarTexto();

    // Redimensionar (ignora el cambio de altura de la barra del navegador móvil)
    var anchoPrevio = window.innerWidth, altoPrevio = window.innerHeight;
    window.addEventListener('resize', conRetraso(function () {
      if (window.innerWidth === anchoPrevio && Math.abs(window.innerHeight - altoPrevio) < 120) return;
      anchoPrevio = window.innerWidth; altoPrevio = window.innerHeight;
      escena.redimensionar();
      ubicarTexto();
    }, 160));

    // Comienza cuando desaparece la pantalla de carga
    var iniciada = false;
    function iniciar() { if (!iniciada) { iniciada = true; escena.iniciar(); } }
    if ($('#cargador')) {
      document.addEventListener('rptv:cargado', iniciar);
      setTimeout(iniciar, 3600);
    } else { iniciar(); }
    setTimeout(armar, 12500); // respaldo: el título siempre aparece

    // Botón pausar / reproducir
    var pausadaPorUsuario = false;
    if (reducido) { control.hidden = true; }
    control.addEventListener('click', function () {
      var corriendo = escena.alternar();
      pausadaPorUsuario = !corriendo;
      control.setAttribute('aria-pressed', String(!corriendo));
      control.setAttribute('aria-label', corriendo ? 'Pausar animación' : 'Reproducir animación');
    });

    // Ahorro de batería: se detiene si el hero no está a la vista o la pestaña se oculta
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        if (!iniciada || pausadaPorUsuario || reducido) return;
        if (entradas[0].isIntersecting) escena.reanudar(); else escena.pausar();
      }, { threshold: 0.02 }).observe(seccion);
    }
    document.addEventListener('visibilitychange', function () {
      if (!iniciada || pausadaPorUsuario || reducido) return;
      if (document.hidden) escena.pausar(); else escena.reanudar();
    });

    // Paralaje suave con el mouse (solo computadora)
    if (!esMovil && !reducido) {
      seccion.addEventListener('pointermove', function (e) {
        escena.moverPuntero((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      });
      seccion.addEventListener('pointerleave', function () { escena.moverPuntero(0, 0); });
    }
  }

  /* ================ 2. ROSA ILUSTRATIVA en "¿Qué es?" ================= */
  function rosaQueEs() {
    var lienzo = $('#lienzo-que-es');
    if (!lienzo || !window.RosaEterna) return;
    var escena = RosaEterna.dibujarEstatica(lienzo, { paleta: 'rosa', chispas: false, brillo: false, tamano: 0.74, movil: esMovil });
    window.addEventListener('resize', conRetraso(function () { escena.redimensionar(); }, 200));
  }

  /* ========================= 3. CATÁLOGO ============================== */
  var listaGaleria = [];
  function catalogo() {
    var cont = $('#catalogo');
    if (!cont) return;
    var html = '';
    CFG.productos.forEach(function (p, i) {
      html +=
        '<article class="producto' + (p.destacado ? ' producto--destacado' : '') + '" data-categoria="' + p.categoria + '" data-revelar style="--retraso:' + ((i % 3) * 0.08) + 's">' +
          '<button class="producto__media" type="button" data-galeria="' + p.id + '" aria-label="Ampliar imagen: ' + escapar(p.nombre) + '">' +
            (p.etiqueta ? '<span class="producto__etiqueta">' + escapar(p.etiqueta) + '</span>' : '') +
            '<span class="producto__ilustrativa"' + (p.ilustrativa ? '' : ' hidden') + '>Imagen ilustrativa</span>' +
            '<img src="' + p.foto + '" alt="' + escapar(p.alt || (p.nombre + ': ' + p.descripcion)) + '" loading="lazy" decoding="async" width="800" height="680"' +
              (p.respaldo ? ' data-respaldo="' + p.respaldo + '"' : '') + '>' +
            '<span class="producto__lupa" aria-hidden="true"><svg><use href="#i-lupa"/></svg></span>' +
          '</button>' +
          '<div class="producto__cuerpo">' +
            '<p class="producto__categoria">' + CATEGORIAS[p.categoria] + '</p>' +
            '<h3 class="producto__nombre">' + escapar(p.nombre) + '</h3>' +
            '<p class="producto__descripcion">' + escapar(p.descripcion) + '</p>' +
            (p.nota ? '<p class="producto__nota">' + escapar(p.nota) + '</p>' : '') +
            '<div class="producto__pie">' +
              '<p class="producto__precio" style="margin:0">' + (p.desde ? '<small class="producto__desde">desde</small>' : '') + precio(p.precio) + '<small>USD</small></p>' +
              (p.accion === 'personalizar'
                ? '<button class="boton boton--chico boton--dorado" type="button" data-personalizar>Personalizar</button>'
                : '<button class="boton boton--chico" type="button" data-pedir="' + p.id + '" aria-label="Pedir ' + escapar(p.nombre) + '">Pedir</button>') +
            '</div>' +
          '</div>' +
        '</article>';
    });
    cont.innerHTML = html;

    // Si la foto real aún no existe, usamos la imagen de respaldo (y la marcamos como ilustrativa)
    $$('img[data-respaldo]', cont).forEach(function (img) {
      function usarRespaldo() {
        if (img.dataset.usado) return;
        img.dataset.usado = '1';
        img.src = img.dataset.respaldo;
        var et = img.parentNode.querySelector('.producto__ilustrativa');
        if (et) et.hidden = false;
      }
      img.addEventListener('error', usarRespaldo);
      if (img.complete && img.naturalWidth === 0) usarRespaldo();
    });

    U.revelar($$('.producto', cont));

    // Filtros
    $$('.filtro').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.dataset.filtro;
        $$('.filtro').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        $$('.producto', cont).forEach(function (art) {
          var ver = f === 'todo' || art.dataset.categoria === f;
          art.classList.toggle('oculto', !ver);
          if (ver) art.classList.add('visible');
        });
      });
    });

    // Pedir un producto
    cont.addEventListener('click', function (e) {
      if (e.target.closest('[data-personalizar]')) {
        $('#personaliza').scrollIntoView({ behavior: reducido ? 'auto' : 'smooth' });
        return;
      }
      var pedir = e.target.closest('[data-pedir]');
      if (pedir) {
        var p = producto(pedir.dataset.pedir);
        agregarAlPedido({ id: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1, detalle: '' });
        U.aviso(p.nombre + ' se agregó a tu pedido');
        return;
      }
      var media = e.target.closest('[data-galeria]');
      if (media) abrirGaleria(media.dataset.galeria, media);
    });
  }

  /* ========================= 4. GALERÍA =============================== */
  var galeria = { indice: 0, liberar: null, origen: null };
  function abrirGaleria(id, origen) {
    listaGaleria = $$('.producto:not(.oculto) [data-galeria]').map(function (b) {
      var p = producto(b.dataset.galeria);
      return { id: p.id, src: b.querySelector('img').currentSrc || b.querySelector('img').src, nombre: p.nombre, precio: p.precio, desde: p.desde, alt: b.querySelector('img').alt };
    });
    galeria.indice = Math.max(0, listaGaleria.findIndex(function (x) { return x.id === id; }));
    galeria.origen = origen;
    var lb = $('#lightbox');
    mostrarImagenGaleria();
    lb.setAttribute('aria-hidden', 'false');
    lb.classList.add('abierto');
    document.body.classList.add('sin-scroll');
    galeria.liberar = U.atraparFoco(lb);
    $('[data-cerrar-lightbox]', lb).focus();
  }
  function mostrarImagenGaleria() {
    var it = listaGaleria[galeria.indice];
    if (!it) return;
    var img = $('#lightbox-imagen');
    img.src = it.src;
    img.alt = it.alt;
    $('#lightbox-texto').innerHTML = escapar(it.nombre) + '<small>' + (it.desde ? 'desde ' : '') + precio(it.precio) + ' USD · ' + (galeria.indice + 1) + ' de ' + listaGaleria.length + '</small>';
  }
  function moverGaleria(paso) {
    galeria.indice = (galeria.indice + paso + listaGaleria.length) % listaGaleria.length;
    mostrarImagenGaleria();
  }
  function cerrarGaleria() {
    var lb = $('#lightbox');
    if (!lb.classList.contains('abierto')) return;
    lb.classList.remove('abierto');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('sin-scroll');
    if (galeria.liberar) galeria.liberar();
    if (galeria.origen) galeria.origen.focus();
  }
  function iniciarGaleria() {
    var lb = $('#lightbox');
    if (!lb) return;
    $('[data-cerrar-lightbox]', lb).addEventListener('click', cerrarGaleria);
    $$('[data-lightbox]', lb).forEach(function (b) {
      b.addEventListener('click', function () { moverGaleria(Number(b.dataset.lightbox)); });
    });
    lb.addEventListener('click', function (e) { if (e.target === lb) cerrarGaleria(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('abierto')) return;
      if (e.key === 'Escape') cerrarGaleria();
      if (e.key === 'ArrowRight') moverGaleria(1);
      if (e.key === 'ArrowLeft') moverGaleria(-1);
    });
    // Deslizar con el dedo en el celular
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) moverGaleria(dx < 0 ? 1 : -1);
      x0 = null;
    });
  }

  /* ===================== 5. CARRITO / MI PEDIDO ======================= */
  function leerPedido() { return U.almacen.leer(U.CLAVE_PEDIDO, []); }
  function guardarPedido(items) {
    U.almacen.guardar(U.CLAVE_PEDIDO, items);
    U.actualizarContador(true);
    pintarCarrito();
  }
  function agregarAlPedido(item) {
    var items = leerPedido();
    var existente = items.filter(function (x) { return x.id === item.id && x.detalle === item.detalle; })[0];
    if (existente) existente.cantidad += item.cantidad;
    else items.push(item);
    guardarPedido(items);
  }
  function totalPedido(items) {
    return items.reduce(function (s, it) { return s + it.precio * it.cantidad; }, 0);
  }
  function pintarCarrito() {
    var lista = $('#lista-carrito');
    if (!lista) return;
    var items = leerPedido();
    if (!items.length) {
      lista.innerHTML = '<li class="carrito__vacio"><svg aria-hidden="true"><use href="#i-bolsa"/></svg><p>Tu pedido está vacío.</p><a class="enlace-flecha" href="#coleccion" data-cerrar-carrito>Ver colección</a></li>';
    } else {
      lista.innerHTML = items.map(function (it, i) {
        return '<li class="item-carrito">' +
          '<span class="item-carrito__nombre">' + escapar(it.nombre) + '</span>' +
          '<span class="item-carrito__precio">' + precio(it.precio * it.cantidad) + '</span>' +
          (it.detalle ? '<span class="item-carrito__detalle">' + escapar(it.detalle).replace(/\n/g, '<br>') + '</span>' : '') +
          '<div class="item-carrito__acciones">' +
            '<div class="contador-cantidad" role="group" aria-label="Cantidad de ' + escapar(it.nombre) + '">' +
              '<button type="button" data-item="' + i + '" data-delta="-1" aria-label="Quitar uno">−</button>' +
              '<output aria-live="polite">' + it.cantidad + '</output>' +
              '<button type="button" data-item="' + i + '" data-delta="1" aria-label="Agregar uno">+</button>' +
            '</div>' +
            '<button class="item-carrito__quitar" type="button" data-quitar="' + i + '">Quitar</button>' +
          '</div></li>';
      }).join('');
    }
    $('#total-carrito').textContent = precio(totalPedido(items));
    $('#enviar-carrito').disabled = !items.length;
    $('#vaciar-carrito').disabled = !items.length;
  }
  function mensajePedido(items) {
    var lineas = ['¡Hola! 🌹 Quiero hacer este pedido en ' + CFG.marca + ':', ''];
    items.forEach(function (it, i) {
      lineas.push((i + 1) + '. ' + it.nombre + ' — cantidad: ' + it.cantidad + ' — ' + precio(it.precio * it.cantidad));
      if (it.detalle) it.detalle.split('\n').forEach(function (d) { lineas.push('   ' + d); });
    });
    lineas.push('', 'Subtotal: ' + precio(totalPedido(items)) + ' USD', '(El envío lo coordinamos por aquí.)', '', '¿Me confirman disponibilidad y forma de pago? ¡Gracias!');
    return lineas.join('\n');
  }
  function carrito() {
    var panel = $('#carrito'), velo = $('#velo');
    if (!panel) return;
    var liberar = null, origen = null;
    function abrir() {
      origen = document.activeElement;
      pintarCarrito();
      panel.classList.add('abierto');
      panel.setAttribute('aria-hidden', 'false');
      velo.classList.add('visible');
      document.body.classList.add('sin-scroll');
      liberar = U.atraparFoco(panel);
      setTimeout(function () { $('[data-cerrar-carrito]', panel).focus(); }, 80);
    }
    function cerrar() {
      if (!panel.classList.contains('abierto')) return;
      panel.classList.remove('abierto');
      panel.setAttribute('aria-hidden', 'true');
      velo.classList.remove('visible');
      document.body.classList.remove('sin-scroll');
      if (liberar) liberar();
      if (origen && origen.focus) origen.focus();
    }
    $$('[data-abrir-carrito]').forEach(function (b) { b.addEventListener('click', abrir); });
    velo.addEventListener('click', cerrar);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar-carrito]')) { cerrar(); return; }
      var items = leerPedido();
      var b = e.target.closest('[data-delta]');
      if (b) {
        var it = items[Number(b.dataset.item)];
        it.cantidad = Math.max(1, Math.min(50, it.cantidad + Number(b.dataset.delta)));
        guardarPedido(items);
        return;
      }
      var q = e.target.closest('[data-quitar]');
      if (q) { items.splice(Number(q.dataset.quitar), 1); guardarPedido(items); }
    });
    $('#enviar-carrito').addEventListener('click', function () {
      var items = leerPedido();
      if (!items.length) return;
      window.open(U.enlaceWhatsApp(mensajePedido(items)), '_blank', 'noopener');
    });
    // Vaciar con confirmación en dos toques (sin ventanas emergentes)
    var vaciar = $('#vaciar-carrito'), armado = false, tVaciar;
    vaciar.addEventListener('click', function () {
      if (!armado) {
        armado = true;
        vaciar.textContent = '¿Seguro? Toca otra vez para vaciar';
        tVaciar = setTimeout(function () { armado = false; vaciar.textContent = 'Vaciar pedido'; }, 3500);
        return;
      }
      clearTimeout(tVaciar);
      armado = false;
      vaciar.textContent = 'Vaciar pedido';
      guardarPedido([]);
      U.aviso('Tu pedido quedó vacío');
    });
    pintarCarrito();
    if (location.hash === '#pedido') setTimeout(abrir, 600);
  }

  /* ================== 6. CONFIGURADOR "Personaliza" =================== */
  var config = null;
  function configurador() {
    var form = $('#form-config');
    if (!form) return;
    var C = CFG.configurador;

    // Precios de presentaciones y cartas tomados del catálogo
    function conPrecio(op) {
      var p = op.productoId ? producto(op.productoId) : null;
      return { id: op.id, nombre: op.nombre, precio: p ? p.precio : (op.precio || 0), nota: op.nota };
    }
    var presentaciones = C.presentaciones.map(conPrecio);
    var cartas = C.cartas.map(conPrecio);
    var chocolates = C.chocolates.map(function (id) { var p = producto(id); return { id: p.id, nombre: p.nombre, precio: p.precio }; });

    // Construcción de opciones
    $('#opciones-color').innerHTML = C.colores.map(function (c, i) {
      return '<div class="color-opcion"><input type="radio" name="color" id="color-' + c.id + '" value="' + c.id + '"' + (i === 0 ? ' checked' : '') + '>' +
        '<label for="color-' + c.id + '" style="--muestra:' + c.hex + '" title="' + c.nombre + '"><span class="solo-lector">' + c.nombre + '</span></label></div>';
    }).join('');
    function tarjetas(lista, nombre, tipo) {
      return lista.map(function (o, i) {
        var marcado = tipo === 'radio' && i === 0 ? ' checked' : '';
        return '<div class="tarjeta-opcion"><input type="' + tipo + '" name="' + nombre + '" id="' + nombre + '-' + o.id + '" value="' + o.id + '"' + marcado + '>' +
          '<label for="' + nombre + '-' + o.id + '"><span class="tarjeta-opcion__texto">' + escapar(o.nombre) + '</span><strong>' + (o.precio ? '+' + precio(o.precio) : (o.nota || 'Incluido')) + '</strong></label></div>';
      }).join('');
    }
    // Número de rosas del ramo (precio según la tabla de config.js)
    var precios = C.preciosRamo;
    function precioRamo(n) { return precios[Math.max(1, Math.min(precios.length, n)) - 1]; }
    var porDefecto = Math.min(precios.length, C.rosasPorDefecto || 1);
    $('#opciones-rosas').innerHTML = precios.map(function (p, i) {
      var n = i + 1;
      return '<div class="rosa-chip"><input type="radio" name="rosas" id="rosas-' + n + '" value="' + n + '"' + (n === porDefecto ? ' checked' : '') + '>' +
        '<label for="rosas-' + n + '"><span>' + n + '<span class="solo-lector"> ' + (n === 1 ? 'rosa' : 'rosas') + '</span></span><small>' + precio(p) + '</small></label></div>';
    }).join('');
    $('#opciones-presentacion').innerHTML = tarjetas(presentaciones, 'presentacion', 'radio');
    $('#opciones-carta').innerHTML = tarjetas(cartas, 'carta', 'radio');
    $('#opciones-chocolate').innerHTML = tarjetas(chocolates, 'chocolate', 'checkbox');
    $('#config-entrega').innerHTML = CFG.envios.map(function (z) {
      return '<option value="' + z.id + '">' + escapar(z.zona) + ' — ' + (z.costo ? (z.desde ? 'desde ' : '') + precio(z.costo) : 'Gratis') + '</option>';
    }).join('');

    // Fecha mínima: hoy + 2 días (trabajamos bajo pedido)
    var fecha = $('#config-fecha');
    var min = new Date(); min.setDate(min.getDate() + 2);
    fecha.min = min.toISOString().slice(0, 10);

    /* Vista previa: se dibuja UNA rosa en un lienzo auxiliar y se copia tantas
       veces como rosas tenga el ramo, rotando cada una para que se vean distintas. */
    var lienzo = $('#lienzo-config');
    var fuente = document.createElement('canvas');
    var escena = window.RosaEterna ? RosaEterna.dibujarEstatica(fuente, { paleta: 'rojo', ancho: 520, alto: 520, dpr: 1, tamano: 1, brillo: false, chispas: false }) : null;
    var colorActual = 'rojo', rosasActual = 0;

    function posicionesRamo(n) {
      if (n === 1) return [[0, 0, 1]];
      var pos = [], interior = n >= 9 ? 3 : n >= 6 ? 1 : 0, exterior = n - interior;
      var radio = n <= 5 ? 0.5 : 0.56;
      var esc = n === 2 ? 0.66 : n <= 5 ? 0.56 : n <= 8 ? 0.44 : 0.38;
      for (var i = 0; i < exterior; i++) {
        var a = -Math.PI / 2 + i * 2 * Math.PI / exterior + (exterior % 2 ? 0 : Math.PI / exterior);
        pos.push([Math.cos(a) * radio, Math.sin(a) * radio * 0.9, esc]);
      }
      if (interior === 1) pos.push([0, 0, esc * 1.06]);
      for (var j = 0; interior === 3 && j < 3; j++) {
        var b = Math.PI / 2 + j * 2 * Math.PI / 3;
        pos.push([Math.cos(b) * 0.2, Math.sin(b) * 0.2, esc]);
      }
      var ext = pos.slice(0, exterior).sort(function (p, q) { return p[1] - q[1]; });
      return ext.concat(pos.slice(exterior)); // de atrás hacia adelante; el centro encima
    }
    function pintarRamo(n) {
      if (!escena) return;
      var d = Math.min(window.devicePixelRatio || 1, 2);
      var W = lienzo.clientWidth || 300, H = lienzo.clientHeight || 280;
      lienzo.width = Math.round(W * d); lienzo.height = Math.round(H * d);
      var ctx = lienzo.getContext('2d');
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var base = Math.min(W, H) * 0.74, cx = W / 2, cy = H / 2;
      var brillo = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.8);
      brillo.addColorStop(0, 'rgba(255,140,160,0.22)');
      brillo.addColorStop(1, 'rgba(255,140,160,0)');
      ctx.fillStyle = brillo;
      ctx.fillRect(0, 0, W, H);
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      posicionesRamo(n).forEach(function (p, i) {
        var tam = base * p[2];
        ctx.save();
        ctx.translate(cx + p[0] * base / 2, cy + p[1] * base / 2);
        ctx.rotate(i * 1.3);
        ctx.drawImage(fuente, -tam / 2, -tam / 2, tam, tam);
        ctx.restore();
      });
    }
    window.addEventListener('resize', conRetraso(function () { pintarRamo(rosasActual); }, 200));

    function estado() {
      var color = C.colores.filter(function (c) { return c.id === form.color.value; })[0];
      var pres = presentaciones.filter(function (p) { return p.id === form.presentacion.value; })[0];
      var carta = cartas.filter(function (p) { return p.id === form.carta.value; })[0];
      var chocs = $$('input[name="chocolate"]:checked', form).map(function (i) {
        return chocolates.filter(function (c) { return c.id === i.value; })[0];
      });
      var zona = CFG.envios.filter(function (z) { return z.id === form.entrega.value; })[0];
      var rosas = Number(form.rosas.value) || 1;
      var ramo = precioRamo(rosas);
      var unitario = ramo + (color.extra || 0) + pres.precio + carta.precio + chocs.reduce(function (s, c) { return s + c.precio; }, 0);
      return {
        color: color, pres: pres, carta: carta, chocs: chocs, zona: zona,
        para: form.para.value.trim(), de: form.de.value.trim(), mensaje: form.mensaje.value.trim(),
        fecha: fecha.value, rosas: rosas, ramo: ramo, unitario: unitario,
        textoRosas: rosas + (rosas === 1 ? ' rosa' : ' rosas'),
        total: unitario + (zona ? zona.costo : 0)
      };
    }

    function actualizar() {
      var s = estado();
      $('#nombre-color').textContent = s.color.nombre;
      $('#contador-mensaje').textContent = form.mensaje.value.length + '/' + C.maxMensaje;
      $('#nombre-rosas').textContent = s.textoRosas + ' · ' + precio(s.ramo);

      // Precio en vivo
      $('#total-config').textContent = precio(s.total);
      var partes = [s.textoRosas + ' ' + precio(s.ramo)];
      if (s.pres.precio) partes.push(s.pres.nombre + ' ' + precio(s.pres.precio));
      if (s.carta.precio) partes.push(s.carta.nombre + ' ' + precio(s.carta.precio));
      s.chocs.forEach(function (c) { partes.push(c.nombre + ' ' + precio(c.precio)); });
      var detalle = partes.join(' · ');
      detalle += ' · Envío ' + (s.zona.costo ? (s.zona.desde ? 'desde ' : '') + precio(s.zona.costo) : 'gratis');
      $('#detalle-total').textContent = detalle;

      // Tarjeta del mensaje
      var tarjeta = $('#tarjeta-mensaje');
      if (!s.mensaje && !s.para && !s.de) {
        tarjeta.innerHTML = '<span class="tarjeta-mensaje__vacio">Tu mensaje aparecerá aquí…</span>';
      } else {
        tarjeta.innerHTML = (s.para ? 'Para ' + escapar(s.para) + ':<br>' : '') + escapar(s.mensaje || '…') +
          (s.de ? '<span class="tarjeta-mensaje__firma">Con amor, ' + escapar(s.de) + '</span>' : '');
      }
      $('#resumen-config').textContent = s.textoRosas + ' de satín ' + s.color.nombre.toLowerCase() + ' · ' + s.pres.nombre +
        (s.chocs.length ? ' · ' + s.chocs.length + (s.chocs.length === 1 ? ' chocolate' : ' chocolates') : '');

      // Color y número de rosas con una transición suave
      if (escena && (s.color.id !== colorActual || s.rosas !== rosasActual)) {
        var primera = rosasActual === 0;
        colorActual = s.color.id;
        rosasActual = s.rosas;
        if (primera) { escena.cambiarPaleta(colorActual); pintarRamo(rosasActual); }
        else {
          lienzo.classList.add('cambiando');
          setTimeout(function () {
            escena.cambiarPaleta(colorActual);
            pintarRamo(rosasActual);
            lienzo.classList.remove('cambiando');
          }, reducido ? 0 : 260);
        }
      }
      dibujarPresentacion(s.pres.id);
    }

    // Mientras el configurador está en pantalla, los botones flotantes se apartan (CSS en celular)
    function revisarConfigVisible() {
      var r = form.getBoundingClientRect();
      document.body.classList.toggle('config-visible', r.top < window.innerHeight * 0.7 && r.bottom > 0);
    }
    window.addEventListener('scroll', revisarConfigVisible, { passive: true });
    window.addEventListener('resize', revisarConfigVisible);
    revisarConfigVisible();

    form.addEventListener('input', actualizar);
    form.addEventListener('change', actualizar);

    function textoDetalle(s) {
      var l = ['Número de rosas: ' + s.rosas + ' (' + precio(s.ramo) + ')', 'Color del satín: ' + s.color.nombre, 'Presentación: ' + s.pres.nombre, 'Carta: ' + s.carta.nombre];
      if (s.chocs.length) l.push('Chocolates: ' + s.chocs.map(function (c) { return c.nombre; }).join(', '));
      if (s.para) l.push('Para: ' + s.para);
      if (s.de) l.push('De: ' + s.de);
      if (s.mensaje) l.push('Mensaje: "' + s.mensaje + '"');
      l.push('Entrega: ' + s.zona.zona + (s.fecha ? ' · ' + s.fecha.split('-').reverse().join('/') : ''));
      return l.join('\n');
    }

    $('#agregar-config').addEventListener('click', function () {
      var s = estado();
      agregarAlPedido({ id: 'personalizada', nombre: 'Ramo personalizado de ' + s.textoRosas + ' de satín', precio: s.unitario, cantidad: 1, detalle: textoDetalle(s) });
      U.aviso('Tu ramo personalizado se agregó al pedido');
    });
    $('#whatsapp-config').addEventListener('click', function () {
      var s = estado();
      var texto = '¡Hola! 🌹 Quiero pedir un ramo personalizado de rosas eternas de satín en ' + CFG.marca + ':\n\n' +
        textoDetalle(s) + '\n\n' +
        'Subtotal: ' + precio(s.unitario) + '\n' +
        'Envío: ' + (s.zona.costo ? (s.zona.desde ? 'desde ' : '') + precio(s.zona.costo) : 'gratis') + '\n' +
        'Total estimado: ' + precio(s.total) + ' USD\n\n¿Me confirman disponibilidad y forma de pago? ¡Gracias!';
      window.open(U.enlaceWhatsApp(texto), '_blank', 'noopener');
    });

    config = {
      aplicar: function (preset) {
        if (preset.color) { var r = $('#color-' + preset.color); if (r) r.checked = true; }
        if (preset.carta) { var c = $('#carta-' + preset.carta); if (c) c.checked = true; }
        if (preset.rosas) { var n = $('#rosas-' + preset.rosas); if (n) n.checked = true; }
        if (preset.mensaje) form.mensaje.value = preset.mensaje;
        actualizar();
      }
    };
    actualizar();
  }

  /* Ilustración de la presentación elegida, superpuesta a la rosa */
  var presentacionActual = null;
  function dibujarPresentacion(id) {
    var cont = $('#presentacion-visual');
    if (!cont || id === presentacionActual) return;
    presentacionActual = id;
    var svg = {
      lazo:
        '<svg viewBox="0 0 400 368"><defs><linearGradient id="lz" x1="0" x2="1"><stop offset="0" stop-color="#7d0f26"/><stop offset=".5" stop-color="#c43552"/><stop offset="1" stop-color="#7d0f26"/></linearGradient></defs>' +
        '<g transform="translate(200 300)"><path d="M0 0c-30-26-70-30-72-8-2 20 40 22 72 8z" fill="url(#lz)" opacity=".95"/><path d="M0 0c30-26 70-30 72-8 2 20-40 22-72 8z" fill="url(#lz)" opacity=".95"/>' +
        '<path d="M-4 4l-26 52 14-4 6 14 18-58zM4 4l26 52-14-4-6 14-18-58z" fill="#9c1934"/><ellipse cx="0" cy="2" rx="11" ry="9" fill="#d0405e"/><path d="M-50-14c14-6 30-4 44 8" stroke="#ffd0d9" stroke-opacity=".5" fill="none"/></g></svg>',
      caja:
        '<svg viewBox="0 0 400 368"><defs><linearGradient id="cj" x1="0" x2="1"><stop offset="0" stop-color="#140a0d"/><stop offset=".5" stop-color="#2e1a20"/><stop offset="1" stop-color="#140a0d"/></linearGradient></defs>' +
        '<ellipse cx="200" cy="262" rx="118" ry="22" fill="#000" opacity=".25"/>' +
        '<path d="M82 262c0 0 0 58 0 60 0 16 53 30 118 30s118-14 118-30v-60c0 16-53 30-118 30S82 278 82 262z" fill="url(#cj)"/>' +
        '<path d="M82 300c0 16 53 30 118 30s118-14 118-30v12c0 16-53 30-118 30S82 328 82 312z" fill="#c9a45c" opacity=".9"/>' +
        '<path d="M82 262c0 16 53 30 118 30s118-14 118-30" fill="none" stroke="#e6cf98" stroke-width="2"/>' +
        '<text x="200" y="322" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="13" fill="#1c1719" letter-spacing="3">PARA TODA LA VIDA</text></svg>',
      acrilica:
        '<svg viewBox="0 0 400 368"><g fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2">' +
        '<path d="M86 96 120 66h194l-34 30z" fill="#fff" fill-opacity=".05"/><path d="M86 96h194v240H86z" fill="#fff" fill-opacity=".05"/><path d="M280 96l34-30v240l-34 30z" fill="#fff" fill-opacity=".04"/>' +
        '<path d="M100 120v120M112 110v40" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/></g>' +
        '<rect x="86" y="324" width="194" height="12" fill="#c9a45c" opacity=".6"/></svg>',
      cupula:
        '<svg viewBox="0 0 400 368"><defs><linearGradient id="md" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7a4a2a"/><stop offset="1" stop-color="#3e2414"/></linearGradient>' +
        '<linearGradient id="vd" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".3" stop-color="#fff" stop-opacity=".02"/><stop offset=".85" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity=".14"/></linearGradient></defs>' +
        '<path d="M92 318V150a108 108 0 0 1 216 0v168z" fill="url(#vd)" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>' +
        '<path d="M110 290V156a90 90 0 0 1 40-74" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>' +
        '<g fill="#ffd98a">' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (i) {
          var a = Math.PI * (0.12 + i * 0.095), x = 200 + Math.cos(a + Math.PI) * 96, y = 182 - Math.sin(a) * 92;
          return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.6" opacity=".9"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7" opacity=".18"/>';
        }).join('') + '</g>' +
        '<rect x="74" y="316" width="252" height="26" rx="6" fill="url(#md)"/><rect x="84" y="342" width="232" height="10" rx="4" fill="#2e1a0e"/></svg>'
    }[id] || '';
    cont.classList.remove('visible');
    setTimeout(function () {
      cont.innerHTML = svg;
      if (svg) cont.classList.add('visible');
    }, 150);
  }

  /* ========================= 7. OCASIONES ============================= */
  var OCASIONES = {
    sanvalentin: { nombre: 'San Valentín', color: 'rojo', carta: 'impresa', mensaje: 'Eres mi lugar favorito en el mundo. Te amo hoy y siempre.' },
    aniversario: { nombre: 'tu aniversario', color: 'rojo', carta: 'manuscrita', mensaje: 'Gracias por cada día a tu lado. Por muchos años más juntos.' },
    cumpleanos: { nombre: 'un cumpleaños', color: 'rosa', carta: 'tarjeta', mensaje: '¡Feliz cumpleaños! Que esta rosa te recuerde lo especial que eres.' },
    madre: { nombre: 'el Día de la Madre', color: 'rosa', carta: 'manuscrita', mensaje: 'Mamá, gracias por tu amor infinito. Eres mi ejemplo y mi orgullo.' },
    graduacion: { nombre: 'una graduación', color: 'blanco', carta: 'manuscrita', mensaje: '¡Lo lograste! Qué orgullo verte cumplir tus sueños. Esto es solo el comienzo.' },
    porquesi: { nombre: 'un día cualquiera', color: 'lavanda', carta: 'tarjeta', mensaje: 'Solo quería recordarte lo mucho que significas para mí.' }
  };
  function ocasiones() {
    $$('[data-ocasion]').forEach(function (b) {
      b.addEventListener('click', function () {
        var o = OCASIONES[b.dataset.ocasion];
        if (!o || !config) return;
        config.aplicar(o);
        $('#personaliza').scrollIntoView({ behavior: reducido ? 'auto' : 'smooth' });
        U.aviso('Te preparamos una sugerencia para ' + o.nombre);
        setTimeout(function () { $('#config-mensaje').focus({ preventScroll: true }); }, 900);
      });
    });
  }

  /* ====================== 8. TABLA DE PRECIOS ========================= */
  function tablaPrecios() {
    var tb = $('#tabla-precios');
    if (!tb) return;
    var html = '';
    Object.keys(CATEGORIAS).forEach(function (cat) {
      // Las rosas se cobran según cuántas lleva el ramo (decoración incluida)
      if (cat === 'rosas') {
        html += '<tr class="grupo"><th colspan="2" scope="colgroup">Rosas eternas de satín · decoración incluida</th></tr>';
        CFG.configurador.preciosRamo.forEach(function (p, i) {
          var n = i + 1;
          html += '<tr><td>' + (n === 1 ? '1 rosa' : 'Ramo de ' + n + ' rosas') +
            (n === CFG.configurador.preciosRamo.length ? '<small>El favorito: como el de nuestra foto</small>' : '') +
            '</td><td class="precio">' + precio(p) + '</td></tr>';
        });
        return;
      }
      var lista = CFG.productos.filter(function (p) { return p.categoria === cat; });
      if (!lista.length) return;
      html += '<tr class="grupo"><th colspan="2" scope="colgroup">' + CATEGORIAS[cat] + '</th></tr>';
      lista.forEach(function (p) {
        html += '<tr><td>' + escapar(p.nombre) + '<small>' + escapar(p.descripcion) + '</small></td><td class="precio">' + precio(p.precio) + '</td></tr>';
      });
    });
    tb.innerHTML = html;
  }

  /* ======================== 9. ZONAS DE ENVÍO ========================= */
  function zonasEnvio() {
    var cont = $('#zonas-envio');
    if (!cont) return;
    var iconos = { retiro: 'i-pin', quito: 'i-ciudad', valles: 'i-montana', nacional: 'i-camion' };
    cont.innerHTML = CFG.envios.map(function (z, i) {
      return '<article class="zona" data-revelar style="--retraso:' + (i * 0.08) + 's">' +
        '<svg class="zona__icono" aria-hidden="true"><use href="#' + (iconos[z.id] || 'i-pin') + '"/></svg>' +
        '<h3>' + escapar(z.zona) + '</h3><p>' + escapar(z.detalle) + '</p>' +
        '<span class="zona__costo">' + (z.costo ? (z.desde ? '<small>desde </small>' : '') + precio(z.costo) : 'Gratis') + '</span>' +
        '<span class="zona__tiempo">' + escapar(z.tiempo) + '</span></article>';
    }).join('');
    U.revelar($$('.zona', cont));
  }

  /* ===================== 10. PREGUNTAS FRECUENTES ===================== */
  function faq() {
    $$('.faq__pregunta').forEach(function (b) {
      b.addEventListener('click', function () {
        var abierto = b.getAttribute('aria-expanded') === 'true';
        b.setAttribute('aria-expanded', String(!abierto));
        document.getElementById(b.getAttribute('aria-controls')).classList.toggle('abierto', !abierto);
      });
    });
  }

  /* ======================== 11. CONTACTO ============================== */
  function contacto() {
    var form = $('#form-contacto');
    if (!form) return;
    var estadoEl = $('#estado-contacto');
    function marcar(campo, error) {
      var cont = campo.closest('.campo') || campo.closest('.casilla');
      cont.classList.toggle('error', error);
      campo.setAttribute('aria-invalid', String(error));
      var msg = cont.querySelector('.campo__error');
      if (msg) campo.setAttribute('aria-describedby', msg.id);
    }
    function validar() {
      var ok = true;
      var n = form.nombre, c = form.correo, m = form.mensaje, p = form.privacidad;
      var e1 = n.value.trim().length < 2; marcar(n, e1); ok = ok && !e1;
      var e2 = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.value.trim()); marcar(c, e2); ok = ok && !e2;
      var e3 = m.value.trim().length < 5; marcar(m, e3); ok = ok && !e3;
      var e4 = !p.checked; marcar(p, e4); ok = ok && !e4;
      return ok;
    }
    $$('input, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () {
        if ((el.closest('.campo') || el.closest('.casilla') || {}).classList && (el.closest('.campo') || el.closest('.casilla')).classList.contains('error')) validar();
      });
    });
    function textoWhatsApp() {
      return 'Hola, soy ' + form.nombre.value.trim() + ' (' + form.correo.value.trim() + ').\n\n' + form.mensaje.value.trim();
    }
    function exito(html) {
      estadoEl.className = 'formulario__estado exito';
      estadoEl.innerHTML = html;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form['sitio-web'].value) return; // trampa anti-spam
      if (!validar()) {
        estadoEl.className = 'formulario__estado fallo';
        estadoEl.textContent = 'Revisa los campos marcados, por favor.';
        var primero = form.querySelector('[aria-invalid="true"]');
        if (primero) primero.focus();
        return;
      }
      var boton = form.querySelector('[type="submit"]');
      var enlaceWa = U.enlaceWhatsApp(textoWhatsApp());
      var alternativa = '¡Gracias! Para enviarlo ahora mismo, <a href="' + enlaceWa + '" target="_blank" rel="noopener">abre WhatsApp con tu mensaje listo</a>.';

      // En Netlify el formulario se guarda solo (Netlify Forms); en otros hostings ofrecemos WhatsApp
      var enNetlify = CFG.formularioNetlify === true || /\.netlify\.app$/.test(location.hostname);
      if (!enNetlify) { exito(alternativa); return; }
      boton.disabled = true;
      boton.textContent = 'Enviando…';
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error('sin-formularios');
        exito('¡Gracias, ' + escapar(form.nombre.value.trim()) + '! Recibimos tu mensaje y te responderemos muy pronto.');
        form.reset();
      }).catch(function () {
        exito(alternativa);
      }).then(function () {
        boton.disabled = false;
        boton.textContent = 'Enviar mensaje';
      });
    });
  }

  /* ============ 12. LÍNEA DE TIEMPO Y PARALAJE (GSAP opcional) ======== */
  function lineaTiempo() {
    var linea = $('#linea-tiempo');
    if (!linea) return;
    var barra = $('.linea-tiempo__progreso', linea);
    var pasos = $$('.paso', linea);

    if (window.gsap && window.ScrollTrigger && !reducido) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(barra, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: linea, start: 'top 70%', end: 'bottom 65%', scrub: 0.6 }
      });
      pasos.forEach(function (p) {
        ScrollTrigger.create({
          trigger: p, start: 'top 68%',
          onEnter: function () { p.classList.add('activo'); },
          onLeaveBack: function () { p.classList.remove('activo'); }
        });
      });
      gsap.to('#lienzo-que-es', {
        yPercent: -5, ease: 'none',
        scrollTrigger: { trigger: '#que-es', start: 'top bottom', end: 'bottom top', scrub: true }
      });
      return;
    }
    // Alternativa sin GSAP: progreso calculado con el scroll
    function alDesplazar() {
      var r = linea.getBoundingClientRect(), vh = window.innerHeight;
      var prog = Math.min(1, Math.max(0, (vh * 0.7 - r.top) / (r.height - vh * 0.05)));
      barra.style.transform = 'scaleY(' + (reducido ? 1 : prog) + ')';
      pasos.forEach(function (p) { p.classList.toggle('activo', reducido || p.getBoundingClientRect().top < vh * 0.68); });
    }
    window.addEventListener('scroll', alDesplazar, { passive: true });
    alDesplazar();
  }

  /* ============================ INICIO ================================ */
  function iniciar() {
    hero();
    rosaQueEs();
    catalogo();
    iniciarGaleria();
    carrito();
    configurador();
    ocasiones();
    tablaPrecios();
    zonasEnvio();
    faq();
    contacto();
    lineaTiempo();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
