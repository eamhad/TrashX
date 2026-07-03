const MODEL_URL = "./model/";

let model;
let webcam;
let running = false;
let lastPredictionTime = 0;

const UPDATE_INTERVAL = 5000; // Update prediction every 5 seconds

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

// Predict
async function predict(source) {

    const prediction = await model.predict(source);

    let best = prediction[0];

    for (let i = 1; i < prediction.length; i++) {

        if (prediction[i].probability > best.probability) {

            best = prediction[i];

        }

    }

    const confidence = (best.probability * 100).toFixed(1);

    let color = "#22c55e";

    if (confidence < 80) color = "#f59e0b";

    if (confidence < 60) color = "#ef4444";

    results.innerHTML = `

        <div class="prediction-card">

            <h2>${best.className}</h2>

            <p>Confidence</p>

            <div class="progress">

                <div class="progress-fill"
                style="width:${confidence}%;
                background:${color};">

                </div>

            </div>

            <h3>${confidence}%</h3>

        </div>

    `;

}
