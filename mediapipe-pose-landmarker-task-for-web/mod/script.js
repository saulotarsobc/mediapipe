import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

let poseLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "360px";
const videoWidth = "480px";

const createPoseLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
        },
        runningMode: runningMode,
        numPoses: 2
    });
};
createPoseLandmarker();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const drawingUtils = new DrawingUtils(canvasCtx);

// Check if webcam access is supported.
const hasGetUserMedia = () => {
    var _a;
    return !!((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia);
};

// If webcam supported, add event listener to button for when user wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
} else {
    console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
    if (!poseLandmarker) {
        console.log("Wait! poseLandmarker not loaded yet.");
        return;
    }

    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    } else {
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    }

    // getUsermedia parameters.
    const constraints = {
        video: true
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}

let lastVideoTime = -1;

async function predictWebcam() {
    canvasElement.style.height = videoHeight;
    video.style.height = videoHeight;
    canvasElement.style.width = videoWidth;
    video.style.width = videoWidth;

    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await poseLandmarker.setOptions({ runningMode: "VIDEO" });
    }

    let startTimeMs = performance.now();

    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
            console.log(result); // Verifica a estrutura do resultado

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            // Desenhar um retângulo verde com opacidade no meio do canvas
            const rectWidth = 550;  // Largura do retângulo
            const rectHeight = 300; // Altura do retângulo
            const rectX = (canvasElement.width - rectWidth) / 2; // Posição X do retângulo
            const rectY = (canvasElement.height - rectHeight) / 5; // Posição Y do retângulo

            canvasCtx.fillStyle = "rgba(0, 255, 0, 0.3)"; // Verde com 30% de opacidade
            canvasCtx.fillRect(rectX, rectY, rectWidth, rectHeight);

            if (result.landmarks && result.landmarks.length > 0) { // Verifica se há landmarks
                for (const landmark of result.landmarks) {
                    drawingUtils.drawLandmarks(landmark, {
                        radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1)
                    });
                    drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);

                    // Obtendo a posição do nariz
                    if (landmark.landmark && landmark.landmark.length > PoseLandmarker.POSE_LANDMARKS.NOSE) {
                        const nose = landmark.landmark[PoseLandmarker.POSE_LANDMARKS.NOSE];

                        if (nose) { // Verifica se o nariz foi detectado
                            console.log(`Nose position: x=${nose.x}, y=${nose.y}`);

                            // Desenhar um círculo branco com opacidade ao redor do nariz
                            const radius = 20; // Raio do círculo
                            canvasCtx.beginPath();
                            canvasCtx.arc(nose.x * canvasElement.width, nose.y * canvasElement.height, radius, 0, 2 * Math.PI);
                            canvasCtx.fillStyle = "rgba(255, 255, 255, 0.5)"; // Branco com 50% de opacidade
                            canvasCtx.fill();
                            canvasCtx.closePath();
                        } else {
                            console.warn("Nose landmark is not defined.");
                        }
                    } else {
                        console.warn("Landmarks are not defined or too few landmarks returned.");
                    }
                }
            } else {
                console.warn("No landmarks detected.");
            }

            canvasCtx.restore();
        });
    }

    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}
