const fs = require('fs');
const data = JSON.parse(fs.readFileSync('debug_schedule.json'));
const seen = new Map();
let out = '';
data.forEach(b => {
    const key = b.sectionId + '-' + b.slot.day + '-' + b.slot.period;
    if (seen.has(key)) {
        out += 'DUPLICATE: ' + key + '\n';
        out += 'OLD: ' + JSON.stringify(seen.get(key)) + '\n';
        out += 'NEW: ' + JSON.stringify(b) + '\n\n';
    } else {
        seen.set(key, b);
    }
});
fs.writeFileSync('dups.txt', out);
