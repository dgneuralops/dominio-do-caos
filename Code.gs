// ─────────────────────────────────────────────
//  DOMÍNIO DO CAOS — Apps Script Backend
//  Cole este código em script.google.com
//  e publique como Web App (qualquer pessoa)
// ─────────────────────────────────────────────

// 1. ID da sua planilha Google Sheets
//    (está na URL: docs.google.com/spreadsheets/d/ESTE_ID_AQUI/edit)
const SHEET_ID   = 'COLE_O_ID_DA_SUA_PLANILHA_AQUI';
const SHEET_NAME = 'Leads';

// 2. Provedor de WhatsApp — escolha um: 'zapi' | 'ultramsg' | 'evolution'
const WA_PROVIDER = 'zapi';

// ── Z-API (z-api.io) ──────────────────────────
// Pegue em: app.z-api.io → sua instância → Token
const ZAPI_INSTANCE = 'COLE_SEU_INSTANCE_ID';
const ZAPI_TOKEN    = 'COLE_SEU_TOKEN';
// ID do grupo: abra o grupo no WhatsApp Web, copie o link
// e extraia o número + @g.us, ex: "5511912345678-1620000000@g.us"
const ZAPI_GROUP_ID = 'COLE_O_ID_DO_GRUPO@g.us';

// ── UltraMsg (alternativa) ───────────────────
const ULTRAMSG_INSTANCE = 'COLE_SEU_INSTANCE';
const ULTRAMSG_TOKEN    = 'COLE_SEU_TOKEN';
const ULTRAMSG_TO       = 'COLE_O_NUMERO_OU_GRUPO';

// ── Evolution API (se você já tem) ───────────
const EVOLUTION_URL      = 'https://sua-evolution-api.com';
const EVOLUTION_APIKEY   = 'COLE_SUA_APIKEY';
const EVOLUTION_INSTANCE = 'COLE_SUA_INSTANCIA';
const EVOLUTION_GROUP_ID = 'COLE_O_ID_DO_GRUPO@g.us';

// ─────────────────────────────────────────────

function doPost(e) {
  try {
    const raw  = e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw);

    const name  = (data.name  || '').trim();
    const email = (data.email || '').trim();
    const phone = (data.phone || '').trim();

    if (!name || !email || !phone) {
      return respond({ ok: false, error: 'Campos obrigatórios ausentes.' });
    }

    // ── Grava na planilha ──
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    let sheet   = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Nome', 'E-mail', 'Telefone', 'Data/Hora']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }

    const now = new Date();
    const ts  = Utilities.formatDate(now, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
    sheet.appendRow([name, email, phone, ts]);

    // ── Notificação WhatsApp ──
    sendWhatsApp(name, email, phone, ts);

    return respond({ ok: true });

  } catch (err) {
    Logger.log('Erro: ' + err.message);
    return respond({ ok: false, error: err.message });
  }
}

// Responde a GET para testar se o endpoint está vivo
function doGet() {
  return ContentService.createTextOutput('DOMÍNIO DO CAOS — endpoint ativo ✅');
}

// ─────────────────────────────────────────────

function sendWhatsApp(name, email, phone, ts) {
  const msg =
    '🔴 *NOVO LEAD — DOMÍNIO DO CAOS*\n\n' +
    `*Nome:* ${name}\n` +
    `*E-mail:* ${email}\n` +
    `*Telefone:* ${phone}\n` +
    `*Entrada:* ${ts}`;

  try {
    if (WA_PROVIDER === 'zapi') {
      UrlFetchApp.fetch(
        `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
        {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({ phone: ZAPI_GROUP_ID, message: msg }),
          muteHttpExceptions: true
        }
      );

    } else if (WA_PROVIDER === 'ultramsg') {
      UrlFetchApp.fetch(
        `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`,
        {
          method: 'post',
          contentType: 'application/x-www-form-urlencoded',
          payload: `token=${ULTRAMSG_TOKEN}&to=${encodeURIComponent(ULTRAMSG_TO)}&body=${encodeURIComponent(msg)}`,
          muteHttpExceptions: true
        }
      );

    } else if (WA_PROVIDER === 'evolution') {
      UrlFetchApp.fetch(
        `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
        {
          method: 'post',
          contentType: 'application/json',
          headers: { apikey: EVOLUTION_APIKEY },
          payload: JSON.stringify({ number: EVOLUTION_GROUP_ID, text: msg }),
          muteHttpExceptions: true
        }
      );
    }
  } catch (waErr) {
    // Não deixa o WhatsApp quebrar a gravação na planilha
    Logger.log('Erro WhatsApp: ' + waErr.message);
  }
}

// ─────────────────────────────────────────────

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
