// Native fetch in Node 18+

// Native fetch in Node 18+
async function trigger() {
    try {
        console.log("Triggering generation...");
        // Assuming running on 3005
        const res = await fetch('http://localhost:3005/api/timetable/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': 'principal@srecnandyal.edu.in' // Mock Auth
            }
        });
        const data = await res.json();
        console.log("Result:", data);
    } catch (e) {
        console.error("Failed:", e.message);
    }
}
trigger();
