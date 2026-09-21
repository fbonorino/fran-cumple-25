/* ============================================================
   TODO lo editable de la invitación vive acá.
   ============================================================ */
window.CONFIG = {
  nombre: "Fran",

  // Fecha de nacimiento (para el contador de "días en este mundo")
  nacimiento: "2001-10-06T00:00:00-03:00",

  // Fecha y hora de la previa (formato ISO, -03:00 = hora Argentina fija)
  fecha: "2026-10-10T23:00:00-03:00",
  // El mismo dato pero como lo leería un humano
  fechaTexto: "Sábado 10 de octubre · previa desde las 23 hs",

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
  scriptUrl: "",

  // Tus fotos: están en /img/fotos, listadas acá en orden cronológico.
  // edadNum = edad en años (puede ser fraccionaria) para el edadómetro.
  // edadLabel = lo que se ve en el sticker de la polaroid.
  // ancho: true = foto apaisada (4:3) en vez de vertical (3:4)
  fotos: [
    { src: "img/fotos/01.jpg", edadNum: 0.17, edadLabel: "2 MESES", ancho: true,
      texto: "Ya dependiendo 100% de otra persona. En eso no cambié tanto." },
    { src: "img/fotos/02.jpg", edadNum: 0.42, edadLabel: "5 MESES", ancho: true,
      texto: "Transporte con chofer, sin quejas del pasajero." },
    { src: "img/fotos/03.jpg", edadNum: 1, edadLabel: "1 AÑO",
      texto: "Primeros pasos y ya con un accesorio en la boca." },
    { src: "img/fotos/04.jpg", edadNum: 3, edadLabel: "3 AÑOS",
      texto: "Reunión con un desconocido de barba blanca para pedirle cosas gratis." },
    { src: "img/fotos/05.jpg", edadNum: 6, edadLabel: "6 AÑOS",
      texto: "Ascendido a hermano mayor sin que nadie me preguntara." },
    { src: "img/fotos/06.jpg", edadNum: 7, edadLabel: "7 AÑOS",
      texto: "La seguridad de alguien que todavía no sabía nada." },
    { src: "img/fotos/07.jpg", edadNum: 8, edadLabel: "8 AÑOS", ancho: true,
      texto: "El resto del expediente, entre esta foto y hoy, quedó clasificado." },
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
