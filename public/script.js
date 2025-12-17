const MODEL_URL = "model/";

// 🔧 EASY FPS CONTROL (CHANGE THIS)
const FPS = 5;
const FRAME_INTERVAL = 1000 / FPS;

let model, webcam, lastFrameTime = 0;
let running = false;

const camBtn = document.getElementById("startCam");
const imgInput = document.getElementById("imageUpload");
const camContainer = document.getElementById("camera-container");
const resultsDiv = document.getElementById("results");

camBtn.onclick = startCamera;
imgInput.onchange = handleImage;

async function loadModel() {
  if (!model) {
    model = await tmImage.load(
      MODEL_URL + "model.json",
      MODEL_URL + "metadata.json"
    );
  }
}

async function startCamera() {
  await loadModel();

  camContainer.innerHTML = "";
  resultsDiv.innerText = "Starting camera...";

  webcam = new tmImage.Webcam(320, 320, true);
  await webcam.setup();
  await webcam.play();

  camContainer.appendChild(webcam.canvas);
  running = true;

  requestAnimationFrame(loop);
}

async function loop(timestamp) {
  if (!running) return;

  if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
    lastFrameTime = timestamp;

    webcam.update();
    await predict(webcam.canvas);
  }

  requestAnimationFrame(loop);
}

async function handleImage(event) {
  await loadModel();
  running = false;

  const file = event.target.files[0];
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = async () => {
    camContainer.innerHTML = "";
    camContainer.appendChild(img);
    await predict(img);
  };
}

async function predict(source) {
  const predictions = await model.predict(source);

  let output = "";
  predictions.forEach(p => {
    if (p.probability > 0.6) {
      output += `<strong>${p.className}</strong>: ${(p.probability * 100).toFixed(1)}%<br>`;
    }
  });

  resultsDiv.innerHTML = output || "No confident prediction";
}
