function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheetName = data.sheet || 'Sheet1';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Name', 'Timestamp', 'Data']);
    }
    sheet.appendRow([data.name, data.timestamp, data.data]);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Saved' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const sheetName = (e.parameter && e.parameter.sheet) || 'Sheet1';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3);
    const values = range.getValues();
    const entries = values.map((row, index) => ({
      rowIndex: index + 2,
      name: row[0],
      timestamp: row[1],
      data: row[2],
    }));
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: entries }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
