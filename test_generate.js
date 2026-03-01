async function testGeneration() {
    console.log("Triggering generation endpoint...");
    const start = Date.now();

    try {
        const res = await fetch("http://localhost:3005/api/timetable/generate", {
            method: "POST"
        });
        const data = await res.json();
        const time = (Date.now() - start) / 1000;

        console.log(`Generation finished in ${time} seconds.`);
        console.log("Result:", data);
    } catch (e) {
        console.error("Fetch error:", e.message);
    }
}

testGeneration();
