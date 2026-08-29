// ══════════════════════════════════════════════════════
//  DOMÍNIO DO CAOS — Backend
//  Google Apps Script + Google Sheets + Evolution API
// ══════════════════════════════════════════════════════

// ── Planilha ──────────────────────────────────────────
const SHEET_ID   = '1Cpqx2PMS7AE0WjaSoCZDJHew-3xFFuhnCJKRFPFGmqA';
const SHEET_NAME = 'Leads';

// ── Evolution API ─────────────────────────────────────
const EVO_URL      = 'https://COLE_SUA_URL_EVOLUTION';  // sem / no final
const EVO_APIKEY   = 'COLE_SUA_GLOBAL_APIKEY';
const EVO_INSTANCE = 'COLE_O_NOME_DA_INSTANCIA';
// ID do grupo — formato: 5511999999999-1234567890@g.us
// Para descobrir: veja o passo 3 das instruções abaixo
const EVO_GROUP    = 'COLE_O_ID_DO_GRUPO@g.us';

// ══════════════════════════════════════════════════════

function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents);
    const name  = (data.name  || '').trim();
    const email = (data.email || '').trim();
    const phone = (data.phone || '').trim();

    if (!name || !email || !phone) {
      return ok({ ok: false, error: 'Campos ausentes.' });
    }

    // Grava na planilha
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    let sheet   = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const header = sheet.getRange(1, 1, 1, 4);
      header.setValues([['Nome', 'E-mail', 'Telefone', 'Data/Hora']]);
      header.setFontWeight('bold');
      header.setBackground('#0d0d0d');
      header.setFontColor('#f5f1ea');
    }

    const ts = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
    sheet.appendRow([name, email, phone, ts]);

    // Notifica no WhatsApp
    notifyEvolution(name, email, phone, ts);

    return ok({ ok: true });

  } catch (err) {
    Logger.log(err);
    return ok({ ok: false, error: err.message });
  }
}

function doGet() {
  return ContentService.createTextOutput('endpoint ativo ✅');
}

// ══════════════════════════════════════════════════════

function notifyEvolution(name, email, phone, ts) {
  const msg =
    '🔴 *NOVO LEAD — DOMÍNIO DO CAOS*\n\n' +
    `*Nome:* ${name}\n` +
    `*E-mail:* ${email}\n` +
    `*Telefone:* ${phone}\n` +
    `*Horário:* ${ts}`;

  UrlFetchApp.fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
    method: 'post',
    contentType: 'application/json',
    headers: { apikey: EVO_APIKEY },
    payload: JSON.stringify({
      number: EVO_GROUP,
      text: msg
    }),
    muteHttpExceptions: true
  });
}

// ══════════════════════════════════════════════════════

// Função auxiliar para descobrir o ID do grupo:
// 1. Selecione essa função no editor
// 2. Clique em Executar
// 3. Veja o log (Ver → Registros)
function listarGrupos() {
  const res = UrlFetchApp.fetch(`${EVO_URL}/group/fetchAllGroups/${EVO_INSTANCE}?getParticipants=false`, {
    headers: { apikey: EVO_APIKEY },
    muteHttpExceptions: true
  });
  Logger.log(res.getContentText());
}

function ok(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
