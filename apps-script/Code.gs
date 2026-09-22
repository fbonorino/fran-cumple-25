/**
 * Backend de la invitación: recibe el formulario y agrega una fila al Sheet.
 *
 * Cómo se instala (detalle en el README):
 *  1. Creá un Google Sheet → Extensiones → Apps Script → pegá este archivo.
 *  2. Implementar → Nueva implementación → Aplicación web
 *       Ejecutar como: Yo  ·  Quién tiene acceso: Cualquier persona
 *  3. Copiá la URL que termina en /exec y pegala en js/config.js (scriptUrl).
 *  4. En el editor de Apps Script: Configuración del proyecto (⚙️) →
 *     Propiedades del script → agregá RSVP_TOKEN con el mismo valor que
 *     tiene RSVP_TOKEN en js/main.js.
 *
 * Si cambiás este código tenés que crear una NUEVA VERSIÓN de la implementación
 * (Implementar → Administrar implementaciones → ✏️ → Versión: Nueva).
 */

const SHEET_NAME = 'Asistencias';
const NOTIFY_EMAIL = ''; // opcional: tu mail para que te avise cada confirmación

const HEADERS = [
  'Fecha', 'Asiste', 'Nombre', 'Género', 'Mensaje', 'Monto esperado',
  'Transferencia a nombre de', 'Dijo que transfirió', 'Pago verificado ✅', 'Excusa',
];

// Precios reales por género. No confiamos en lo que mande el cliente: si no
// matchea con esto, se rechaza el envío (ver validación en doPost).
const PRECIO_HOMBRE = 80000;
const PRECIO_MUJER = 30000;

// Filas envíadas con menos de este tiempo desde que se cargó la página son
// casi seguro scripts pegándole directo a la URL, no una persona completando
// el formulario a mano.
const MIN_MS_DESDE_CARGA = 2000;

// Envíos aceptados por hora antes de cortar (protección contra spam masivo).
const LIMITE_POR_HORA = 50;

