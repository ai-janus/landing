/* Janus web: interacción mínima. La página funciona entera sin este archivo. */
(function () {
  "use strict";

  // 1. CTA: arma los mailto desde las constantes del <body> y escribe el mail en texto.
  function armarCTAs() {
    var body = document.body;
    var contacto = body.getAttribute("data-contacto") || "";
    var asunto = body.getAttribute("data-asunto") || "";
    if (!contacto || contacto.charAt(0) === "[") return; // placeholder: queda el href de respaldo (#contacto)
    var href = "mailto:" + contacto + (asunto ? "?subject=" + encodeURIComponent(asunto) : "");
    var ctas = document.querySelectorAll('a[data-cta="mail"]');
    for (var i = 0; i < ctas.length; i++) ctas[i].setAttribute("href", href);
    var textos = document.querySelectorAll("[data-mail-texto]");
    for (var j = 0; j < textos.length; j++) textos[j].textContent = contacto;
  }

  // 2. Nav lateral: marca la sección visible.
  function lateral() {
    var links = document.querySelectorAll(".lateral a[data-seccion], .indice-movil a[data-seccion]");
    if (!links.length) return;
    var porId = {}, ids = [];
    for (var i = 0; i < links.length; i++) {
      var id0 = links[i].getAttribute("data-seccion");
      if (!porId[id0]) { porId[id0] = []; ids.push(id0); }
      porId[id0].push(links[i]);
    }
    var secciones = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var activaId = null;
    function centrar(a) { // en el índice móvil, el seleccionado queda centrado
      var fila = a.parentNode; if (!fila || !fila.classList.contains("indice-movil")) return;
      var destino = a.offsetLeft - (fila.clientWidth - a.offsetWidth) / 2;
      if (fila.scrollTo) fila.scrollTo({ left: Math.max(0, destino), behavior: "smooth" }); else fila.scrollLeft = Math.max(0, destino);
    }
    function activar(id) {
      if (id === activaId) return;
      activaId = id;
      for (var k = 0; k < links.length; k++) links[k].classList.remove("activa");
      (porId[id] || []).forEach(function (a) { a.classList.add("activa"); centrar(a); });
    }
    // La sección activa es la última cuyo inicio pasó la línea del 40% de la pantalla (por posición, no por observador).
    function calcular() {
      var linea = window.innerHeight * 0.4, elegida = secciones[0];
      for (var j = 0; j < secciones.length; j++) { if (secciones[j].getBoundingClientRect().top <= linea) elegida = secciones[j]; }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) elegida = secciones[secciones.length - 1];
      if (elegida) activar(elegida.id);
    }
    var pendiente = false;
    function alScroll() { if (pendiente) return; pendiente = true; window.requestAnimationFrame(function () { pendiente = false; calcular(); }); }
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll, { passive: true });
    window.addEventListener("hashchange", function () { window.setTimeout(calcular, 50); });
    calcular(); window.setTimeout(calcular, 300);
  }

  // 3. Trama: cada punto es una línea pagada. Las de la muestra están auditadas; el resto, nadie las miró.
  // Catálogo sintético tomado de la demo Omint (Janus-Demo v3): módulos quirúrgicos con sus descartables
  // esperados e inclusiones, medicamentos de alto costo con precio de referencia, reglas R1-R6.
  var MODULOS = [
    ["Colecistectomía laparoscópica", 13, "los descartables estándar de laparoscopía"],
    ["Hernioplastia inguinal", 10, "la malla y los descartables estándar"],
    ["Apendicectomía laparoscópica", 11, "los descartables estándar de laparoscopía"],
    ["Artroscopia de rodilla (LCA)", 16, "los anclajes e insumos artroscópicos"],
    ["Artroscopia de menisco", 12, "los insumos artroscópicos estándar"],
    ["Facoemulsificación (catarata)", 8, "el lente intraocular y el viscoelástico"],
    ["Cesárea", 14, "los descartables obstétricos estándar"],
    ["Safenectomía (várices)", 9, "los descartables de flebología"],
    ["Tiroidectomía", 10, "los descartables de cirugía de cabeza y cuello"],
    ["Hemorroidectomía", 8, "los descartables de proctología"],
    ["Resección prostática (RTU)", 12, "los insumos de resección endoscópica"],
    ["Bypass gástrico", 20, "los cartuchos de sutura mecánica y los descartables"]
  ];
  var MEDS = [
    ["Oncológico de alto costo", 1650000], ["Biológico", 890000], ["Antibiótico de alto costo", 320000],
    ["Inmunosupresor", 540000], ["Factor de coagulación", 2100000], ["Anticuerpo monoclonal", 1350000],
    ["Interferón", 460000], ["Hormona de crecimiento", 780000], ["Inmunoglobulina", 1100000]
  ];
  function ars(n) { return "$ " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function pct(x) { return Math.round(x * 100) + "%"; }
  function ejemploIrregular(d) {
    var r = azar(d + 101), m = MODULOS[Math.floor(azar(d + 7) * MODULOS.length)], med = MEDS[Math.floor(azar(d + 11) * MEDS.length)];
    var nombre = m[0], esp = m[1], inc = m[2];
    if (r < 0.20) { // R6 · cantidades sobre la norma
      var x = 2.8 + azar(d + 3) * 1.1, n = Math.round(esp * x);
      return [nombre, n + " descartables facturados; " + esp + " esperados en casos comparables de su cartera (" + x.toFixed(1).replace(".", ",") + " veces la norma)."];
    }
    if (r < 0.36) { // R4 · doble cobro del módulo
      return [nombre, "Descartables facturados aparte del módulo, que por convenio ya incluye " + inc + "."];
    }
    if (r < 0.50) { // R3 · precio sobre referencia (medicamento)
      var sob = 1.16 + azar(d + 5) * 0.14;
      return [med[0], "Facturado a " + ars(med[1] * sob) + " cuando el valor de referencia vigente es " + ars(med[1]) + " (" + pct(sob - 1) + " por encima)."];
    }
    if (r < 0.58) { // R3 · precio sobre referencia (descartables)
      return [nombre, "Set de descartables un " + pct(0.16 + azar(d + 9) * 0.16) + " por encima del valor de referencia del convenio."];
    }
    if (r < 0.66) { // R1 · duplicado de módulo
      return [nombre, "El mismo módulo facturado dos veces para el mismo afiliado, con " + (8 + Math.floor(azar(d + 13) * 5)) + " días de diferencia y sin conciliar con un débito."];
    }
    if (r < 0.72) { // R1 · duplicado de insumos
      return [nombre, "Set de descartables re-presentado " + (12 + Math.floor(azar(d + 17) * 11)) + " días después, sin conciliar con un débito previo."];
    }
    if (r < 0.80) { // R5 · tope de sesiones
      return ["Sesión de kinesiología", "Sesión " + (11 + Math.floor(azar(d + 19) * 3)) + " de una serie con tope de 10 por autorización, según Anexo III del convenio."];
    }
    if (r < 0.86) { // R2 · agenda imposible
      return ["Consulta en consultorio", "El mismo prestador facturó " + (48 + Math.floor(azar(d + 23) * 10)) + " consultas en un solo día hábil."];
    }
    if (r < 0.91) { // pensión sobre el alta: solo módulos con internación
      var INTERNAN = [0, 1, 2, 3, 6, 8, 10, 11], mi = MODULOS[INTERNAN[Math.floor(azar(d + 37) * INTERNAN.length)]];
      return [mi[0] + " · internación", "Pensión completa facturada el día del alta; el convenio paga medio día."];
    }
    if (r < 0.95) { // ventana
      return [nombre, "Realizada a los " + (62 + Math.floor(azar(d + 29) * 8)) + " días de una orden válida por 60."];
    }
    if (r < 0.98) { // autorización
      return [nombre, "Sin autorización vigente, que el convenio exige para esta práctica."];
    }
    return ["Laboratorio", "Panel de " + (22 + Math.floor(azar(d + 31) * 12)) + " determinaciones para un control de rutina; la norma de la cartera es 8."];
  }
  function ejemploCorrecto(d) {
    var r = azar(d + 41), m = MODULOS[Math.floor(azar(d + 7) * MODULOS.length)], med = MEDS[Math.floor(azar(d + 11) * MEDS.length)];
    if (r < 0.40) return [m[0], "Módulo y " + (m[1] - 1 + Math.floor(azar(d + 43) * 3)) + " descartables, dentro de lo esperado. Correcta."];
    if (r < 0.55) return ["Consulta en consultorio", "Una consulta, dentro de la agenda del día. Correcta."];
    if (r < 0.70) return ["Sesión de kinesiología", "Sesión " + (1 + Math.floor(azar(d + 47) * 9)) + " de 10 autorizadas. Correcta."];
    if (r < 0.82) return [med[0], "Facturado a valor de referencia (" + ars(med[1]) + "). Correcta."];
    if (r < 0.92) return ["Laboratorio", "Panel de rutina de " + (6 + Math.floor(azar(d + 53) * 4)) + " determinaciones. Correcta."];
    return ["Ecografía abdominal", "Práctica autorizada, dentro de plazo. Correcta."];
  }
  function ejemploAuditado(d) {
    var r = azar(d + 61), m = MODULOS[Math.floor(azar(d + 7) * MODULOS.length)], med = MEDS[Math.floor(azar(d + 11) * MEDS.length)];
    if (r < 0.6) return [m[0] + " · internación", "Cuenta de alto costo, revisada por auditoría médica. Auditada por su equipo."];
    return [med[0], "Medicación de alto costo, revisada por auditoría médica. Auditada por su equipo."];
  }
  function azar(n) { // hash entero determinístico por índice (sin rayas), para que cada punto diga siempre lo mismo
    var t = (n * 374761393 + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function trama() {
    var el = document.getElementById("trama");
    if (!el) return;
    el.classList.add("trama--js");
    var movil = window.matchMedia("(max-width: 639px)").matches;
    var COLS = movil ? 18 : 40, FILAS = movil ? 9 : 18;   // celular: 162 puntos, no 720
    var TOTAL = COLS * FILAS;
    var muestraCols = Math.round(COLS * (movil ? 0.22 : 0.14)), muestraFilas = Math.round(FILAS * (movil ? 0.33 : 0.22));
    var frag = document.createDocumentFragment();
    for (var d = 0; d < TOTAL; d++) {
      var i = document.createElement("i");
      i.setAttribute("aria-hidden", "true");
      var fila = Math.floor(d / COLS), col = d % COLS;
      var r = azar(d);
      var ej;
      if (col < muestraCols && fila < muestraFilas) {
        i.className = "auditada"; ej = ejemploAuditado(d); i.setAttribute("data-k", "Auditada");
      } else if (r < 0.10) {
        i.className = "irregular"; ej = ejemploIrregular(d); i.setAttribute("data-k", "Nadie la revisó · fraude o desperdicio");
      } else {
        i.className = "correcta"; ej = ejemploCorrecto(d); i.setAttribute("data-k", "Nadie la revisó");
      }
      i.setAttribute("data-titulo", ej[0]); i.setAttribute("data-t", ej[1]);
      frag.appendChild(i);
    }
    el.appendChild(frag);
    var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducido) el.classList.add("trama--lista"); else window.setTimeout(function () { el.classList.add("trama--lista"); }, 150);

    // Tooltip anclado a la trama (no al cursor): así puede quedar abierto de entrada y recorrerse solo.
    var tip = document.getElementById("tip"), tk = tip.querySelector(".tip__k"), tti = tip.querySelector(".tip__titulo"), tt = tip.querySelector(".tip__t");
    if (movil && el.parentNode) el.parentNode.appendChild(tip); // en celular el tooltip va debajo de la grilla, no encima
    var puntos = el.querySelectorAll("i"), centros = null, actual = null, vecinos = [];
    function medir() {
      centros = [];
      for (var k = 0; k < puntos.length; k++) { var r = puntos[k].getBoundingClientRect(); centros.push([r.left + r.width / 2, r.top + r.height / 2]); }
    }
    // Efecto topográfico: los vecinos se acercan al punto activo y crecen un poco, según la distancia.
    var ALCANCE = 64;
    function relieve(p) {
      for (var v = 0; v < vecinos.length; v++) vecinos[v].style.transform = "";
      vecinos = [];
      if (!p) return;
      if (!centros) medir();
      var idx = Array.prototype.indexOf.call(puntos, p), cx = centros[idx][0], cy = centros[idx][1];
      for (var k = 0; k < puntos.length; k++) {
        if (k === idx) continue;
        var dx = cx - centros[k][0], dy = cy - centros[k][1], d = Math.sqrt(dx * dx + dy * dy);
        if (d < ALCANCE) {
          var f = 1 - d / ALCANCE; f = f * f * (3 - 2 * f); // suavizado: fuerte al lado, se apaga en el borde
          puntos[k].style.transform = "translate(" + (dx / d * f * 11).toFixed(1) + "px," + (dy / d * f * 11 - f * 1.5).toFixed(1) + "px) scale(" + (1 + f * 1.1).toFixed(2) + ")";
          vecinos.push(puntos[k]);
        }
      }
    }
    function mostrar(p, rotulo) {
      if (actual && actual !== p) actual.classList.remove("activa");
      actual = p; p.classList.add("activa");
      relieve(p);
      tk.textContent = rotulo || p.getAttribute("data-k"); tti.textContent = p.getAttribute("data-titulo"); tt.textContent = p.getAttribute("data-t");
      tip.classList.toggle("tip--irregular", p.classList.contains("irregular"));
      tip.hidden = false;
      var w = tip.offsetWidth, h = tip.offsetHeight, tw = el.clientWidth;
      var cx = p.offsetLeft + p.offsetWidth / 2, cy = p.offsetTop + p.offsetHeight / 2;
      var left = Math.max(0, Math.min(cx - 16, tw - w));
      var arriba = cy - h - 14 >= -6;
      tip.classList.toggle("tip--abajo", !arriba);
      tip.style.left = left + "px";
      tip.style.top = (arriba ? cy - h - 14 : cy + 14) + "px";
      tip.style.setProperty("--tip-x", Math.max(8, Math.min(w - 16, cx - left - 4)) + "px");
    }
    function ocultar() { if (actual) actual.classList.remove("activa"); actual = null; relieve(null); tip.hidden = true; }
    // Sensibilidad por cercanía: se activa el punto más cercano al cursor dentro de un radio.
    var RADIO = 12;
    function cercano(x, y) {
      if (!centros) medir();
      var mejor = -1, dmin = RADIO * RADIO;
      for (var k = 0; k < centros.length; k++) {
        var dx = centros[k][0] - x, dy = centros[k][1] - y, d = dx * dx + dy * dy;
        if (d < dmin) { dmin = d; mejor = k; }
      }
      return mejor < 0 ? null : puntos[mejor];
    }
    window.addEventListener("resize", function () { centros = null; }, { passive: true });
    window.addEventListener("scroll", function () { centros = null; }, { passive: true });

    // Recorrido automático: "Lo que su equipo ve" por la muestra, "Lo que no vieron" por el resto.
    // El mouse lo interrumpe; se reanuda tras 5 s sin interacción sobre la trama.
    var auditadas = [], rojas = [];
    for (var q = 0; q < puntos.length; q++) { if (puntos[q].classList.contains("auditada")) auditadas.push(puntos[q]); else if (puntos[q].classList.contains("irregular")) rojas.push(puntos[q]); }
    var recorrido = { timer: null, paso: 0, activo: false, pausaHasta: 0 };
    var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function siguiente() {
      if (Date.now() < recorrido.pausaHasta) { recorrido.timer = window.setTimeout(siguiente, 400); return; }
      recorrido.activo = true;
      var n = recorrido.paso % 9, p, rot;
      if (n < 4) { p = auditadas[(recorrido.paso * 7 + n * 5) % auditadas.length]; rot = "Lo que su equipo ve"; }
      else { p = rojas[(recorrido.paso * 11 + n * 3) % rojas.length]; rot = "Lo que no vieron"; }
      if (p) mostrar(p, rot);
      recorrido.paso++;
      recorrido.timer = window.setTimeout(siguiente, (n === 3 || n === 8 ? 2600 : 1900) * (movil ? 1.3 : 1));
    }
    function pausar() { recorrido.activo = false; recorrido.pausaHasta = Date.now() + 5000; }
    el.addEventListener("mousemove", function (e) { pausar(); var p = cercano(e.clientX, e.clientY); if (p) mostrar(p); });
    el.addEventListener("mouseleave", function () { pausar(); });
    el.addEventListener("click", function (e) { pausar(); var p = cercano(e.clientX, e.clientY); if (p) mostrar(p); });
    if (!reducido) {
      tip.classList.add("tip--suave");
      window.setTimeout(siguiente, 900);
    } else {
      var primera = rojas[0]; if (primera) mostrar(primera, "Lo que no vieron");
    }
  }

  // 3b. Deep dive de "lo que reciben": cada entregable abre su ejemplo.
  function ejemplos() {
    var tarjetas = document.querySelectorAll("#reciben .recibe"), paneles = document.querySelectorAll("#casos-panel .ejemplo");
    if (!tarjetas.length) return;
    var pista = document.getElementById("casos-pista");
    if (pista && window.matchMedia("(hover: none)").matches) pista.textContent = "Toque cada entregable para ver su ejemplo.";
    function abrir(id) {
      for (var i = 0; i < tarjetas.length; i++) tarjetas[i].classList.toggle("activa", tarjetas[i].getAttribute("data-ejemplo") === id);
      for (var j = 0; j < paneles.length; j++) paneles[j].classList.toggle("activa", paneles[j].getAttribute("data-ejemplo") === id);
    }
    for (var k = 0; k < tarjetas.length; k++) {
      (function (t) {
        var id = t.getAttribute("data-ejemplo");
        t.addEventListener("mouseenter", function () { abrir(id); });
        t.addEventListener("focus", function () { abrir(id); });
        t.addEventListener("click", function () { abrir(id); var panel = document.getElementById("casos-panel"); if (window.matchMedia("(max-width: 1023px)").matches && panel) panel.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
      })(tarjetas[k]);
    }
  }

  // 4. Aparición suave de cada sección al entrar en pantalla (sin JS, todo visible).
  function aparecer() {
    document.documentElement.classList.add("js");
    var secs = document.querySelectorAll(".seccion");
    if (!("IntersectionObserver" in window)) { for (var i = 0; i < secs.length; i++) secs[i].classList.add("visible"); return; }
    var obs = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }); }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
    for (var j = 0; j < secs.length; j++) obs.observe(secs[j]);
    // Respaldo: lo que esté en pantalla se muestra sí o sí; y a los 1,5 s se muestra todo lo que ya pasó por la pantalla.
    function asegurar() { for (var k = 0; k < secs.length; k++) { var r = secs[k].getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 0) secs[k].classList.add("visible"); } }
    asegurar(); window.setTimeout(asegurar, 250); window.setTimeout(asegurar, 1500);
    window.addEventListener("hashchange", function () { window.setTimeout(asegurar, 100); });
    window.addEventListener("load", asegurar);
    var esperando = false;
    window.addEventListener("scroll", function () { if (esperando) return; esperando = true; window.requestAnimationFrame(function () { esperando = false; asegurar(); }); }, { passive: true });
  }

  aparecer();
  armarCTAs();
  lateral();
  trama();
  ejemplos();
})();
