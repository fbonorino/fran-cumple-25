/**
 * Backend de la invitación: recibe el formulario y agrega una fila al Sheet.
 *
 * Cómo se instala (detalle en el README):
 *  1. Creá un Google Sheet → Extensiones → Apps Script → pegá este archivo.
 *  2. Implementar → Nueva implementación → Aplicación web
 *       Ejecutar como: Yo  ·  Quién tiene acceso: Cualquier persona
 *  3. Copiá la URL que termina en /exec y pegala en js/config.js (scriptUrl).
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

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // evita filas pisadas si confirman dos a la vez
    const d = JSON.parse(e.postData.contents);

    if (d.website) return json({ ok: true }); // honeypot: es un bot, lo ignoramos
    if (!d.nombre || !String(d.nombre).trim()) return json({ ok: false, error: 'Falta el nombre' });

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
    // checkbox solo en la fila nueva (si se pre-cargan, appendRow escribe debajo de todos)
    sheet.getRange(sheet.getLastRow(), 9).insertCheckboxes();

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
