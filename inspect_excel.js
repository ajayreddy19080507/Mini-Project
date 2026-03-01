const xlsx = require('xlsx');
const fs = require('fs');

try {
    const workbook = xlsx.readFile('sample_data.xlsx');
    const result = {};

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        result[sheetName] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    });

    fs.writeFileSync('excel_dump.json', JSON.stringify(result, null, 2));
    console.log("Wrote to excel_dump.json");
} catch (e) {
    console.error("Error:", e.message);
}
