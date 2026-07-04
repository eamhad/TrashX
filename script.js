const MODEL_URL = "model/";

let model;
let webcam;
let running = false;
let lastPredictionTime = 0;

const UPDATE_INTERVAL = 2000; // Update prediction every 5 seconds

const startBtn = document.getElementById("startCam");
const uploadInput = document.getElementById("imageUpload");
const cameraContainer = document.getElementById("camera-container");
const results = document.getElementById("results");

startBtn.addEventListener("click", toggleCamera);
uploadInput.addEventListener("change", handleImage);

// Load AI Model
async function loadModel() {
    if (model) return;

    results.innerHTML = `
        <div class="loading">
            <h2>Loading AI Model...</h2>
            <p>Please wait...</p>
        </div>
    `;

    model = await tmImage.load(
        MODEL_URL + "model.json",
        MODEL_URL + "metadata.json"
    );
}

// Start / Stop Camera
async function toggleCamera() {

    if (running) {

        running = false;

        if (webcam) {
            webcam.stop();
        }

        cameraContainer.innerHTML = `
            <div class="camera-placeholder">
                <i class="fa-solid fa-camera-retro"></i>
                <p>Camera Stopped</p>
            </div>
        `;

        results.innerHTML = "Camera stopped.";

        startBtn.innerHTML =
            `<i class="fa-solid fa-video"></i> Start Camera`;

        return;
    }

    try {

        await loadModel();

        webcam = new tmImage.Webcam(400, 400, true);

        await webcam.setup();

        await webcam.play();

        cameraContainer.innerHTML = "";

        cameraContainer.appendChild(webcam.canvas);

        running = true;

        startBtn.innerHTML =
            `<i class="fa-solid fa-stop"></i> Stop Camera`;

        requestAnimationFrame(loop);

    }

    catch (err) {

        console.error(err);

        results.innerHTML = `
        <span style="color:#ff6b6b;">
        Unable to access camera.<br>
        Please allow camera permission.
        </span>
        `;

    }

}

// Camera Loop
async function loop() {

    if (!running) return;

    webcam.update();

    const now = Date.now();

    if (now - lastPredictionTime >= UPDATE_INTERVAL) {

        lastPredictionTime = now;

        await predict(webcam.canvas);

    }

    requestAnimationFrame(loop);

}

// Upload Image
async function handleImage(event) {

    await loadModel();

    running = false;

    if (webcam) webcam.stop();

    const file = event.target.files[0];

    if (!file) return;

    const img = new Image();

    img.src = URL.createObjectURL(file);

    img.onload = async () => {

        cameraContainer.innerHTML = "";

        cameraContainer.appendChild(img);

        await predict(img);

    };

}

async function predict(source) {

    const prediction = await model.predict(source);

    let best = prediction[0];

    for (let i = 1; i < prediction.length; i++) {
        if (prediction[i].probability > best.probability) {
            best = prediction[i];
        }
    }

    const confidence = (best.probability * 100).toFixed(1);

    const THRESHOLD = 75;

    const icons = {
        Plastic: "🥤",
        Paper: "📄",
        Glass: "🍾",
        Metal: "🥫",
        Organic: "🍎",
        Cardboard: "📦",
        Trash: "🗑️",
        Battery: "🔋",
        Clothes: "👕"
    };

    let color = "#22c55e";

    if (confidence < 90) color = "#f59e0b";
    if (confidence < 70) color = "#ef4444";

    if (confidence < THRESHOLD) {

        results.innerHTML = `
        <div class="prediction-card">
            <h2>❓ Unknown Object</h2>
            <p>Confidence too low to classify.</p>
        </div>
        `;

        return;
    }

    // Disposal tips
    const disposalGuide = {
        Plastic: "♻️ Place in the Plastic Recycling Bin.",
        Paper: "♻️ Place in the Paper Recycling Bin.",
        Glass: "♻️ Place in the Glass Recycling Bin.",
        Metal: "♻️ Place in the Metal Recycling Bin.",
        Organic: "🌱 Place in the Compost/Organic Waste Bin.",
        Cardboard: "📦 Flatten and recycle with paper/cardboard.",
        Trash: "🗑️ Dispose in the General Waste Bin.",
        Battery: "🔋 Take to an E-waste or Battery Collection Center.",
        Clothes: "👕 Donate or recycle through a textile collection program."
    };

    results.innerHTML = `

    <div class="prediction-card">

        <h2>${icons[best.className] || "♻️"} ${best.className}</h2>

        <p>Confidence</p>

        <div class="progress">
            <div class="progress-fill"
            style="width:${confidence}%; background:${color};">
            </div>
        </div>

        <h3>${confidence}%</h3>

        <div style="
            margin-top:18px;
            padding:15px;
            border-radius:12px;
            background:rgba(255,255,255,.06);
            border:1px solid rgba(255,255,255,.12);
            font-size:15px;
            line-height:1.5;
        ">
            <strong>Disposal Guide</strong><br><br>
            ${disposalGuide[best.className] || "Dispose responsibly."}
        </div>

    </div>

    `;
}
