/* ==========================================================================
   ROSA ETERNA — Motor de animación en Canvas 2D
   --------------------------------------------------------------------------
   Pétalos sueltos flotan por la pantalla y, uno por uno, desde el centro
   hacia afuera, se colocan en capas hasta FORMAR UNA ROSA. Luego la rosa
   "respira", brilla suavemente y caen pétalos ocasionales.

   Técnica:
   - Cada capa de pétalos se pre-renderiza una sola vez en un lienzo
     auxiliar (sprite) con curvas Bézier, degradados, sombra, brillo y borde
     enrollado. En cada cuadro solo se dibujan esos sprites con
     transformaciones → 60 fps incluso con 50+ pétalos.
   - El giro 3D se simula escalando el eje X con cos(ángulo) y mostrando el
     reverso del pétalo (más claro) cuando está de espaldas.

   Uso:
     const escena = RosaEterna.crearEscena(canvas, { movil, reducido, alArmar });
     escena.iniciar();
     RosaEterna.dibujarEstatica(canvas, { paleta: 'rosa' });
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------- Utilidades ---------------------------- */
  var TAU = Math.PI * 2;
  function limitar(v, a, b) { return v < a ? a : v > b ? b : v; }
  function interpolar(a, b, t) { return a + (b - a) * t; }
  function suavizar(t) { return t * t * (3 - 2 * t); }
  function entradaSalida(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function modulo(a, n) { return ((a % n) + n) % n; }

  /* Generador aleatorio con semilla: la rosa siempre sale igual */
  function aleatorioConSemilla(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexARgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mezclarHex(a, b, t) {
    var A = hexARgb(a), B = hexARgb(b);
    return '#' + A.map(function (v, i) {
      return ('0' + Math.round(v + (B[i] - v) * t).toString(16)).slice(-2);
    }).join('');
  }
  function rgba(hex, al) {
    var c = hexARgb(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + al + ')';
  }
  function crearLienzo(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  /* ----------------------------- Paletas ------------------------------ */
  var PALETAS = {
    rojo:    { centro: '#1f0108', base: '#460310', medio: '#8c0a24', borde: '#c01d3c', luz: '#ff9cb0', reverso: '#b3324b', brillo: '#ff6f8c' },
    amarillo: { centro: '#4a2000', base: '#9a4d00', medio: '#e8900f', borde: '#ffc53d', luz: '#fff2b8', reverso: '#f4b13a', brillo: '#ffd27a' },
    rosa:    { centro: '#8e3a52', base: '#bf6a84', medio: '#e79cb0', borde: '#fad6de', luz: '#fff5f7', reverso: '#f0bfcb', brillo: '#ffc2cf' },
    blanco:  { centro: '#8c7a60', base: '#c4b294', medio: '#ebe0ce', borde: '#fffbf3', luz: '#ffffff', reverso: '#f4ecdf', brillo: '#fff3d6' },
    lavanda: { centro: '#3e2754', base: '#6a4b88', medio: '#a786c6', borde: '#e0d0f1', luz: '#f8f2ff', reverso: '#c7b1de', brillo: '#d9c2ff' },
    azul:    { centro: '#0a1536', base: '#182c69', medio: '#2f56aa', borde: '#7a9ce2', luz: '#dbe6ff', reverso: '#5a7cc8', brillo: '#9db8ff' },
    negro:   { centro: '#060203', base: '#160a0e', medio: '#33141d', borde: '#6e3443', luz: '#d39aa7', reverso: '#4b2531', brillo: '#b0566b' }
  };
  var HOJA = { base: '#14301a', medio: '#335f33', borde: '#7ea667', luz: '#d6efc4' };

  /* ---------------------- Geometría de la rosa ------------------------
     Unidades relativas al radio R. Cada capa:
       n: pétalos · r: distancia de la base al centro · L: largo
       w: medio ancho · giro: inclinación tangencial (espiral)
       tono: 0 = interior oscuro → 1 = exterior luminoso                   */
  var CAPAS = [
    { n: 3, r: 0.02, L: 0.16, w: 0.15, giro: 1.45, tono: 0.00 },
    { n: 4, r: 0.05, L: 0.26, w: 0.22, giro: 1.15, tono: 0.12 },
    { n: 5, r: 0.10, L: 0.37, w: 0.30, giro: 0.85, tono: 0.26 },
    { n: 6, r: 0.16, L: 0.49, w: 0.38, giro: 0.55, tono: 0.42 },
    { n: 7, r: 0.24, L: 0.60, w: 0.45, giro: 0.32, tono: 0.60 },
    { n: 8, r: 0.32, L: 0.68, w: 0.50, giro: 0.16, tono: 0.80 },
    { n: 8, r: 0.40, L: 0.72, w: 0.55, giro: 0.06, tono: 1.00 }
  ];
  var HOJAS = { r: 0.50, L: 0.74, w: 0.27 };

  /* ------------------------- Forma del pétalo -------------------------
     Base en (0,0) y punta hacia -Y. Estrecho en la base y ancho y
     redondeado arriba (forma de abanico), como un pétalo de rosa real.   */
  function trazarPetalo(g, L, w) {
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(w * 0.38, -L * 0.06, w * 1.12, -L * 0.46, w * 0.96, -L * 0.8);
    g.bezierCurveTo(w * 0.84, -L * 1.03, w * 0.34, -L * 1.04, 0, -L * 1.0);
    g.bezierCurveTo(-w * 0.34, -L * 1.04, -w * 0.84, -L * 1.03, -w * 0.96, -L * 0.8);
    g.bezierCurveTo(-w * 1.12, -L * 0.46, -w * 0.38, -L * 0.06, 0, 0);
    g.closePath();
  }
  function trazarHoja(g, L, w) {
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(w * 1.15, -L * 0.22, w * 0.85, -L * 0.72, 0, -L);
    g.bezierCurveTo(-w * 0.85, -L * 0.72, -w * 1.15, -L * 0.22, 0, 0);
    g.closePath();
  }

  function coloresCapa(pal, tono, reverso) {
    if (reverso) {
      return {
        base: mezclarHex(pal.base, pal.reverso, 0.55),
        medio: pal.reverso,
        borde: mezclarHex(pal.reverso, pal.luz, 0.35),
        luz: pal.luz
      };
    }
    return {
      base: mezclarHex(pal.centro, pal.base, tono),
      medio: mezclarHex(pal.base, pal.medio, 0.35 + 0.65 * tono),
      borde: mezclarHex(pal.medio, pal.borde, 0.25 + 0.75 * tono),
      luz: pal.luz
    };
  }

  /* Pre-renderiza un pétalo con volumen, sombra, venas y borde enrollado */
  function spritePetalo(L, w, col, reverso) {
    var sb = Math.max(3, L * 0.09);
    var pad = Math.ceil(sb * 2 + 2);
    var c = crearLienzo(w * 2.25 + pad * 2, L * 1.06 + pad * 2);
    var g = c.getContext('2d');
    var ax = c.width / 2, ay = c.height - pad;
    g.translate(ax, ay);

    // 1) Cuerpo con degradado (oscuro en la base → luminoso en el borde) y sombra
    var cuerpo = g.createLinearGradient(0, 0, 0, -L);
    cuerpo.addColorStop(0, col.base);
    cuerpo.addColorStop(0.58, col.medio);
    cuerpo.addColorStop(1, col.borde);
    g.shadowColor = 'rgba(12,0,4,0.62)';
    g.shadowBlur = sb * 1.2;
    g.shadowOffsetY = -sb * 0.3;
    trazarPetalo(g, L, w);
    g.fillStyle = cuerpo;
    g.fill();
    g.shadowColor = 'transparent';
    g.shadowBlur = 0;
    g.shadowOffsetY = 0;

    g.save();
    trazarPetalo(g, L, w);
    g.clip();

    // 2) Curvatura lateral (el pétalo es cóncavo)
    var lateral = g.createLinearGradient(-w, 0, w, 0);
    lateral.addColorStop(0, 'rgba(15,0,5,0.38)');
    lateral.addColorStop(0.32, 'rgba(15,0,5,0)');
    lateral.addColorStop(0.7, 'rgba(15,0,5,0)');
    lateral.addColorStop(1, 'rgba(15,0,5,0.26)');
    g.fillStyle = lateral;
    g.fillRect(-w * 1.3, -L * 1.1, w * 2.6, L * 1.2);

    // 3) Brillo aterciopelado
    var brillo = g.createRadialGradient(w * 0.22, -L * 0.62, 0, w * 0.22, -L * 0.62, L * 0.55);
    brillo.addColorStop(0, rgba(col.luz, reverso ? 0.14 : 0.22));
    brillo.addColorStop(1, rgba(col.luz, 0));
    g.fillStyle = brillo;
    g.fillRect(-w * 1.3, -L * 1.1, w * 2.6, L * 1.2);

    // 4) Base en sombra (profundidad hacia el centro de la flor)
    if (!reverso) {
      var base = g.createLinearGradient(0, 0, 0, -L * 0.62);
      base.addColorStop(0, 'rgba(8,0,3,0.7)');
      base.addColorStop(1, 'rgba(8,0,3,0)');
      g.fillStyle = base;
      g.fillRect(-w * 1.3, -L * 0.7, w * 2.6, L * 0.72);
    }

    // 5) Venas muy finas
    g.strokeStyle = rgba(col.luz, 0.07);
    g.lineWidth = Math.max(0.6, L * 0.006);
    for (var i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(i * w * 0.04, -L * 0.03);
      g.quadraticCurveTo(i * w * 0.32, -L * 0.5, i * w * 0.22, -L * 0.93);
      g.stroke();
    }

    // 6) Borde enrollado: luz que se concentra en el contorno superior
    var borde = g.createLinearGradient(0, -L * 0.45, 0, -L);
    borde.addColorStop(0, rgba(col.luz, 0));
    borde.addColorStop(1, rgba(col.luz, reverso ? 0.35 : 0.62));
    trazarPetalo(g, L, w);
    g.strokeStyle = borde;
    g.lineWidth = Math.max(1, L * 0.035);
    g.stroke();
    var bordeSuave = g.createLinearGradient(0, -L * 0.5, 0, -L);
    bordeSuave.addColorStop(0, rgba(col.luz, 0));
    bordeSuave.addColorStop(1, rgba(col.luz, 0.12));
    g.strokeStyle = bordeSuave;
    g.lineWidth = Math.max(2, L * 0.16);
    g.stroke();
    g.restore();

    return { c: c, ax: ax, ay: ay };
  }

  function spriteHoja(L, w, reverso) {
    var sb = Math.max(3, L * 0.08);
    var pad = Math.ceil(sb * 2 + 2);
    var c = crearLienzo(w * 2.4 + pad * 2, L * 1.02 + pad * 2);
    var g = c.getContext('2d');
    var ax = c.width / 2, ay = c.height - pad;
    g.translate(ax, ay);
    var gr = g.createLinearGradient(-w, 0, w, -L);
    gr.addColorStop(0, reverso ? HOJA.medio : HOJA.base);
    gr.addColorStop(0.55, HOJA.medio);
    gr.addColorStop(1, HOJA.borde);
    g.shadowColor = 'rgba(0,0,0,0.45)';
    g.shadowBlur = sb;
    trazarHoja(g, L, w);
    g.fillStyle = gr;
    g.fill();
    g.shadowColor = 'transparent';
    g.save();
    trazarHoja(g, L, w);
    g.clip();
    // Nervadura central y secundarias
    g.strokeStyle = rgba(HOJA.luz, 0.35);
    g.lineWidth = Math.max(0.8, L * 0.012);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(w * 0.08, -L * 0.5, 0, -L); g.stroke();
    g.strokeStyle = rgba(HOJA.luz, 0.14);
    for (var i = 1; i < 6; i++) {
      var y = -L * i / 6.5;
      g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(w * 0.4, y - L * 0.06, w * 0.8, y - L * 0.12); g.stroke();
      g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(-w * 0.4, y - L * 0.06, -w * 0.8, y - L * 0.12); g.stroke();
    }
    var lat = g.createLinearGradient(-w, 0, w, 0);
    lat.addColorStop(0, 'rgba(0,0,0,0.3)');
    lat.addColorStop(0.5, 'rgba(0,0,0,0)');
    lat.addColorStop(1, 'rgba(255,255,255,0.06)');
    g.fillStyle = lat;
    g.fillRect(-w * 1.3, -L * 1.05, w * 2.6, L * 1.1);
    g.restore();
    return { c: c, ax: ax, ay: ay };
  }

  function spriteResplandor(pal, tam) {
    var c = crearLienzo(tam, tam), g = c.getContext('2d'), r = tam / 2;
    var gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, rgba(pal.brillo, 0.5));
    gr.addColorStop(0.3, rgba(pal.brillo, 0.2));
    gr.addColorStop(0.62, 'rgba(201,164,92,0.07)');
    gr.addColorStop(1, 'rgba(201,164,92,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, tam, tam);
    return c;
  }

  function spriteChispa(tam) {
    var c = crearLienzo(tam, tam), g = c.getContext('2d'), r = tam / 2;
    var gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(255,250,235,1)');
    gr.addColorStop(0.25, 'rgba(240,214,160,0.75)');
    gr.addColorStop(1, 'rgba(201,164,92,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, tam, tam);
    return c;
  }

  /* Versión desenfocada de un sprite (pétalos en primer plano, efecto bokeh) */
  function desenfocar(sp, radio) {
    var pad = Math.ceil(radio * 3);
    var c = crearLienzo(sp.c.width + pad * 2, sp.c.height + pad * 2);
    var g = c.getContext('2d');
    if ('filter' in g) g.filter = 'blur(' + radio + 'px)';
    g.drawImage(sp.c, pad, pad);
    return { c: c, ax: sp.ax + pad, ay: sp.ay + pad };
  }

  /* Parámetros de vuelo libre de un pétalo antes de unirse a la rosa */
  function vueloAleatorio(r) {
    var fx, fy, intentos = 0;
    do {
      fx = -0.04 + r() * 1.08;
      fy = -0.04 + r() * 0.98;
      intentos++;
    } while (Math.hypot(fx - 0.5, (fy - 0.4) * 0.8) < 0.22 && intentos < 25);
    return {
      fx: fx, fy: fy,
      vx: (r() - 0.5) * 0.025, vy: 0.008 + r() * 0.022,
      amp: 0.012 + r() * 0.03, frec: 0.35 + r() * 0.6, fase: r() * TAU,
      rot0: r() * TAU, vrot: (r() - 0.5) * 1.6,
      flip0: r() * TAU, vflip: (r() < 0.5 ? -1 : 1) * (1.2 + r() * 2.2),
      sLibre: 0.55 + r() * 0.3,
      aparece: r() * 0.9
    };
  }

  /* =============================== ESCENA ============================== */
  function Escena(canvas, opciones) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opc = Object.assign({
      paleta: 'rojo',
      movil: false,
      reducido: false,     // prefers-reduced-motion: rosa armada, sin animación
      estatico: false,     // render único (configurador, imágenes)
      brillo: true,
      chispas: true,
      margenSuperior: 80,
      alArmar: null
    }, opciones || {});
    this.t = 0;
    this.corriendo = false;
    this.armada = false;
    this.ultimo = 0;
    this.puntero = { x: 0, y: 0, ox: 0, oy: 0 };
    this.caen = [];
    this.proxCaida = 0;
    this.bucle = this.bucle.bind(this);
    this.construir();
    this.redimensionar();
  }

  Escena.prototype.construir = function () {
    var r = aleatorioConSemilla(20261110);
    var movil = this.opc.movil;
    this.capas = movil ? CAPAS.slice(0, 6) : CAPAS;
    var petalos = [], orden = 0;

    this.capas.forEach(function (cp, ci) {
      var desfase = ci * 2.39996 + r() * 0.2; // ángulo áureo: reparto natural
      for (var j = 0; j < cp.n; j++) {
        // Irregularidad natural: ninguna rosa real es perfectamente simétrica
        var a = desfase + j * TAU / cp.n + (r() - 0.5) * (0.12 + ci * 0.04);
        var dir = a + cp.giro + (r() - 0.5) * (0.08 + ci * 0.03);
        var rr = cp.r * (0.9 + r() * 0.2);
        petalos.push(Object.assign({
          tipo: 'p', capa: ci,
          x: Math.cos(a) * rr, y: Math.sin(a) * rr,
          ang: dir + Math.PI / 2,
          escala: 0.9 + r() * 0.16,
          orden: orden++
        }, vueloAleatorio(r)));
      }
    });

    // Hojas: llegan al final y quedan debajo de la flor
    var nh = movil ? 4 : 5, hr = movil ? HOJAS.r * 0.88 : HOJAS.r;
    for (var h = 0; h < nh; h++) {
      var ah = 0.5 + h * TAU / nh + (r() - 0.5) * 0.25;
      petalos.push(Object.assign({
        tipo: 'h', capa: -1,
        x: Math.cos(ah) * hr, y: Math.sin(ah) * hr,
        ang: ah + Math.PI / 2,
        escala: 0.9 + r() * 0.15,
        orden: orden++
      }, vueloAleatorio(r)));
    }

    // Cronología: de 1,1 s a ~8 s, un pétalo tras otro
    var N = petalos.length, paso = 5.0 / (N - 1);
    petalos.forEach(function (p) { p.inicio = 1.1 + p.orden * paso; p.dur = 1.7; });
    this.tFin = 1.1 + (N - 1) * paso + 1.7 + 0.25;

    // Orden de dibujo: hojas → capas exteriores → centro
    this.petalos = petalos;
    this.ordenDibujo = petalos.slice().sort(function (a, b) {
      var ka = a.capa === -1 ? 100 : a.capa, kb = b.capa === -1 ? 100 : b.capa;
      return kb - ka;
    });

    // Ambiente: pétalos lejanos, polvo dorado y pétalos desenfocados delante
    this.fondo = [];
    for (var f = 0; f < (movil ? 6 : 14); f++) {
      this.fondo.push({
        x: r(), y: r(), vx: (r() - 0.5) * 0.015, vy: 0.01 + r() * 0.02,
        s: 0.22 + r() * 0.25, a: 0.12 + r() * 0.2, rot: r() * TAU, vrot: (r() - 0.5) * 0.8,
        flip: r() * TAU, vflip: 1 + r() * 1.5, capa: 3 + Math.floor(r() * 3)
      });
    }
    this.chispas = [];
    for (var s = 0; s < (movil ? 18 : 44); s++) {
      this.chispas.push(s % 2 ? {
        orbita: true, th: r() * TAU, rho: 1.15 + r() * 0.9, w: (r() - 0.5) * 0.12,
        ph: r() * TAU, f: 0.8 + r() * 1.8, tam: 1 + r() * 2.2
      } : {
        orbita: false, x: r(), y: r(), vy: -(0.006 + r() * 0.016),
        ph: r() * TAU, f: 0.6 + r() * 1.6, tam: 0.8 + r() * 2
      });
    }
    this.bokeh = [];
    if (!movil) {
      for (var b = 0; b < 3; b++) {
        this.bokeh.push({ x: r(), y: r(), vx: 0.004 + r() * 0.006, vy: 0.006 + r() * 0.008, s: 1.3 + r() * 0.6, rot: r() * TAU, vrot: (r() - 0.5) * 0.3 });
      }
    }
  };

  Escena.prototype.redimensionar = function () {
    var W = this.opc.ancho || this.canvas.clientWidth || 300;
    var H = this.opc.alto || this.canvas.clientHeight || 300;
    var dpr = Math.min(global.devicePixelRatio || 1, this.opc.movil ? 1.5 : 2);
    if (this.opc.dpr) dpr = this.opc.dpr;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.W = W; this.H = H; this.dpr = dpr;

    if (this.opc.estatico) {
      this.R = Math.min(W, H) * (this.opc.tamano || 0.92) / 2.6;
      this.cx = W * (this.opc.centroX || 0.5);
      this.cy = H * (this.opc.centroY || 0.5);
    } else {
      var diam = Math.min(W * 0.84, H * 0.5);
      this.R = diam / 2.6;
      this.cx = W / 2;
      this.cy = Math.max(H * (W < 700 ? 0.37 : 0.39), this.opc.margenSuperior + 1.3 * this.R);
    }
    /* Borde inferior de la rosa: lo usa el sitio para ubicar el título */
    this.fondoRosa = this.cy + 1.28 * this.R;
    this.crearSprites();
    if (!this.corriendo) this.dibujar(this.t);
  };

  Escena.prototype.crearSprites = function () {
    var k = this.R * this.dpr;
    var pal = PALETAS[this.opc.paleta] || PALETAS.rojo;
    var conReverso = !this.opc.estatico && !this.opc.reducido;
    this.sprites = this.capas.map(function (cp) {
      var frente = spritePetalo(cp.L * k, cp.w * k, coloresCapa(pal, cp.tono, false), false);
      return { frente: frente, reverso: conReverso ? spritePetalo(cp.L * k, cp.w * k, coloresCapa(pal, cp.tono, true), true) : frente };
    });
    var hf = spriteHoja(HOJAS.L * k, HOJAS.w * k, false);
    this.spriteHoja = { frente: hf, reverso: conReverso ? spriteHoja(HOJAS.L * k, HOJAS.w * k, true) : hf };
    this.spriteBrillo = spriteResplandor(pal, 256);
    this.spriteChispa = spriteChispa(32);
    this.spriteBokeh = this.bokeh.length ? desenfocar(this.sprites[Math.min(5, this.sprites.length - 1)].frente, 7 * this.dpr) : null;
  };

  Escena.prototype.cambiarPaleta = function (id) {
    if (!PALETAS[id]) return;
    this.opc.paleta = id;
    this.crearSprites();
    if (!this.corriendo) this.dibujar(this.t);
  };

  /* Dibuja un sprite con posición, rotación y escala (x,y en px CSS) */
  Escena.prototype.pintar = function (sp, x, y, ang, sx, sy, alfa) {
    var ctx = this.ctx, d = this.dpr, c = Math.cos(ang), s = Math.sin(ang);
    ctx.globalAlpha = alfa;
    ctx.setTransform(c * sx, s * sx, -s * sy, c * sy, x * d, y * d);
    ctx.drawImage(sp.c, -sp.ax, -sp.ay);
  };

  /* Estado de un pétalo de la rosa en el instante t */
  Escena.prototype.estadoPetalo = function (p, t, cx, cy, resp) {
    var R = this.R, W = this.W, H = this.H;
    var tx = cx + p.x * R * resp, ty = cy + p.y * R * resp;
    var quieto = this.opc.estatico || this.opc.reducido;
    var k = quieto ? 1 : limitar((t - p.inicio) / p.dur, 0, 1);
    var o = this._estado || (this._estado = {});

    if (k >= 1) {
      var vaiven = quieto ? 0 : 0.014 * Math.sin(t * 0.8 + p.orden) * this.ampResp;
      var s = p.escala * resp;
      var asiento = (t - p.inicio - p.dur) / 0.5;
      if (!quieto && asiento < 1) s *= 1 + 0.05 * Math.sin(asiento * Math.PI) * (1 - asiento);
      o.x = tx; o.y = ty; o.ang = p.ang + vaiven; o.sx = s; o.sy = s; o.a = 1; o.rev = false; o.k = 1;
      return o;
    }

    var e = entradaSalida(k);
    // Posición en vuelo libre (flota y cae suavemente)
    var lx = (p.fx + p.vx * t + p.amp * Math.sin(p.frec * t + p.fase)) * W + this.puntero.ox * 0.4;
    var ly = (p.fy + p.vy * t + p.amp * 0.7 * Math.cos(p.frec * 0.8 * t + p.fase)) * H + this.puntero.oy * 0.4;
    var x = lx, y = ly;
    if (e > 0) {
      // Curva de Bézier con desvío perpendicular: el pétalo entra en espiral
      var mx = (lx + tx) / 2, my = (ly + ty) / 2, dx = tx - lx, dy = ty - ly;
      var qx = mx - dy * 0.38, qy = my + dx * 0.38, u = 1 - e;
      x = u * u * lx + 2 * u * e * qx + e * e * tx;
      y = u * u * ly + 2 * u * e * qy + e * e * ty;
    }
    var aLibre = p.rot0 + p.vrot * t;
    if (p.angDestino === undefined) {
      p.angDestino = p.ang + TAU * Math.round((p.rot0 + p.vrot * p.inicio - p.ang) / TAU);
      p.flipDestino = TAU * Math.round((p.flip0 + p.vflip * p.inicio) / TAU);
    }
    var fLibre = p.flip0 + p.vflip * t;
    var giro3d = interpolar(fLibre, p.flipDestino, e);
    var cg = Math.cos(giro3d);
    var sx = Math.abs(cg) < 0.06 ? (cg < 0 ? -0.06 : 0.06) : cg;
    var syLibre = 0.82 + 0.18 * Math.abs(Math.sin(fLibre * 0.5 + p.fase));
    var esc = interpolar(p.sLibre * p.escala, p.escala, e);

    o.x = x; o.y = y;
    o.ang = interpolar(aLibre, p.angDestino, e);
    o.sx = sx * esc; o.sy = interpolar(syLibre, 1, e) * esc;
    o.a = interpolar(0.92, 1, e) * suavizar(limitar((t - p.aparece) / 0.9, 0, 1));
    o.rev = cg < 0; o.k = k;
    return o;
  };

  Escena.prototype.dibujar = function (t) {
    var ctx = this.ctx, W = this.W, H = this.H, R = this.R, d = this.dpr;
    var quieto = this.opc.estatico || this.opc.reducido;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var cx = this.cx + this.puntero.ox * 0.6, cy = this.cy + this.puntero.oy * 0.6;
    var i, p, sp, f;

    // 1) Pétalos lejanos de fondo
    if (!quieto) {
      var aparecerFondo = suavizar(limitar(t / 1.5, 0, 1));
      for (i = 0; i < this.fondo.length; i++) {
        f = this.fondo[i];
        var fx = modulo(f.x + f.vx * t + 0.05, 1.1) - 0.05;
        var fy = modulo(f.y + f.vy * t + 0.05, 1.1) - 0.05;
        var fc = Math.cos(f.flip + f.vflip * t);
        sp = this.sprites[Math.min(f.capa, this.sprites.length - 1)];
        this.pintar(fc < 0 ? sp.reverso : sp.frente, fx * W - this.puntero.ox * 0.3, fy * H - this.puntero.oy * 0.3,
          f.rot + f.vrot * t, f.s * (Math.abs(fc) < 0.08 ? 0.08 : fc), f.s, f.a * aparecerFondo);
      }
    }

    // 2) Resplandor detrás de la rosa
    var gBrillo = quieto ? 1 : suavizar(limitar((t - 4.2) / 4.5, 0, 1));
    if (this.opc.brillo) {
      var tamB = R * 4.6 * (1 + 0.03 * Math.sin(t * 1.1));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = (0.15 + 0.85 * gBrillo) * (0.85 + 0.15 * Math.sin(t * 1.1));
      ctx.drawImage(this.spriteBrillo, (cx - tamB / 2) * d, (cy - tamB / 2) * d, tamB * d, tamB * d);
    }

    // 3) La rosa: respiración suave una vez armada
    this.ampResp = quieto ? 0 : suavizar(limitar((t - this.tFin + 0.6) / 1.8, 0, 1));
    var resp = 1 + 0.016 * this.ampResp * Math.sin(t * 1.15);
    var delante = [];
    for (i = 0; i < this.ordenDibujo.length; i++) {
      p = this.ordenDibujo[i];
      var e = this.estadoPetalo(p, t, cx, cy, resp);
      if (e.k < 0.6) { delante.push(p); continue; }
      sp = p.tipo === 'h' ? this.spriteHoja : this.sprites[p.capa];
      this.pintar(e.rev ? sp.reverso : sp.frente, e.x, e.y, e.ang, e.sx, e.sy, e.a);
    }
    // Pétalos aún en vuelo: delante de todo
    for (i = 0; i < delante.length; i++) {
      p = delante[i];
      var ev = this.estadoPetalo(p, t, cx, cy, resp);
      sp = p.tipo === 'h' ? this.spriteHoja : this.sprites[p.capa];
      this.pintar(ev.rev ? sp.reverso : sp.frente, ev.x, ev.y, ev.ang, ev.sx, ev.sy, ev.a);
    }

    // 4) Pétalos que caen de vez en cuando (bucle)
    for (i = 0; i < this.caen.length; i++) {
      var c = this.caen[i];
      var cg = Math.cos(c.flip + c.vflip * t);
      sp = this.sprites[Math.min(c.capa, this.sprites.length - 1)];
      this.pintar(cg < 0 ? sp.reverso : sp.frente,
        c.x * W + Math.sin(t * c.f + c.ph) * c.amp * W, c.y * H,
        c.rot + c.vrot * t, c.s * (Math.abs(cg) < 0.06 ? 0.06 : cg), c.s * 0.92, c.a * c.alfa);
    }

    // 5) Pétalos desenfocados en primer plano (profundidad de campo)
    if (!quieto && this.spriteBokeh) {
      var aB = 0.13 * suavizar(limitar(t / 3, 0, 1));
      for (i = 0; i < this.bokeh.length; i++) {
        var b = this.bokeh[i];
        var bx = modulo(b.x + b.vx * t + 0.2, 1.4) - 0.2, by = modulo(b.y + b.vy * t + 0.2, 1.4) - 0.2;
        this.pintar(this.spriteBokeh, bx * W - this.puntero.ox * 1.2, by * H - this.puntero.oy * 1.2, b.rot + b.vrot * t, b.s, b.s, aB);
      }
    }

    // 6) Polvo dorado
    if (this.opc.chispas) {
      ctx.globalCompositeOperation = 'lighter';
      var aparecer = quieto ? 1 : suavizar(limitar((t - 0.5) / 2, 0, 1));
      for (i = 0; i < this.chispas.length; i++) {
        var ch = this.chispas[i], x, y, al;
        var titileo = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(ch.f * t + ch.ph));
        if (ch.orbita) {
          if (this.opc.estatico && !this.opc.chispasOrbita) continue;
          var th = ch.th + ch.w * t;
          x = cx + Math.cos(th) * ch.rho * R;
          y = cy + Math.sin(th) * ch.rho * R * 0.9 + Math.sin(t * 0.5 + ch.ph) * 6;
          al = titileo * gBrillo * 0.9;
        } else {
          if (this.opc.estatico) continue;
          x = ch.x * W - this.puntero.ox * 0.2;
          y = modulo(ch.y + ch.vy * t, 1) * H;
          al = titileo * aparecer * 0.6;
        }
        var tam = ch.tam * 4;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = al;
        ctx.drawImage(this.spriteChispa, (x - tam / 2) * d, (y - tam / 2) * d, tam * d, tam * d);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  Escena.prototype.actualizar = function (dt) {
    // Paralaje suave hacia el puntero
    var pt = this.puntero;
    pt.ox += (pt.x * 14 - pt.ox) * Math.min(1, dt * 3);
    pt.oy += (pt.y * 10 - pt.oy) * Math.min(1, dt * 3);

    if (!this.armada && this.t >= this.tFin) {
      this.armada = true;
      this.proxCaida = this.t + 1.5;
      if (typeof this.opc.alArmar === 'function') this.opc.alArmar();
    }

    // Pétalos ocasionales que caen (máx. 3 a la vez)
    if (this.armada) {
      if (this.t > this.proxCaida && this.caen.length < 3) {
        var m = Math.random;
        this.caen.push({
          x: 0.08 + m() * 0.84, y: -0.08, vy: 0.05 + m() * 0.05,
          amp: 0.02 + m() * 0.03, f: 0.6 + m() * 0.8, ph: m() * TAU,
          rot: m() * TAU, vrot: (m() - 0.5) * 1.4, flip: m() * TAU, vflip: 1.4 + m() * 2,
          s: 0.42 + m() * 0.22, capa: 4 + Math.floor(m() * 2), a: 0.9, alfa: 0
        });
        this.proxCaida = this.t + 2.6 + m() * 3.2;
      }
      for (var i = this.caen.length - 1; i >= 0; i--) {
        var c = this.caen[i];
        c.y += c.vy * dt;
        c.alfa = Math.min(1, c.alfa + dt * 1.5);
        if (c.y > 1.12) this.caen.splice(i, 1);
      }
    }
  };

  Escena.prototype.bucle = function (ahora) {
    if (!this.corriendo) return;
    var dt = this.ultimo ? Math.min(0.05, (ahora - this.ultimo) / 1000) : 0.016;
    this.ultimo = ahora;
    this.t += dt;
    this.actualizar(dt);
    this.dibujar(this.t);
    this.raf = requestAnimationFrame(this.bucle);
  };

  Escena.prototype.iniciar = function () {
    if (this.opc.reducido || this.opc.estatico) {
      // Sin movimiento: mostrar la rosa ya armada
      this.t = this.tFin + 5;
      this.armada = true;
      this.dibujar(this.t);
      if (typeof this.opc.alArmar === 'function') this.opc.alArmar();
      return;
    }
    this.reanudar();
  };
  Escena.prototype.reanudar = function () {
    if (this.corriendo || this.opc.reducido || this.opc.estatico) return;
    this.corriendo = true;
    this.ultimo = 0;
    this.raf = requestAnimationFrame(this.bucle);
  };
  Escena.prototype.pausar = function () {
    this.corriendo = false;
    cancelAnimationFrame(this.raf);
  };
  Escena.prototype.alternar = function () {
    if (this.corriendo) this.pausar(); else this.reanudar();
    return this.corriendo;
  };
  /* nx, ny entre -1 y 1 (posición relativa del puntero) */
  Escena.prototype.moverPuntero = function (nx, ny) {
    this.puntero.x = limitar(nx, -1, 1);
    this.puntero.y = limitar(ny, -1, 1);
  };

  /* ============================ API pública ============================ */
  global.RosaEterna = {
    PALETAS: PALETAS,
    crearEscena: function (canvas, opc) { return new Escena(canvas, opc); },
    dibujarEstatica: function (canvas, opc) {
      var e = new Escena(canvas, Object.assign({ estatico: true }, opc || {}));
      e.iniciar();
      return e;
    }
  };
})(window);
