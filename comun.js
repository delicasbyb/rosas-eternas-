/* ==========================================================================
   COMÚN — Funciones compartidas por todas las páginas
   Navegación, menú móvil, banner de cookies, botón de WhatsApp,
   volver arriba, apariciones al hacer scroll y utilidades.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.RPTV_CONFIG || {};
  var CLAVE_CONSENTIMIENTO = 'rptv_consentimiento';
  var CLAVE_PEDIDO = 'rptv_pedido';
  var VERSION_COOKIES = 1;
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------ Utilidades ----------------------------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* Almacenamiento local protegido (puede fallar en modo privado) */
  var almacen = {
    leer: function (clave, defecto) {
      try { var v = localStorage.getItem(clave); return v ? JSON.parse(v) : defecto; }
      catch (e) { return defecto; }
    },
    guardar: function (clave, valor) {
      try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento */ }
    }
  };

  function formatoPrecio(n) { return '$' + Number(n || 0).toFixed(2); }

  function enlaceWhatsApp(texto) {
    return 'https://wa.me/' + (CFG.whatsapp || '') + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }

  /* Mantiene el foco del teclado dentro de un panel abierto (accesibilidad) */
  function atraparFoco(contenedor) {
    function alPulsar(e) {
      if (e.key !== 'Tab') return;
      var focos = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', contenedor)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focos.length) return;
      var primero = focos[0], ultimo = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
    contenedor.addEventListener('keydown', alPulsar);
    return function () { contenedor.removeEventListener('keydown', alPulsar); };
  }

  /* Notificación breve en pantalla */
  var temporizadorAviso;
  function aviso(mensaje) {
    var el = $('#aviso-flotante');
    if (!el) {
      el = document.createElement('div');
      el.id = 'aviso-flotante';
      el.className = 'aviso-flotante';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span></span>';
    el.querySelector('span').textContent = mensaje;
    requestAnimationFrame(function () { el.classList.add('visible'); });
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(function () { el.classList.remove('visible'); }, 3200);
  }

  /* --------------------- Datos del negocio en el HTML -------------------- */
  function rellenarDatos() {
    $$('[data-config]').forEach(function (el) {
      var valor = CFG[el.getAttribute('data-config')];
      if (valor) el.textContent = valor;
    });
    $$('[data-wa]').forEach(function (el) {
      el.href = enlaceWhatsApp(el.getAttribute('data-wa') || 'Hola, quisiera información sobre sus rosas eternas 🌹');
      el.target = '_blank';
      el.rel = 'noopener';
    });
    // Correo: solo se muestra si está configurado
    $$('[data-correo]').forEach(function (el) {
      if (CFG.correo) {
        el.hidden = false;
        var a = el.tagName === 'A' ? el : el.querySelector('a');
        if (a) { a.href = 'mailto:' + CFG.correo; }
        $$('[data-correo-texto]', el).concat(el.matches('[data-correo-texto]') ? [el] : []).forEach(function (t) { t.textContent = CFG.correo; });
      }
    });
    // Tabla de zonas de envío (páginas legales), leída de config.js
    $$('[data-tabla-envios]').forEach(function (tb) {
      if (!CFG.envios) return;
      tb.innerHTML = CFG.envios.map(function (z) {
        var costo = z.costo ? (z.desde ? 'desde ' : '') + formatoPrecio(z.costo) : 'Gratis';
        return '<tr><td><strong>' + z.zona + '</strong></td><td>' + z.detalle + '</td><td>' + costo + '</td><td>' + z.tiempo + '</td></tr>';
      }).join('');
    });
    // Redes sociales: solo las que tienen URL
    var iconos = {
      instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
      tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.4 2.2 1.8 3.7 4 3.9v3a7.4 7.4 0 0 1-4-1.2v6.1A5.8 5.8 0 1 1 10.8 9v3.1a2.7 2.7 0 1 0 2.7 2.7V3h3.1z"/></svg>',
      facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.6-1.5h1.6V4.3a21 21 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.2H7.6v3h2.7V21h3.2z"/></svg>',
      whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3c-.3.3-1 1-1 2.3s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3 1.8.8 2.5.8 3.4.7.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>'
    };
    var nombres = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', whatsapp: 'WhatsApp' };
    $$('[data-redes]').forEach(function (cont) {
      var html = '';
      var redes = CFG.redes || {};
      Object.keys(redes).forEach(function (red) {
        if (redes[red]) {
          html += '<a class="red" href="' + redes[red] + '" target="_blank" rel="noopener" aria-label="' + nombres[red] + ' (se abre en otra pestaña)">' + iconos[red] + '</a>';
        }
      });
      html += '<a class="red" href="' + enlaceWhatsApp('Hola, quisiera información sobre sus rosas eternas 🌹') + '" target="_blank" rel="noopener" aria-label="WhatsApp (se abre en otra pestaña)">' + iconos.whatsapp + '</a>';
      cont.innerHTML = html;
    });
  }

  /* ---------------------------- Pantalla de carga ------------------------ */
  function cargador() {
    var el = $('#cargador');
    if (!el) return;
    var ocultado = false;
    function ocultar() {
      if (ocultado) return;
      ocultado = true;
      el.classList.add('oculto');
      document.dispatchEvent(new CustomEvent('rptv:cargado'));
      setTimeout(function () { el.remove(); }, 900);
    }
    var minimo = movimientoReducido ? 0 : 1400; // deja ver la rosa dibujándose
    var inicio = performance.now();
    window.addEventListener('load', function () {
      setTimeout(ocultar, Math.max(0, minimo - (performance.now() - inicio)));
    });
    setTimeout(ocultar, 3500); // nunca bloquear más de 3,5 s
  }

  /* ------------------------------ Navegación ----------------------------- */
  function navegacion() {
    var nav = $('.nav');
    if (!nav) return;
    var siempreSolida = nav.classList.contains('nav--siempre-solida');

    function alDesplazar() {
      if (!siempreSolida) nav.classList.toggle('nav--solida', window.scrollY > 40);
      var arriba = $('.volver-arriba');
      if (arriba) arriba.classList.toggle('visible', window.scrollY > window.innerHeight * 0.9);
    }
    window.addEventListener('scroll', alDesplazar, { passive: true });
    alDesplazar();

    // Menú hamburguesa
    var boton = $('.nav__hamburguesa');
    var menu = $('#menu-movil');
    var liberarFoco = null;
    function cerrarMenu(devolverFoco) {
      if (!menu.classList.contains('abierto')) return;
      menu.classList.remove('abierto');
      boton.setAttribute('aria-expanded', 'false');
      boton.setAttribute('aria-label', 'Abrir menú');
      document.body.classList.remove('menu-abierto', 'sin-scroll');
      menu.setAttribute('aria-hidden', 'true');
      if (liberarFoco) liberarFoco();
      if (devolverFoco) boton.focus();
    }
    if (boton && menu) {
      boton.addEventListener('click', function () {
        var abrir = !menu.classList.contains('abierto');
        if (!abrir) return cerrarMenu(false);
        menu.classList.add('abierto');
        menu.setAttribute('aria-hidden', 'false');
        boton.setAttribute('aria-expanded', 'true');
        boton.setAttribute('aria-label', 'Cerrar menú');
        document.body.classList.add('menu-abierto', 'sin-scroll');
        liberarFoco = atraparFoco(nav); // el menú móvil vive dentro de <header class="nav">
        var primero = menu.querySelector('a');
        if (primero) setTimeout(function () { primero.focus(); }, 50);
      });
      $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { cerrarMenu(false); }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(true); });
      window.addEventListener('resize', function () { if (window.innerWidth >= 1180) cerrarMenu(false); });
    }

    // Resaltar el enlace de la sección visible
    var enlaces = $$('.nav__enlace[href^="#"]');
    if (enlaces.length && 'IntersectionObserver' in window) {
      var mapa = {};
      enlaces.forEach(function (a) { mapa[a.getAttribute('href').slice(1)] = a; });
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting && mapa[en.target.id]) {
            enlaces.forEach(function (a) { a.removeAttribute('aria-current'); });
            mapa[en.target.id].setAttribute('aria-current', 'true');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(mapa).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
    }

    // Volver arriba
    var arriba = $('.volver-arriba');
    if (arriba) arriba.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: movimientoReducido ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------ Contador del pedido -------------------------- */
  function actualizarContador(animar) {
    var items = almacen.leer(CLAVE_PEDIDO, []);
    var total = items.reduce(function (s, it) { return s + (it.cantidad || 1); }, 0);
    $$('.nav__contador').forEach(function (c) {
      c.textContent = total;
      if (animar) { c.classList.remove('salta'); void c.offsetWidth; c.classList.add('salta'); }
    });
  }

  /* ---------------------- Aparición al hacer scroll ---------------------- */
  var observadorApariciones = null;
  /* Observa elementos [data-revelar]; se puede llamar de nuevo con
     elementos creados dinámicamente (catálogo, zonas de envío…) */
  function revelar(elementos) {
    elementos = elementos || $$('[data-revelar]');
    if (!('IntersectionObserver' in window) || movimientoReducido) {
      elementos.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    if (!observadorApariciones) {
      observadorApariciones = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('visible'); observadorApariciones.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    elementos.forEach(function (el) { observadorApariciones.observe(el); });
  }
  function apariciones() { revelar(); }

  /* ============================== COOKIES ================================
     Solo usamos almacenamiento técnico (necesario). Las categorías
     "analíticas" y "marketing" quedan preparadas: NADA se carga hasta que
     el usuario acepte. Para añadir, por ejemplo, Google Analytics, coloca
     su código dentro de cargarOpcionales().                                */
  function cargarOpcionales(c) {
    if (c.analiticas) {
      /* Ejemplo (desactivado). Descomenta y reemplaza G-XXXX si usas Analytics:
      var s = document.createElement('script');
      s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXX';
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date()); gtag('config', 'G-XXXX', { anonymize_ip: true });
      */
    }
    if (c.marketing) {
      /* Aquí iría, por ejemplo, el píxel de Meta, solo con consentimiento. */
    }
  }

  function cookies() {
    var banner = $('#cookies');
    var modal = $('#modal-cookies');
    if (!banner || !modal) return;
    var consentimiento = almacen.leer(CLAVE_CONSENTIMIENTO, null);
    var liberarFoco = null;
    var focoPrevio = null;

    function mostrarBanner() {
      banner.hidden = false;
      requestAnimationFrame(function () {
        banner.classList.add('visible');
        document.body.classList.add('cookies-visibles');
        document.body.style.setProperty('--alto-cookies', (banner.offsetHeight + 12) + 'px');
      });
    }
    function ocultarBanner() {
      banner.classList.remove('visible');
      document.body.classList.remove('cookies-visibles');
      setTimeout(function () { banner.hidden = true; }, 600);
    }
    function guardar(analiticas, marketing) {
      consentimiento = { necesarias: true, analiticas: !!analiticas, marketing: !!marketing, fecha: new Date().toISOString(), version: VERSION_COOKIES };
      almacen.guardar(CLAVE_CONSENTIMIENTO, consentimiento);
      cargarOpcionales(consentimiento);
      ocultarBanner();
      cerrarModal();
      aviso('Tus preferencias de cookies se guardaron');
    }
    function abrirModal() {
      focoPrevio = document.activeElement;
      $('#cookie-analiticas').checked = !!(consentimiento && consentimiento.analiticas);
      $('#cookie-marketing').checked = !!(consentimiento && consentimiento.marketing);
      modal.hidden = false;
      requestAnimationFrame(function () { modal.classList.add('abierto'); });
      liberarFoco = atraparFoco(modal);
      setTimeout(function () { $('#cookie-analiticas').focus(); }, 60);
    }
    function cerrarModal() {
      if (!modal.classList.contains('abierto')) return;
      modal.classList.remove('abierto');
      setTimeout(function () { modal.hidden = true; }, 350);
      if (liberarFoco) liberarFoco();
      if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
    }

    $('[data-cookies="aceptar"]', banner).addEventListener('click', function () { guardar(true, true); });
    $('[data-cookies="rechazar"]', banner).addEventListener('click', function () { guardar(false, false); });
    $('[data-cookies="configurar"]', banner).addEventListener('click', abrirModal);
    $('[data-cookies="guardar"]', modal).addEventListener('click', function () {
      guardar($('#cookie-analiticas').checked, $('#cookie-marketing').checked);
    });
    $('[data-cookies="aceptar-todo"]', modal).addEventListener('click', function () { guardar(true, true); });
    $('[data-cookies="cerrar"]', modal).addEventListener('click', cerrarModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrarModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarModal(); });
    $$('[data-abrir-cookies]').forEach(function (b) { b.addEventListener('click', abrirModal); });

    if (!consentimiento || consentimiento.version !== VERSION_COOKIES) {
      setTimeout(mostrarBanner, 1800);
    } else {
      cargarOpcionales(consentimiento);
    }
  }

  /* -------------------------------- Inicio ------------------------------- */
  window.RPTV = {
    $: $, $$: $$,
    almacen: almacen,
    CLAVE_PEDIDO: CLAVE_PEDIDO,
    formatoPrecio: formatoPrecio,
    enlaceWhatsApp: enlaceWhatsApp,
    atraparFoco: atraparFoco,
    aviso: aviso,
    actualizarContador: actualizarContador,
    revelar: revelar,
    movimientoReducido: movimientoReducido
  };

  function iniciar() {
    rellenarDatos();
    cargador();
    navegacion();
    actualizarContador(false);
    apariciones();
    cookies();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
