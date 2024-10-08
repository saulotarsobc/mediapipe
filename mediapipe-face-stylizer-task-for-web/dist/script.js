// Copyright 2022 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { FaceStylizer, FilesetResolver } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.6";
const demosSection = document.getElementById("demos");
let faceStylizer;
let enableWebcamButton;
let webcamRunning = false;
const videoWidth = 480;
// Before we can use FaceStylizer class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
// async function runDemo() {
// Read more `CopyWebpackPlugin`, copy wasm set from "https://cdn.skypack.dev/node_modules" to `/wasm`
async function createFaceStylizer() {
    const dropdown = document.getElementById("styleSelector");
    const selectedOption = dropdown.options[dropdown.selectedIndex].value;
    // Clean up any existing Face Stylizer instance
    if (faceStylizer !== undefined) {
        faceStylizer.close();
    }
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.6/wasm");
    faceStylizer = await FaceStylizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: selectedOption
        }
    });
}
createFaceStylizer();
const changeStyleButton = document.getElementById("changeStyle");
changeStyleButton.addEventListener("click", createFaceStylizer);
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/********************************************************************
// Demo 1: Grab a bunch of images from the page and stylize them
// upon click.
********************************************************************/
// In this demo, we have put all our clickable images in divs with the
// CSS class 'stylizeOnClick'. Lets get all the elements that have
// this class.
const imageContainers = document.getElementsByClassName("stylizeOnClick");
// Now let's go through all of these and add a click event listener.
for (let i = 0; i < imageContainers.length; i++) {
    // Add event listener to the child element whichis the img element.
    imageContainers[i].children[0].addEventListener("click", handleClick);
}
// When an image is clicked, let's stylize it and display results!
async function handleClick(event) {
    if (!faceStylizer) {
        console.log("Wait for faceStylizer to load before clicking!");
        return;
    }
    // Remove all face styles drawed before
    const allCanvas = event.target.parentNode.getElementsByClassName("canvas");
    for (var i = allCanvas.length - 1; i >= 0; i--) {
        const n = allCanvas[i];
        n.parentNode.removeChild(n);
    }
    // We can call faceStylizer.stylize as many times as we like with
    // different image data each time. This returns a promise
    // which we wait to complete and then call a function to
    // draw the generated image.
    // Add an element to let user know that stylization is taking place
    const waitingText = document.createElement("p");
    waitingText.setAttribute("class", "canvas");
    waitingText.setAttribute("width", event.target.naturalWidth + "px");
    waitingText.setAttribute("height", event.target.naturalHeight + "px");
    waitingText.style.left = "calc(100% + 16px)";
    waitingText.style.top = "0px";
    waitingText.style.width = `${event.target.width / 3}px`;
    waitingText.innerText = "Stylization in progress...";
    event.target.parentNode.appendChild(waitingText);
    await sleep(5);
    const faceStylizerResult = faceStylizer.stylize(event.target);
    const canvas = document.createElement("canvas");
    canvas.setAttribute("class", "canvas");
    canvas.setAttribute("width", event.target.naturalWidth + "px");
    canvas.setAttribute("height", event.target.naturalHeight + "px");
    canvas.style.left = "calc(100% + 16px)";
    canvas.style.top = "0px";
    canvas.style.width = `${event.target.width}px`;
    canvas.style.height = `${event.target.height}px`;
    event.target.parentNode.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    ctx.putImageData(faceStylizerResult.getAsImageData(), 0, 0);
    event.target.parentNode.removeChild(waitingText);
}
/********************************************************************
// Demo 2: Continuously grab image from webcam stream and stylize it.
********************************************************************/
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start stylization.
function enableCam(event) {
    if (!faceStylizer) {
        console.log("Wait! faceStylizer not loaded yet.");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "RUN WEBCAM";
        video.pause();
        predictWebcam();
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerText = "PAUSE AND STYLIZE";
        if (video.paused && video.played.length > 0) {
            video.play();
        }
        else {
            // Activate the webcam stream.
            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then(function (stream) {
                video.srcObject = stream;
            });
        }
    }
}
let lastVideoTime = -1;
async function predictWebcam() {
    const startTimeMs = performance.now();
    const callback = (image) => {
        if (image) {
            canvasElement.width = image.width;
            canvasElement.height = image.height;
            canvasCtx.putImageData(image.getAsImageData(), 0, 0);
        }
    };
    // Stylize when Pause video
    if (!webcamRunning && lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        faceStylizer.stylize(video, callback);
    }
}