/* ============================================================
   Recordatorio — todo estático, sin backend.
   ============================================================ */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const pad = (n) => String(n).padStart(2, "0");

  // Instantes fijos con offset explícito: no dependen de la zona del dispositivo.
  const PREVIA_AT = new Date("2026-10-10T23:00:00-03:00").getTime();
  const AR_OFFSET = -3 * 3600e3;

  const PREVIA = {
    titulo: "Previa — Fran cumple 25",
    nombre: "Previa",
    direccion: "Av. Directorio 252, CABA",
    inicio: "20261011T020000Z", // 23:00 -03 del 10/10
    fin: "20261011T050000Z",
  };
  const MATA = {
    titulo: "Mata Club — Fran cumple 25",
    nombre: "Mata Club",
    direccion: "Av. Rivadavia 13636, Ramos Mejía",
    inicio: "20261011T050000Z", // 02:00 -03 del 11/10
    fin: "20261011T100000Z",
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

  /* ---------- saludo según la fecha en Argentina ---------- */
  function saludo(nombre) {
    const ar = new Date(Date.now() + AR_OFFSET); // leer con getUTC* = hora argentina
    const y = ar.getUTCFullYear(), mo = ar.getUTCMonth() + 1, d = ar.getUTCDate(), h = ar.getUTCHours();
    const key = y * 10000 + mo * 100 + d;
    let frase;
    if (key < 20261009) frase = "el sábado es el día";
    else if (key === 20261009) frase = "mañana es el día";
    else if (key === 20261010 || (key === 20261011 && h < 8)) frase = "hoy es el día";
    else frase = "gracias por venir";
    if (!nombre) return frase.charAt(0).toUpperCase() + frase.slice(1) + ".";
    return nombre + ", " + frase + ".";
  }

  $("#greeting").textContent = saludo(leerNombre());

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

  const gcal = (ev) => "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(ev.titulo) +
    "&dates=" + ev.inicio + "/" + ev.fin +
    "&location=" + encodeURIComponent(ev.direccion) +
    "&details=" + encodeURIComponent("Llevá DNI y la captura de tu entrada.");
  document.querySelectorAll("[data-gcal]").forEach((a) => {
    a.href = gcal(a.dataset.gcal === "mata" ? MATA : PREVIA);
  });

  /* ---------- menús desplegables (Uber y calendario) ---------- */
  const menus = [];
  function menu(btn, panel) {
    const set = (abierto) => {
      panel.hidden = !abierto;
      btn.setAttribute("aria-expanded", String(abierto));
    };
    btn.addEventListener("click", () => {
      const abrir = panel.hidden;
      menus.forEach((m) => m(false));
      set(abrir);
    });
    menus.push(set);
  }
  menu($("#btn-uber"), $("#uber-opts"));
  menu($("#btn-cal"), $("#cal-opts"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") menus.forEach((m) => m(false));
  });

  /* ---------- calendario según plataforma ---------- */
  // iOS: un toque al .ics estático abre la hoja nativa "Agregar a Calendario".
  // Android y desktop: menú, así nunca se descarga nada sin elegirlo.
  const ua = navigator.userAgent;
  const esIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  document.documentElement.dataset.plataforma = esIOS ? "ios" : /Android/.test(ua) ? "android" : "desktop";
  if (esIOS) {
    $("#btn-cal").hidden = true;
    $("#cal-opts").hidden = true;
    $("#cal-ios").hidden = false;
    $("#cal-ios-alt").hidden = false;
  }
})();
