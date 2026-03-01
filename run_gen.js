const path = require('path');
require('ts-node').register({
    project: path.join(__dirname, 'tsconfig.json')
});

const { generateTimetable } = require('./src/lib/algorithm/scheduler');

async function test() {
    console.time("Generation");
    const result = await generateTimetable();
    console.timeEnd("Generation");
    console.log("Result:", result);
    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
