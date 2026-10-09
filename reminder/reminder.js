/* ============================================================
   Recordatorio — todo estático, sin backend.
   ============================================================ */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const pad = (n) => String(n).padStart(2, "0");

  // Instantes fijos con offset explícito: no dependen de la zona del dispositivo.
  const PREVIA_AT = new Date("2026-10-10T23:00:00-03:00").getTime();

  const PREVIA = { nombre: "Previa", direccion: "Av. Directorio 252, CABA" };
  const MATA = { nombre: "Mata Club", direccion: "Av. Rivadavia 13636, Ramos Mejía" };

  // Un solo evento para toda la noche (mismos datos que fran-cumple-25.ics).
  const EVENTO = {
    titulo: "Fran cumple 25",
    inicio: "20261011T020000Z", // sáb 10/10 23:00 -03
    fin: "20261011T100000Z",    // dom 11/10 07:00 -03
    lugar: "Av. Directorio 252, CABA",
    detalle: [
      "Previa 23:00 — Av. Directorio 252, CABA",
      "1:30 salimos a Mata",
      "Mata Club 2:00 — Av. Rivadavia 13636, Ramos Mejía",
      "Mesas 15 y 16 (backstage)",
      "Llevá DNI.",
    ].join("\n"),
  };

  /* ---------- nombre desde ?n= ---------- */
  function leerNombre() {
    const m = /[?&]n=([^&#]*)/.exec(location.search);
    if (!m) return "";
    let raw = m[1].replace(/\+/g, " ");
    try { raw = decodeURIComponent(raw); } catch (e) { /* queda el valor crudo */ }
    const limpio = raw.replace(/\s+/g, " ").trim();
    const chars = Array.from(limpio).slice(0, 30);
    if (!chars.length) return "";
    chars[0] = chars[0].toLocaleUpperCase("es-AR");
    return chars.join("").trim();
  }

  /* ---------- saludo ---------- */
  const nombre = leerNombre();
  $("#greeting").textContent = nombre ? nombre + ", te esperamos." : "Te esperamos.";

  /* ---------- cuenta regresiva ---------- */
  const cd = $("#countdown");
  let timer = 0;
  function tick() {
    const left = PREVIA_AT - Date.now();
    if (left <= 0) {
      cd.classList.add("is-over");
      cd.textContent = "Empezó la previa";
      clearInterval(timer);
      return;
    }
    const s = Math.floor(left / 1000);
    $("#cd-d").textContent = pad(Math.floor(s / 86400));
    $("#cd-h").textContent = pad(Math.floor(s / 3600) % 24);
    $("#cd-m").textContent = pad(Math.floor(s / 60) % 60);
    $("#cd-s").textContent = pad(s % 60);
  }
  tick();
  timer = setInterval(tick, 1000);

  /* ---------- links ---------- */
  const maps = (dir) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(dir);
  $("#maps-previa").href = maps(PREVIA.direccion);
  $("#maps-mata").href = maps(MATA.direccion);

  // Universal link: con la app instalada abre Uber; sin la app, cae solo en la web de Uber.
  const uber = (ev) => "https://m.uber.com/ul/?action=setPickup&pickup=my_location" +
    "&dropoff[nickname]=" + encodeURIComponent(ev.nombre) +
    "&dropoff[formatted_address]=" + encodeURIComponent(ev.direccion);
  $("#uber-previa").href = uber(PREVIA);
  $("#uber-mata").href = uber(MATA);

  const gcal = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(EVENTO.titulo) +
    "&dates=" + EVENTO.inicio + "/" + EVENTO.fin +
    "&location=" + encodeURIComponent(EVENTO.lugar) +
    "&details=" + encodeURIComponent(EVENTO.detalle);

  /* ---------- menú de Uber ---------- */
  const btnUber = $("#btn-uber");
  const uberOpts = $("#uber-opts");
  const setUber = (abierto) => {
    uberOpts.hidden = !abierto;
    btnUber.setAttribute("aria-expanded", String(abierto));
  };
  btnUber.addEventListener("click", () => setUber(uberOpts.hidden));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setUber(false);
  });

  /* ---------- calendario según plataforma ---------- */
  // iOS: el .ics estático abre la hoja nativa "Agregar a Calendario".
  // Android y desktop: Google Calendar con el evento precargado; nunca se descarga nada.
  const ua = navigator.userAgent;
  const esIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  document.documentElement.dataset.plataforma = esIOS ? "ios" : /Android/.test(ua) ? "android" : "desktop";
  const btnCal = $("#btn-cal");
  if (esIOS) {
    btnCal.href = "/reminder/fran-cumple-25.ics";
    btnCal.removeAttribute("target");
    btnCal.removeAttribute("rel");
    $("#cal-ios-gcal").href = gcal;
    $("#cal-ios-alt").hidden = false;
  } else {
    btnCal.href = gcal;
  }
})();
