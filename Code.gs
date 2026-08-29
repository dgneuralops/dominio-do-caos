// ══════════════════════════════════════════════════════
//  DOMÍNIO DO CAOS — Backend
//  Google Apps Script + Google Sheets + Evolution API
//
//  As credenciais NÃO ficam aqui — ficam em:
//  Projeto > Configurações > Propriedades do script
//
//  Chaves necessárias:
//    EVO_URL       → https://evolution.neuralops.app
//    EVO_APIKEY    → sua API key da Evolution
//    EVO_INSTANCE  → Doug | Nooma
//    EVO_GROUP     → 120363425484036466@g.us
//    SHEET_ID      → 1Cpqx2PMS7AE0WjaSoCZDJHew-3xFFuhnCJKRFPFGmqA
// ══════════════════════════════════════════════════════

const SHEET_NAME = 'Leads';

function getProps() {
  return PropertiesService.getScriptProperties().getProperties();
}

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

    const p = getProps();

    // Grava na planilha
    const ss  = SpreadsheetApp.openById(p.SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const h = sheet.getRange(1, 1, 1, 4);
      h.setValues([['Nome', 'E-mail', 'Telefone', 'Data/Hora']]);
      h.setFontWeight('bold');
      h.setBackground('#0d0d0d');
      h.setFontColor('#f5f1ea');
    }

    const ts = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
    sheet.appendRow([name, email, phone, ts]);

    // Notifica no WhatsApp
    notifyEvolution(p, name, email, phone, ts);

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

function notifyEvolution(p, name, email, phone, ts) {
  const msg =
    '🔴 *NOVO LEAD — DOMÍNIO DO CAOS*\n\n' +
    `*Nome:* ${name}\n` +
    `*E-mail:* ${email}\n` +
    `*Telefone:* ${phone}\n` +
    `*Horário:* ${ts}`;

  UrlFetchApp.fetch(`${p.EVO_URL}/message/sendText/${encodeURIComponent(p.EVO_INSTANCE)}`, {
    method: 'post',
    contentType: 'application/json',
    headers: { apikey: p.EVO_APIKEY },
    payload: JSON.stringify({ number: p.EVO_GROUP, text: msg }),
    muteHttpExceptions: true
  });
}

// ══════════════════════════════════════════════════════
// Rode esta função UMA VEZ para salvar as credenciais.
// Depois pode apagar o bloco setupProps() se quiser.
// ══════════════════════════════════════════════════════

function setupProps() {
  PropertiesService.getScriptProperties().setProperties({
    SHEET_ID    : '1Cpqx2PMS7AE0WjaSoCZDJHew-3xFFuhnCJKRFPFGmqA',
    EVO_URL     : 'https://evolution.neuralops.app',
    EVO_INSTANCE: 'Doug | Nooma',
    EVO_GROUP   : '120363425484036466@g.us',
    EVO_APIKEY  : 'COLE_SUA_APIKEY_AQUI'  // ← única coisa que você preenche
  });
  Logger.log('Propriedades salvas com sucesso ✅');
}

function ok(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
