/* ==========================================================================
   CONFIGURACIÓN DEL NEGOCIO — Rosas Para Toda la Vida
   --------------------------------------------------------------------------
   Este es el ÚNICO archivo que necesitas editar para cambiar precios,
   productos, zonas de envío, WhatsApp o redes sociales. Todo el sitio
   (catálogo, tabla de precios, configurador, carrito y pie de página)
   lee sus datos desde aquí.
   ========================================================================== */
window.RPTV_CONFIG = {
  marca: 'Rosas Para Toda la Vida',
  eslogan: 'Un amor que no se marchita',

  /* WhatsApp sin "+" ni espacios (formato internacional para wa.me) */
  whatsapp: '593987219584',
  whatsappVisible: '+593 98 721 9584',

  /* [PENDIENTE] Escribe aquí el correo del negocio. Si queda vacío,
     el sitio solo muestra WhatsApp como medio de contacto. */
  correo: '',

  ciudad: 'Quito, Ecuador',

  /* Formulario de contacto: en *.netlify.app se guarda automáticamente en
     Netlify Forms. Si usas Netlify con dominio propio, cambia a true.
     En otros hostings (GitHub Pages) el mensaje se envía por WhatsApp. */
  formularioNetlify: false,
  responsable: 'Jonathan Andrés Paucar Benavides',
  identificacion: '1753936192',

  /* [PENDIENTE] Pega la URL completa de cada red. Las que queden vacías
     no se muestran en el sitio. Ej: 'https://instagram.com/tu_usuario' */
  redes: {
    instagram: '',
    tiktok: '',
    facebook: ''
  },

  moneda: 'USD',
  vigenciaPrecios: 'Precios vigentes del 10 de noviembre de 2026 al 28 de febrero de 2027.',

  /* ------------------------------------------------------------------------
     CATÁLOGO
     categoria: 'rosas' | 'cartas' | 'chocolates' | 'presentaciones'
     foto: ruta de la imagen. respaldo: imagen que se usa si la foto no existe.
     ilustrativa: true = se muestra la etiqueta "Imagen ilustrativa".
     ------------------------------------------------------------------------ */
  productos: [
    {
      id: 'ramo-satin',
      nombre: 'Ramo de rosas eternas de satín',
      categoria: 'rosas',
      precio: 1.50,
      desde: true,              // muestra "desde $1.50"
      accion: 'personalizar',   // el botón lleva al configurador
      descripcion: 'Rosas hechas a mano con cinta de satín, pétalo por pétalo, con decoración incluida. Tú eliges el color y cuántas rosas quieres: desde 1 rosa hasta un ramo de 10 por solo $7.00.',
      alt: 'Ramo de 10 rosas de satín amarillo dorado envuelto en papel decorativo con una mariposa dorada',
      nota: 'Foto real de nuestra creación: un ramo de 10 rosas de satín. Cada pedido es único y lo hacemos a tu medida.',
      foto: 'fotos/rosa-eterna-1.jpg',
      respaldo: 'fotos/ilustraciones/rosa.jpg',
      ilustrativa: false,
      etiqueta: 'Nuestra creación',
      destacado: true
    },
    {
      id: 'carta-impresa',
      nombre: 'Carta de amor impresa',
      categoria: 'cartas',
      precio: 1.50,
      descripcion: 'Papel perlado, tipografía caligráfica y sobre con sello de cera. Tú escribes el mensaje, nosotros lo hacemos bonito.',
      foto: 'fotos/ilustraciones/carta.svg',
      ilustrativa: true
    },
    {
      id: 'carta-manuscrita',
      nombre: 'Carta escrita a mano',
      categoria: 'cartas',
      precio: 3.00,
      descripcion: 'Escrita a mano con pluma sobre papel de algodón, hasta 150 palabras, con sello de cera dorado.',
      foto: 'fotos/ilustraciones/carta.svg',
      ilustrativa: true
    },
    {
      id: 'ferrero-3',
      nombre: 'Ferrero Rocher × 3',
      categoria: 'chocolates',
      precio: 3.50,
      descripcion: 'Tres bombones Ferrero Rocher acomodados junto a tu rosa.',
      foto: 'fotos/ilustraciones/bombones.svg',
      ilustrativa: true
    },
    {
      id: 'ferrero-8',
      nombre: 'Ferrero Rocher × 8',
      categoria: 'chocolates',
      precio: 8.00,
      descripcion: 'Ocho bombones Ferrero Rocher para un detalle más generoso.',
      foto: 'fotos/ilustraciones/bombones.svg',
      ilustrativa: true
    },
    {
      id: 'bombones-artesanales',
      nombre: 'Bombones artesanales × 6',
      categoria: 'chocolates',
      precio: 4.50,
      descripcion: 'Seis bombones rellenos hechos con cacao ecuatoriano, en cajita dorada.',
      foto: 'fotos/ilustraciones/bombones.svg',
      ilustrativa: true
    },
    {
      id: 'barra-cacao',
      nombre: 'Chocolate ecuatoriano 70 %',
      categoria: 'chocolates',
      precio: 3.00,
      descripcion: 'Barra de 50 g de cacao fino de aroma del Ecuador, envuelta para regalo.',
      foto: 'fotos/ilustraciones/barra.svg',
      ilustrativa: true
    },
    {
      id: 'caja-regalo',
      nombre: 'Caja de regalo premium',
      categoria: 'presentaciones',
      precio: 2.50,
      descripcion: 'Caja rígida con tapa, papel de seda y lazo de satín. Bajo pedido.',
      foto: 'fotos/ilustraciones/caja.svg',
      ilustrativa: true
    },
    {
      id: 'caja-acrilica',
      nombre: 'Caja acrílica transparente',
      categoria: 'presentaciones',
      precio: 6.00,
      descripcion: 'Exhibe tu rosa protegida del polvo, como una joya. Bajo pedido.',
      foto: 'fotos/ilustraciones/acrilica.svg',
      ilustrativa: true
    },
    {
      id: 'cupula',
      nombre: 'Cúpula de cristal con luz LED',
      categoria: 'presentaciones',
      precio: 10.00,
      descripcion: 'La presentación clásica: cúpula de cristal, base de madera y luces cálidas. Bajo pedido.',
      foto: 'fotos/ilustraciones/cupula.svg',
      ilustrativa: true
    }
  ],

  /* ------------------------------------------------------------------------
     CONFIGURADOR "Personaliza tu rosa"
     Los precios de presentación, carta y chocolates salen de los productos
     de arriba (por su id), así nunca quedan desactualizados.
     ------------------------------------------------------------------------ */
  configurador: {
    /* Precio del ramo según el NÚMERO DE ROSAS (decoración incluida).
       Posición 1 = 1 rosa, posición 2 = 2 rosas… hasta 10 rosas.
       Mientras más rosas, más barata sale cada una. */
    preciosRamo: [1.50, 2.50, 3.25, 4.00, 4.50, 5.00, 5.50, 6.00, 6.50, 7.00],
    rosasPorDefecto: 10,
    colores: [
      { id: 'rojo',    nombre: 'Rojo pasión',     hex: '#9e1530', extra: 0 },
      { id: 'amarillo', nombre: 'Amarillo dorado', hex: '#f2a51e', extra: 0 },
      { id: 'rosa',    nombre: 'Rosa empolvado',  hex: '#e3a3b1', extra: 0 },
      { id: 'blanco',  nombre: 'Blanco marfil',   hex: '#f1e8da', extra: 0 },
      { id: 'lavanda', nombre: 'Lavanda',         hex: '#b79bd0', extra: 0 },
      { id: 'azul',    nombre: 'Azul real',       hex: '#2c4f9e', extra: 0 },
      { id: 'negro',   nombre: 'Negro elegante',  hex: '#2a1a20', extra: 0 }
    ],
    presentaciones: [
      { id: 'lazo', nombre: 'Ramo con papel decorativo y lazo', productoId: null, precio: 0, nota: 'Incluido' },
      { id: 'caja', nombre: 'Caja de regalo premium', productoId: 'caja-regalo' },
      { id: 'acrilica', nombre: 'Caja acrílica', productoId: 'caja-acrilica' },
      { id: 'cupula', nombre: 'Cúpula de cristal LED', productoId: 'cupula' }
    ],
    cartas: [
      { id: 'tarjeta', nombre: 'Tarjeta pequeña con tu mensaje', productoId: null, precio: 0, nota: 'Incluida' },
      { id: 'impresa', nombre: 'Carta de amor impresa', productoId: 'carta-impresa' },
      { id: 'manuscrita', nombre: 'Carta escrita a mano', productoId: 'carta-manuscrita' }
    ],
    chocolates: ['ferrero-3', 'ferrero-8', 'bombones-artesanales', 'barra-cacao'],
    maxMensaje: 180
  },

  /* ------------------------------------------------------------------------
     ENVÍOS — [PENDIENTE DE CONFIRMAR] costos y tiempos sugeridos.
     ------------------------------------------------------------------------ */
  tiempoElaboracion: '2 a 4 días hábiles (trabajamos bajo pedido)',
  envios: [
    { id: 'retiro', zona: 'Retiro en punto acordado (Quito)', detalle: 'Coordinamos lugar y hora por WhatsApp.', costo: 0, tiempo: 'Cuando tu pedido esté listo' },
    { id: 'quito', zona: 'Quito urbano', detalle: 'Norte, centro y sur de la ciudad.', costo: 3.00, tiempo: '24 a 48 h después de la elaboración' },
    { id: 'valles', zona: 'Valles', detalle: 'Cumbayá, Tumbaco, Los Chillos, Conocoto, Pomasqui.', costo: 5.00, tiempo: '24 a 48 h después de la elaboración' },
    { id: 'nacional', zona: 'Otras ciudades del Ecuador', detalle: 'Por courier (Servientrega u otro). Costo exacto según destino.', costo: 6.00, desde: true, tiempo: '1 a 3 días hábiles después del despacho' }
  ]
};
