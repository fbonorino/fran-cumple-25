/* ============================================================
   TODO lo editable de la invitación vive acá.
   ============================================================ */
window.CONFIG = {
  nombre: "Fran",

  // Fecha y hora de la previa (formato ISO, -03:00 = hora Argentina fija)
  fecha: "2026-10-10T23:00:00-03:00",
  // El mismo dato pero como lo leería un humano
  fechaTexto: "Sábado 10 de octubre · previa desde las 23 hs",
  // Versión corta, solo para el hero (sin el horario de la previa)
  fechaTextoHero: "Sábado 10 de octubre",

  previa: {
    nombre: "Directorio 252",
    direccion: "Av. Directorio 252, CABA",
    cita: "23 hs",
    maps: "https://maps.app.goo.gl/8FoSRDUvmZ41PZij6",
  },

  after: {
    nombre: "Mata Club",
    direccion: "Av. Rivadavia 13636, Ramos Mejía",
    hora: "2:30 AM",
    instagram: "https://www.instagram.com/mata_club/",
  },

  // Precio por género. Cada invitado ve SOLO el suyo, recién al elegir género en el paso 2 del RSVP.
  precios: {
    hombre: 80000,
    mujer: 30000,
  },

  pago: {
    alias: "franbonorino",
    titular: "Franco Bonorino",
  },

  // Opcional: tu WhatsApp con código de país, sin + ni espacios (ej: "5491122334455").
  // Si el envío falla, le ofrece al invitado avisarte por ahí.
  whatsapp: "",

  // URL del Web App de Google Apps Script (ver README, paso 2).
  // Si se deja vacío el formulario funciona en MODO DEMO (no guarda nada).
  scriptUrl: "https://script.google.com/macros/s/AKfycbyD8O7Se89MZn98D8UXrU01tE86Rt9sKk6t7Jr9eMbDDCJp8ix4KwtZmSXQuANY6LQR/exec",

  // Tus fotos: están en /img/fotos. El chiste es uno solo, repetido: siempre
  // tomó. No hay cronología marcada — sticker = el año de la foto nomás.
  // ancho: true = foto apaisada (4:3) en vez de vertical (3:4)
  // sello: texto de un sello tipo "peritaje" sobre la foto (opcional, vacío/omitido = no se muestra)
  fotos: [
    { src: "img/fotos/01.webp", sticker: "2003", ancho: true, sello: "CONTENIDO NO ALTERADO",
      alt: "Bebé con una botella de cerveza en la mano",
      texto: "Todavía no caminaba y ya elegía marca." },
    { src: "img/fotos/02.webp", sticker: "2003", ancho: false, sello: "CONTENIDO NO ALTERADO",
      alt: "Bebé parado tomando de una mamadera",
      texto: "Mamadera con espuma." },
    { src: "img/fotos/03.webp", sticker: "2026", ancho: false,
      alt: "Joven tomando agua de una botella",
      texto: "Siempre cuidando la hidratación." },
    { src: "img/fotos/04.webp", sticker: "2026", ancho: false,
      alt: "Joven con una cerveza en la mano",
      texto: "Ahora sí sabe leer la etiqueta." },
  ],

  // Intentos del botón "No" antes de rendirse (el último texto es cuando se rinde).
  noIntentos: ["No", "¿Seguro?", "Pensalo de nuevo", "Hay previa y después Mata Club", "Última oportunidad"],

  // Frases de las cintas marquee (sin precios).
  cintas: [
    "ganas de tomar", "previa 23 hs", "Mata Club 2:30 AM", "cuarto de siglo",
    "Directorio 252", "vení con ganas, no con excusas", "el 25 se banca en grupo",
  ],

  // Frases cuando las velitas se vuelven a prender solas.
  velasBurlas: [
    "Son velitas con personalidad propia.",
    "Un cuarto de siglo no se apaga tan fácil.",
    "Esa se prendió sola. No mires así.",
    "Dale, con más convicción.",
    "Esto va para largo.",
  ],
};
