(() => {
  "use strict";

  const C = window.CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad = (n) => String(n).padStart(2, "0");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pesos = (n) => "$" + Math.round(n).toLocaleString("es-AR");
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ } },
  };

  /* ---------- volcar config en el HTML ---------- */
  const dig = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), C);
  $$("[data-cfg]").forEach((el) => { el.textContent = dig(el.dataset.cfg) ?? ""; });
  $$("[data-href]").forEach((el) => { el.href = dig(el.dataset.href) || "#"; });
  document.title = `${C.nombre} cumple 25`;

  // Nombre del hero letra por letra
  const heroName = $("#hero-name");
  const letters = [...C.nombre];
  heroName.style.setProperty("--n", letters.length);
  heroName.setAttribute("aria-label", C.nombre);
  heroName.innerHTML = letters
    .map((ch, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${ch === " " ? "&nbsp;" : ch}</span>`)
    .join("");

  // Cintas
  ["#tape-1", "#tape-2"].forEach((id, k) => {
    const words = k ? [...C.cintas].reverse() : C.cintas;
    const half = words.map((w) => `<span>${w} ★</span>`).join("").repeat(3);
    $(id).innerHTML = half + half;
  });

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg, ms = 2600) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }

  /* ---------- confetti casero ---------- */
  const confetti = (() => {
    const cv = $("#confetti");
    const ctx = cv.getContext("2d");
    const colors = ["#c8ff2e", "#ff3f8e", "#5b6bff", "#f5eeda", "#ffd23f"];
    let parts = [];
    let running = false;
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    addEventListener("resize", resize);
    resize();
    function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((p) => p.y < innerHeight + 40 && p.life > 0);
      for (const p of parts) {
        p.vy += 0.25; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 1);
        ctx.restore();
      }
      if (parts.length) requestAnimationFrame(tick);
      else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    }
    return function burst(n = 120, x = innerWidth / 2, y = innerHeight * 0.4) {
      if (reduceMotion) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 4 + Math.random() * 11;
        parts.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6,
          w: 6 + Math.random() * 8, h: 8 + Math.random() * 10,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
          c: colors[(Math.random() * colors.length) | 0], life: 160 + Math.random() * 80,
        });
      }
      if (!running) { running = true; requestAnimationFrame(tick); }
    };
  })();

  /* ---------- loader ---------- */
  (async function loader() {
    const el = $("#loader"), num = $("#loader-num"), fill = $("#loader-fill"), msg = $("#loader-msg");
    const msgs = [
      "Cargando un cuarto de siglo…",
      "Buscando los 20 en algún cajón…",
      "Convirtiendo un cumpleaños en excusa para juntarse…",
      "Última pasada de la escoba…",
    ];
    let skipped = false;
    const finish = () => {
      if (el.classList.contains("done")) return;
      el.classList.add("done");
      document.body.classList.remove("is-loading");
      setTimeout(() => el.remove(), 1200);
    };
    $("#loader-skip").addEventListener("click", () => { skipped = true; finish(); });

    // Segunda visita en la misma sesión (o reduce motion): sin show
    let seen = false;
    try { seen = sessionStorage.getItem("loader") === "1"; sessionStorage.setItem("loader", "1"); } catch { /* nada */ }
    if (seen || reduceMotion) return finish();

    const set = (p) => { num.textContent = p; fill.style.width = p + "%"; };
    // Basado en tiempo real: aunque el navegador frene los timers, tarda lo mismo
    const DUR = 2200, t0 = performance.now();
    for (let p = 0; p < 99 && !skipped; ) {
      p = Math.min(99, Math.round(((performance.now() - t0) / DUR) * 99));
      set(p);
      msg.textContent = msgs[Math.min(msgs.length - 1, (p / 25) | 0)];
      await wait(40);
    }
    if (skipped) return;
    set(99);
    msg.textContent = "99%. Esperá, que esto no es instantáneo.";
    await wait(1200);
    if (skipped) return;
    set(100);
    msg.textContent = "Listo. Costó, pero llegamos.";
    await wait(450);
    finish();
  })();

  /* ---------- cuenta regresiva + días vivo ---------- */
  const partyAt = new Date(C.fecha).getTime();
  const bornAt = new Date(C.nacimiento).getTime();
  function tickClock() {
    const left = partyAt - Date.now();
    const cd = $("#countdown");
    if (left <= 0) {
      if (!cd.classList.contains("is-over")) {
        cd.classList.add("is-over");
        cd.textContent = left > -12 * 3600e3 ? "¡Es HOY! ¿Qué hacés leyendo esto?" : "Ya fue. Llegaste tarde.";
      }
    } else {
      const s = Math.floor(left / 1000);
      $("#cd-d").textContent = pad(Math.floor(s / 86400));
      $("#cd-h").textContent = pad(Math.floor(s / 3600) % 24);
      $("#cd-m").textContent = pad(Math.floor(s / 60) % 60);
      $("#cd-s").textContent = pad(s % 60);
    }
    if (!Number.isNaN(bornAt)) {
      const dias = Math.floor((Date.now() - bornAt) / 86400e3);
      $("#vivo").textContent = `Lleva ${dias.toLocaleString("es-AR")} días en este mundo, y esto es lo que hay para mostrar.`;
    }
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- polaroids + edadómetro ---------- */
  const wrap = $("#polaroids");
  const emojis = ["👶", "🧒", "🧑", "🧑"];
  C.fotos.forEach((f, i) => {
    const fig = document.createElement("figure");
    fig.className = "polaroid reveal" + (f.ancho ? " is-wide" : "");
    fig.tabIndex = 0;
    fig.dataset.edad = f.edadNum;
    fig.style.setProperty("--r", `${(i % 2 ? 1 : -1) * (2 + ((i * 37) % 4))}deg`);

    const edadSticker = document.createElement("span");
    edadSticker.className = "polaroid-edad";
    edadSticker.textContent = f.edadLabel;

    const box = document.createElement("div");
    box.className = "polaroid-img";
    const img = new Image();
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = `${C.nombre} a los ${f.edadLabel.toLowerCase()}`;
    img.onerror = () => {
      box.innerHTML = `<div class="polaroid-ph"><div><span>${emojis[i % emojis.length]}</span>Acá va tu foto:<br><code></code></div></div>`;
      $("code", box).textContent = f.src;
    };
    img.src = f.src;
    box.append(img);

    const cap = document.createElement("figcaption");
    cap.textContent = f.texto;
    fig.append(edadSticker, box, cap);
    wrap.append(fig);
  });

  // Último polaroid: evidencia destruida (cubre de los 9 a los 24)
  (() => {
    const fig = document.createElement("figure");
    fig.className = "polaroid polaroid-censura reveal";
    fig.tabIndex = 0;
    fig.dataset.edad = 25;
    fig.style.setProperty("--r", `${(C.fotos.length % 2 ? 1 : -1) * 3}deg`);

    const edadSticker = document.createElement("span");
    edadSticker.className = "polaroid-edad";
    edadSticker.textContent = "25";

    const box = document.createElement("div");
    box.className = "polaroid-img";
    box.innerHTML = `<div class="censura-text">EVIDENCIA DESTRUIDA<br>POR SEGURIDAD<br><small>9 a 24 años · archivo dado de baja</small></div>`;

    const cap = document.createElement("figcaption");
    cap.textContent = "Mejor para todos.";
    fig.append(edadSticker, box, cap);
    wrap.append(fig);
  })();

  const maxEdad = 25;
  let edadShown = 0, edadAnim;
  function setEdad(target) {
    cancelAnimationFrame(edadAnim);
    $("#edad-fill").style.width = (target / maxEdad) * 100 + "%";
    const step = () => {
      if (edadShown === target) return;
      edadShown += Math.sign(target - edadShown);
      $("#edad-num").textContent = pad(edadShown);
      edadAnim = requestAnimationFrame(step);
    };
    step();
  }
  const edadIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setEdad(Math.round(+e.target.dataset.edad))),
    { rootMargin: "-45% 0px -45% 0px" }
  );
  $$(".polaroid").forEach((p) => edadIO.observe(p));

  /* ---------- reveal on scroll ---------- */
  // (el form de RSVP queda afuera a propósito: nunca debe depender de una animación para verse)
  $$(".section-head, .card, .cake").forEach((el) => el.classList.add("reveal"));
  const revealIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
    }),
    { threshold: 0.15 }
  );
  $$(".reveal").forEach((el) => revealIO.observe(el));

  /* ---------- parallax del sticker (solo mouse) ---------- */
  if (!reduceMotion && matchMedia("(pointer: fine)").matches) {
    const badge = $(".badge");
    $(".hero").addEventListener("pointermove", (e) => {
      const x = (e.clientX / innerWidth - 0.5) * 30;
      const y = (e.clientY / innerHeight - 0.5) * 30;
      badge.style.transform = `translate(${x}px, ${y}px) rotate(${12 + x / 3}deg)`;
    });
  }

  /* ---------- easter egg: el 25 ---------- */
  let taps = 0, tapTimer;
  $("#hero-25").addEventListener("click", (e) => {
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => (taps = 0), 1200);
    confetti(25, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2);
    if (taps === 5) {
      taps = 0;
      const on = document.documentElement.classList.toggle("modo-crisis");
      const badge = $("#egg-badge");
      badge.textContent = on ? "Logro desbloqueado: cuarto de siglo (no canjeable)" : "Modo cuarto de siglo: apagado";
      badge.classList.add("show");
      setTimeout(() => badge.classList.remove("show"), 3200);
      confetti(160);
    }
  });

  /* ---------- velitas mágicas (se vuelven a prender) ---------- */
  (() => {
    const N = 25, RELIGHT_BUDGET = 14;
    const box = $("#velas"), status = $("#velas-status"), resetBtn = $("#velas-reset"), cake = $("#cake");
    for (let i = 0; i < N; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "vela";
      b.style.setProperty("--i", i);
      b.setAttribute("aria-label", `Velita ${i + 1}`);
      b.append(document.createElement("i"));
      box.append(b);
    }
    const velas = $$(".vela", box);
    const burlas = C.velasBurlas;
    let relit = 0, timer = null, won = false, burla = 0;
    const out = () => velas.filter((v) => v.classList.contains("off"));

    function render(msg) {
      status.textContent = msg || `Apagadas: ${out().length}/${N}`;
    }
    function win() {
      won = true;
      clearInterval(timer); timer = null;
      render("Las 25 apagadas. Deseo pedido, no me hago cargo de si se cumple.");
      const r = cake.getBoundingClientRect();
      confetti(180, r.left + r.width / 2, r.top + r.height / 3);
      resetBtn.hidden = false;
    }
    function mischief() {
      const apagadas = out();
      if (won || !apagadas.length) return;
      if (relit >= RELIGHT_BUDGET) {
        clearInterval(timer); timer = null;
        render(`Ok, ok, se rinden. Apagadas: ${apagadas.length}/${N}`);
        return;
      }
      const k = Math.min(apagadas.length, 1 + ((Math.random() * 3) | 0), RELIGHT_BUDGET - relit);
      for (let j = 0; j < k; j++) {
        const v = apagadas.splice((Math.random() * apagadas.length) | 0, 1)[0];
        v.classList.remove("off");
        v.classList.add("relit");
        setTimeout(() => v.classList.remove("relit"), 500);
        relit++;
      }
      render(`${burlas[burla++ % burlas.length]} (${out().length}/${N})`);
    }
    function blow(v) {
      if (won || !v || v.classList.contains("off")) return;
      v.classList.add("off");
      if (out().length === N) return win();
      render();
      if (!timer && relit < RELIGHT_BUDGET) timer = setInterval(mischief, 850);
    }

    box.addEventListener("click", (e) => blow(e.target.closest(".vela")));
    // pasar el dedo (o el mouse apretado) por arriba también sopla
    cake.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse" && !e.buttons) return;
      blow(document.elementFromPoint(e.clientX, e.clientY)?.closest(".vela"));
    });
    resetBtn.addEventListener("click", () => {
      velas.forEach((v) => v.classList.remove("off"));
      relit = 0; won = false; burla = 0;
      resetBtn.hidden = true;
      render("Apagadas: 0/25. Sin trampa esta vez. (Mentira.)");
    });
  })();

  /* ---------- RSVP ---------- */
  const steps = $$(".step");
  function goto(name) {
    steps.forEach((s) => s.classList.toggle("is-active", s.dataset.step === name));
    const box = $(".rsvp-box");
    if (box.getBoundingClientRect().top < 0) box.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    const first = $(`.step[data-step="${name}"] input:not(.hp), .step[data-step="${name}"] select, .step[data-step="${name}"] textarea`);
    if (first && matchMedia("(pointer: fine)").matches) first.focus({ preventScroll: true });
  }
  $$("[data-goto]").forEach((b) => b.addEventListener("click", () => goto(b.dataset.goto)));
  $("#demo-flag").hidden = !!C.scriptUrl;

  // El botón "No" que se escapa
  const btnNo = $("#btn-no"), arena = $("#arena");
  const noTexts = C.noIntentos;
  let dodges = 0;
  const surrendered = () => dodges >= noTexts.length;
  function dodge() {
    dodges++;
    if (surrendered()) {
      btnNo.style.transform = "";
      btnNo.textContent = "Ok, no vas.";
      return;
    }
    btnNo.textContent = noTexts[dodges];
    // offsetLeft/Top ignoran el transform actual, así que sirven de posición base
    const tx = Math.random() * Math.max(0, arena.clientWidth - btnNo.offsetWidth) - btnNo.offsetLeft;
    const ty = Math.random() * Math.max(0, arena.clientHeight - btnNo.offsetHeight) - btnNo.offsetTop;
    btnNo.style.transform = `translate(${tx}px, ${ty}px) rotate(${(Math.random() - 0.5) * 24}deg)`;
  }
  btnNo.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && !surrendered()) dodge(); });
  btnNo.addEventListener("click", () => (surrendered() ? goto("no") : dodge()));
  $("#btn-si").addEventListener("click", (e) => { confetti(60, e.clientX, e.clientY); goto("datos"); });

  // Precio según género elegido, recién visible en el paso de pago
  const generoSelect = $('select[name="genero"]');
  function precioActual() {
    const g = generoSelect.value;
    return g === "hombre" ? C.precios.hombre : g === "mujer" ? C.precios.mujer : 0;
  }

  // Validación mínima
  function validate(form) {
    let ok = true;
    $$("[required]", form).forEach((f) => {
      const bad = f.type === "checkbox" ? !f.checked : !f.value.trim();
      const target = f.type === "checkbox" ? f.closest("label") : f;
      target.classList.remove("invalid");
      if (bad) { void target.offsetWidth; target.classList.add("invalid"); if (ok) f.focus(); ok = false; }
    });
    return ok;
  }
  document.addEventListener("input", (e) => e.target.classList?.remove("invalid"));
  document.addEventListener("change", (e) => e.target.classList?.remove("invalid"));

  async function enviar(payload) {
    if (!C.scriptUrl) { // modo demo
      console.info("[MODO DEMO] Se habría enviado:", payload);
      return wait(800);
    }
    // text/plain evita el preflight de CORS, que Apps Script no soporta
    const res = await fetch(C.scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error || "Error desconocido");
  }

  function showError(el, payload) {
    el.hidden = false;
    el.textContent = "Uh, falló el envío. Probá de nuevo";
    if (C.whatsapp) {
      const txt = encodeURIComponent(`Hola! Confirmo para el cumple: ${payload.nombre} (${payload.asiste === "SI" ? "voy" : "no puedo ir"})`);
      el.innerHTML = `${el.textContent} o <a href="https://wa.me/${C.whatsapp}?text=${txt}" target="_blank" rel="noopener">avisale por WhatsApp</a>.`;
    } else el.textContent += " en un ratito.";
  }

  async function submit(form, btn, errEl, payload, onOk) {
    if (!validate(form)) return;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Enviando…";
    errEl.hidden = true;
    try {
      await enviar(payload);
      onOk();
    } catch (err) {
      console.error(err);
      showError(errEl, payload);
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  function showTicket(nombre, num) {
    $("#ticket-name").textContent = nombre;
    $("#ticket-num").textContent = num;
    goto("ok");
  }

  const fDatos = $("#form-datos"), fPago = $("#form-pago"), fNo = $("#form-no");
  fDatos.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate(fDatos)) return;
    $("#pago-precio").textContent = pesos(precioActual());
    goto("pago");
  });

  fPago.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(fDatos), p = new FormData(fPago);
    const genero = d.get("genero");
    const payload = {
      asiste: "SI",
      genero,
      nombre: d.get("nombre").trim(),
      mensaje: d.get("mensaje").trim(),
      montoEsperado: genero === "hombre" ? C.precios.hombre : C.precios.mujer,
      titular: p.get("titular").trim(),
      transfirio: p.get("transfirio") ? "SI" : "NO",
      website: d.get("website"),
    };
    submit(fPago, $("#btn-confirmar"), $("#pago-error"), payload, () => {
      const num = "N° 0025-" + pad(((Math.random() * 99) | 0) + 1) + pad((Math.random() * 100) | 0);
      store.set("rsvp", { nombre: payload.nombre, num });
      showTicket(payload.nombre, num);
      confetti(220);
      setTimeout(() => confetti(140, innerWidth * 0.2, innerHeight * 0.5), 350);
      setTimeout(() => confetti(140, innerWidth * 0.8, innerHeight * 0.5), 650);
    });
  });

  fNo.addEventListener("submit", (e) => {
    e.preventDefault();
    const n = new FormData(fNo);
    const payload = { asiste: "NO", nombre: n.get("nombre").trim(), excusa: n.get("excusa").trim(), website: n.get("website") };
    submit(fNo, $("#btn-no-enviar"), $("#no-error"), payload, () => goto("ok-no"));
  });

  // Chistes escondidos del form
  fPago.elements.transfirio.addEventListener("change", (e) => {
    if (e.target.checked) toast("Fran ya está mirando el home banking.", 3200);
  });
  fDatos.elements.nombre.addEventListener("blur", (e) => {
    const n = e.target.value.trim().toLowerCase();
    if (n && n.split(/\s+/)[0] === C.nombre.toLowerCase()) toast("¿Te estás anotando vos mismo? Raro, pero bueno.", 3200);
  });

  // Volver de "pago" a "datos" y cambiar género: el precio se actualiza solo (se recalcula al reenviar el paso 1)

  // Copiar alias
  $("#alias-copy").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    try {
      await navigator.clipboard.writeText(C.pago.alias);
    } catch {
      const r = document.createRange();
      r.selectNodeContents($("#alias-text"));
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      document.execCommand("copy");
      sel.removeAllRanges();
    }
    btn.textContent = "¡Copiado!";
    toast("Alias copiado. Ahora a transferir.");
    setTimeout(() => (btn.textContent = "Copiar"), 1800);
  });

  // Si ya confirmó desde este dispositivo, le mostramos su entrada
  const prev = store.get("rsvp");
  if (prev?.nombre) {
    steps.forEach((s) => s.classList.toggle("is-active", s.dataset.step === "ok"));
    $("#ticket-name").textContent = prev.nombre;
    $("#ticket-num").textContent = prev.num;
    $(".ok-title").textContent = "Ya estás adentro.";
  }
})();
