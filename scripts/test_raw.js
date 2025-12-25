
const apiKey = "AIzaSyCZEVdjaW25SlaGPoqwCG9Jg-YOUlZSIeQ";

async function checkModels() {
    console.log("Checking v1beta models...");
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        const flashModels = data.models.filter(m => m.name.includes("flash"));
        console.log("Flash Models:", JSON.stringify(flashModels, null, 2));
    } catch (e) {
        console.error("v1beta failed:", e.message);
    }
}

checkModels();
