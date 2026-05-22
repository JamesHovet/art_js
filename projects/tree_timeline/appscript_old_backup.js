function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    const name = data.name;
    const timestamp = data.timestamp;
    const jsonBlob = data.jsonBlob;

    // Get the active spreadsheet and first sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');

    // If no headers exist, add them
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Name', 'Timestamp', 'Data']);
    }

    // Append the new row
    sheet.appendRow([name, timestamp, jsonBlob]);

    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
    const lastRow = sheet.getLastRow();

    // If no data exists
    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Get all data (skip header row)
    const range = sheet.getRange(2, 1, lastRow - 1, 3);
    const values = range.getValues();

    // Convert to array of objects
    const entries = values.map((row, index) => ({
      rowIndex: index + 2, // Row number in sheet (1-indexed, accounting for header)
      name: row[0],
      timestamp: row[1],
      data: row[2]
    }));

    // Sort by timestamp descending (most recent first)
    entries.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: entries
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
