import { generateTimetable } from './src/lib/algorithm/scheduler';

async function run() {
    console.time("Execution Time");
    const result = await generateTimetable();
    console.timeEnd("Execution Time");
    console.log("Result:", result);
}

run().catch(console.error);