// Nombre/mensaje/titular con pinta de URL o dominio: no tienen nada que
// hacer ahí en un RSVP real.
const PATRON_URL = /https?:\/\/|www\.|\.(mp|com|net|ru|cn|xyz|info|top|link)\b/i;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // evita filas pisadas si confirman dos a la vez
    const d = JSON.parse(e.postData.contents);

    if (d.website) return json({ ok: true }); // honeypot: es un bot, lo ignoramos

    // Secreto compartido: filtra la mayoría de los envíos automáticos/casuales
    // que le pegan directo a esta URL sin pasar por el sitio.
    const tokenEsperado = PropertiesService.getScriptProperties().getProperty('RSVP_TOKEN');
    if (tokenEsperado && d.token !== tokenEsperado) {
      return json({ ok: false, error: 'No autorizado' });
    }

    if (!d.nombre || !String(d.nombre).trim()) return json({ ok: false, error: 'Falta el nombre' });

    // Trampa de tiempo: nadie completa el form en menos de 2 segundos.
    if (d.loadedAt) {
      const transcurrido = Date.now() - Number(d.loadedAt);
      if (!isNaN(transcurrido) && transcurrido < MIN_MS_DESDE_CARGA) {
        return json({ ok: false, error: 'Envío demasiado rápido' });
      }
    }

    // Rate limit básico: cuenta envíos aceptados en la última hora.
    const cache = CacheService.getScriptCache();
    const rateKey = 'rsvp_rate_' + Math.floor(Date.now() / 3600000);
    const enEstaHora = Number(cache.get(rateKey) || 0);
    if (enEstaHora >= LIMITE_POR_HORA) {
      return json({ ok: false, error: 'Límite de envíos alcanzado, probá más tarde' });
    }

    // Validación de género y monto (solo aplica cuando confirma asistencia).
    if (d.asiste !== 'NO') {
      if (d.genero !== 'hombre' && d.genero !== 'mujer') {
        return json({ ok: false, error: 'Género inválido' });
      }
      const precioReal = d.genero === 'hombre' ? PRECIO_HOMBRE : PRECIO_MUJER;
      if (Number(d.montoEsperado) !== precioReal) {
        return json({ ok: false, error: 'Monto inválido' });
      }
    }

    // Nada de links en los campos de texto libre.
    if (PATRON_URL.test(String(d.nombre || '')) ||
        PATRON_URL.test(String(d.mensaje || '')) ||
        PATRON_URL.test(String(d.titular || ''))) {
      return json({ ok: false, error: 'Contenido no permitido' });
    }

    // Evita filas duplicadas si el front reintenta el mismo envío (mismo id)
    const dupKey = d.id ? 'rsvp_' + String(d.id).slice(0, 100) : null;
    if (dupKey && cache.get(dupKey)) return json({ ok: true });

    const sheet = getSheet();
    sheet.appendRow([
      new Date(),
      d.asiste === 'NO' ? 'NO' : 'SI',
      clean(d.nombre, 80),
      clean(d.genero, 20),
      clean(d.mensaje, 500),
      d.montoEsperado ? Number(d.montoEsperado) : '',
      clean(d.titular, 80),
      d.asiste === 'NO' ? '' : (d.transfirio === 'SI' ? 'SI' : 'NO'),
      false, // lo tildás vos a mano cuando veas la transferencia
      clean(d.excusa, 500),
    ]);
    cache.put(rateKey, String(enEstaHora + 1), 3600);
    if (dupKey) cache.put(dupKey, '1', 21600); // 6 hs, más que suficiente para cualquier reintento

    // checkbox solo en la fila nueva (si se pre-cargan, appendRow escribe debajo de todos).
    // Va en su propio try: si falla (pasa a veces por el tipo de columna), la
    // fila ya quedó guardada y no queremos que eso se reporte como error.
    try {
      sheet.getRange(sheet.getLastRow(), 9).insertCheckboxes();
    } catch (err) {
      console.error('No se pudo insertar el checkbox de pago verificado: ' + err);
    }

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        (d.asiste === 'NO' ? '😢 No viene: ' : '🎉 Confirmó: ') + clean(d.nombre, 80),
        JSON.stringify(d, null, 2)
      );
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Para probar que la URL funciona abriéndola en el navegador
function doGet() {
  return json({ ok: true, msg: 'El backend del cumple está vivo' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#c8ff2e');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Recorta y evita que alguien inyecte fórmulas en tu planilla
function clean(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
 * LIMPIEZA DE FILAS FALSAS
 * ============================================================
 * Corré primero previewFilasSospechosas() y revisá el Log de ejecución
 * (Ver → Registros / Ctrl+Enter) antes de correr borrarFilasSospechosas().
 * Ambas usan exactamente los mismos criterios, así que lo que ves en el
 * preview es exactamente lo que se borra.
 *
 * Criterios (fila sospechosa si cumple CUALQUIERA):
 *  - Nombre o mensaje contienen caracteres CJK/Hangul/Cirílico (chino, etc).
 *  - "Transferencia a nombre de" tiene pinta de URL/dominio.
 *  - Género "mujer" con monto 80000, o género "hombre" con monto 30000
 *    (precio cruzado — imposible con el form real).
 */
const PATRON_NO_LATINO = /[㐀-鿿豈-﫿぀-ヿ가-힯Ѐ-ӿ]/;

function esFilaSospechosa_(row) {
  // row = [Fecha, Asiste, Nombre, Género, Mensaje, Monto esperado, Transferencia a nombre de, ...]
  const nombre = String(row[2] || '');
  const genero = String(row[3] || '').trim().toLowerCase();
  const mensaje = String(row[4] || '');
  const monto = Number(row[5]) || 0;
  const titular = String(row[6] || '');

  if (PATRON_NO_LATINO.test(nombre) || PATRON_NO_LATINO.test(mensaje)) return 'nombre/mensaje no latino';
  if (PATRON_URL.test(titular)) return 'titular con URL';
  if (genero === 'mujer' && monto === PRECIO_HOMBRE) return 'género mujer con monto de hombre';
  if (genero === 'hombre' && monto === PRECIO_MUJER) return 'género hombre con monto de mujer';
  return null;
}

function previewFilasSospechosas() {
  const sheet = getSheet();
  const last = sheet.getLastRow();
  if (last < 2) { Logger.log('Sheet vacío.'); return; }
  const data = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  let encontradas = 0;
  data.forEach((row, i) => {
    const motivo = esFilaSospechosa_(row);
    if (motivo) {
      encontradas++;
      Logger.log(
        'Fila %s | motivo: %s | Nombre: "%s" | Género: %s | Monto: %s | Titular: "%s" | Mensaje: "%s"',
        i + 2, motivo, row[2], row[3], row[5], row[6], row[4]
      );
    }
  });
  Logger.log('Total sospechosas: %s de %s filas.', encontradas, data.length);
}

function borrarFilasSospechosas() {
  const sheet = getSheet();
  const last = sheet.getLastRow();
  if (last < 2) { Logger.log('Sheet vacío.'); return; }
  const data = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const filasABorrar = [];
  data.forEach((row, i) => {
    if (esFilaSospechosa_(row)) filasABorrar.push(i + 2); // fila real en el sheet
  });
  // De abajo hacia arriba para no correr los índices al borrar.
  filasABorrar.sort((a, b) => b - a).forEach((fila) => sheet.deleteRow(fila));
  Logger.log('Borradas %s filas: %s', filasABorrar.length, filasABorrar.join(', '));
}
