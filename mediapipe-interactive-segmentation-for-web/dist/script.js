// Copyright 2023 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { InteractiveSegmenter, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
const demosSection = document.getElementById("demos");
let interactiveSegmenter;
// Before we can use InteractiveSegmenter class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createSegmenter = async () => {
    const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    interactiveSegmenter = await InteractiveSegmenter.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite`,
            delegate: "GPU"
        },
        outputCategoryMask: true,
        outputConfidenceMasks: false
    });
    demosSection.classList.remove("invisible");
};
createSegmenter();
/********************************************************************
 // Demo 1: Grab a bunch of images from the page and detection them
 // upon click.
 ********************************************************************/
// In this demo, we have put all our clickable images in divs with the
// CSS class 'detectionOnClick'. Lets get all the elements that have
// this class.
const imageContainers = document.getElementsByClassName("detectOnClick");
const uploadFile = document.getElementById("uploadFile");
const imageUpload = document.getElementById("imageUpload");
// Handle the upload file event
uploadFile.addEventListener("change", uploadedImage, false);
function uploadedImage(event) {
    const reader = new FileReader();
    reader.onload = function () {
        const src = reader.result;
        imageUpload.src = src;
        imageUpload.style.display = "block";
        const canvas = imageUpload.parentElement.getElementsByClassName("canvas-segmentation")[0];
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const clickPoint = imageUpload.parentElement.getElementsByClassName("click-point")[0];
        clickPoint.style.display = "none";
    };
    reader.readAsDataURL(event.target.files[0]);
}
// Handle clicks on the demo images
for (let i = 0; i < imageContainers.length; i++) {
    imageContainers[i].children[0].addEventListener("click", handleClick);
}
/**
 * Detect segmentation on click
 */
async function handleClick(event) {
    if (!interactiveSegmenter) {
        alert("InteractiveSegmenter still loading. Try again shortly.");
        return;
    }
    interactiveSegmenter.segment(event.target, {
        keypoint: {
            x: event.offsetX / event.target.width,
            y: event.offsetY / event.target.height
        }
    }, (result) => {
        drawSegmentation(result.categoryMask, event.target.parentElement);
        drawClickPoint(event.target.parentElement, event);
    });
}
/**
 * Draw segmentation result
 */
function drawSegmentation(mask, targetElement) {
    const width = mask.width;
    const height = mask.height;
    const maskData = mask.getAsFloat32Array();
    const canvas = targetElement.getElementsByClassName("canvas-segmentation")[0];
    canvas.width = width;
    canvas.height = height;
    console.log("Start visualization");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#00000000";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(18, 181, 203, 0.7)";
    maskData.map((category, index) => {
        if (Math.round(category * 255.0) === 0) {
            const x = (index + 1) % width;
            const y = (index + 1 - x) / width;
            ctx.fillRect(x, y, 1, 1);
        }
    });
}
/**
 * Draw click point
 */
function drawClickPoint(targetElement, event) {
    const clickPoint = targetElement.getElementsByClassName("click-point")[0];
    clickPoint.style.top = `${event.offsetY - 8}px`;
    clickPoint.style.left = `${event.offsetX - 8}px`;
    clickPoint.style.display = "block";
}