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

import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";

import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// Game state
const loadModel: number = 0;
const waitHands: number = 1;
const countDown: number = 2;

let computerScore: number = 0;
let yourScore: number = 0;
let frameNoHands: number = 0;

let state: number = loadModel;
let initialState: String = "initial";
let noneState: String = "none";
let iosParam: String = "";

let gestureRecognizer: GestureRecognizer;
// Get DOM elements
const videoEl = document.getElementById("input_video");
const restartButtonEl = document.getElementById("restart_btn");
const showHandViewEl = document.getElementById("show_hand");
const yourResultEl = document.getElementById("your_result");
const computerResultEl = document.getElementById("computer_result");
const videoContentEl = document.getElementById("video_content");
const resultEl = document.getElementById("result_text");
const nexRoundEl = document.getElementById("next_round");
const captureImageEl = document.getElementById("capture_image");
const waitingEl = document.getElementById("waiting");
const beginContentEl = document.getElementById("begin_content");
const playContentEl = document.getElementById("play_content");
const beginBtnEl = document.getElementById("begin_btn");
const loadingEl = document.getElementById("loading");
const loadViewEl = document.getElementById("load_view");

restartButtonEl.onclick = () => {
  restart();
};

beginBtnEl.onclick = () => {
  beginContentEl.style.display = noneState;
  playContentEl.style.display = initialState;
  camera.start();
  state = waitHands;
};

const camera = new Camera(videoEl, {
  onFrame: async () => {
    if (state == waitHands) {
      if (checkHands()) {
        frameNoHands = 0;
        startCountDown();
      } else {
        frameNoHands += 1;
        if (frameNoHands == 50) {
          showHandViewEl.style.display = initialState;
        }
        if (frameNoHands == 150) {
          if (computerScore > 0 || yourScore > 0) {
            restartButtonEl.style.display = initialState;
          }
        }
      }
    }
  },
  width: 1280,
  height: 720
});

// Return true if the player's hand is found on the camera
function checkHands() {
  const gestures = gestureRecognizer.recognize(videoEl);
  if (gestures.gestures.length === 0) {
    return false;
  } else {
    return true;
  }
}

// If the operating system is iOS, or the browser is Safari, you need to add some extra information to the video tag for videos to play properly
function checkOS() {
  const deviceDetector = new DeviceDetector();
  const detectedDevice = deviceDetector.parse(navigator.userAgent);
  if (detectedDevice.os.name === "iOS") {
    iosParam = "autoplay muted playsinline controls='true'";
  } else if (detectedDevice.client.name === "Safari") {
    iosParam = "autoplay muted playsinline controls='true'";
  }
}

// Checks what state the player's hand is in
// Call back the final result after 4 checks
async function checkResult(onResult) {
  let finalResult;
  let finalImage;
  let count = 0;
  let x = setInterval(async function () {
    count += 1;
    const results = await getResults();
    console.log(results[1]);
    if (results[1] != null) {
      if (
        finalResult == null ||
        finalResult == 0 ||
        results[1].categoryName != "None"
      ) {
        finalResult = results[1];
        finalImage = results[0];
      }
    }
    if (count == 4) {
      clearInterval(x);
      if (finalImage == null) {
        finalImage = results[0];
      }
      onResult(finalResult, finalImage);
    }
  }, 50);
}

// Return Result from camera
async function getResults() {
  let result;
  let canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  const results = await gestureRecognizer.recognize(canvas);
  const gestures = results.gestures;
  if (gestures.length == 1) {
    result = gestures[0][0];
  }
  if (results.landmarks.length > 0) {
    drawConnectors(ctx, results.landmarks[0], HAND_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 2
    });
  }
  const captureImage = canvas.toDataURL("image/jpeg");
  return [captureImage, result];
}

// Start countdown 3 time after that game begins.
function startCountDown() {
  if (state == countDown) {
    return;
  }
  state = countDown;
  showHandViewEl.style.display = noneState;
  restartButtonEl.style.display = noneState;
  waitingEl.style.display = initialState;
  let countDownTime = 3;
  waitingEl.innerHTML = countDownTime.toString();
  let x = setInterval(function () {
    if (countDownTime == 0) {
      clearInterval(x);
      waitingEl.style.display = noneState;
      if (checkHands()) {
        startRound();
      } else {
        setTimeout(() => {
          if (checkHands()) {
            startRound();
          } else {
            state = waitHands;
            showHandViewEl.style.display = initialState;
          }
        }, 50);
      }
    } else {
      countDownTime -= 1;
      waitingEl.innerHTML = countDownTime.toString();
    }
  }, 1000);
}

// Random one of the 3 values corresponding to the rock paper scissors and play the corresponding video.
// After finish the video -> check the player's results and notify to the screen
function startRound() {
  console.log(iosParam);

  const computerResult = ["Paper", "Rock", "Scissors"];
  const index = Math.floor(Math.random() * computerResult.length);
  switch (computerResult[index]) {
    case "Paper":
      videoContentEl.innerHTML = `<video id="computer_video" ${iosParam}><source src="https://storage.cloud.google.com/khanhlvg_ml/rock_paper_scissor/paper.mp4" autoplay muted playsinline type="video/mp4" /></video>`;
      break;
    case "Rock":
      videoContentEl.innerHTML = `<video id="computer_video" ${iosParam}><source src="https://storage.googleapis.com/khanhlvg_ml/rock_paper_scissor/rock.mp4" type="video/mp4" /></video>`;
      break;
    case "Scissors":
      videoContentEl.innerHTML = `<video id="computer_video" ${iosParam}><source src="https://storage.googleapis.com/khanhlvg_ml/rock_paper_scissor/scissor.mp4"  type="video/mp4" /></video>`;
      break;
  }

  const vid = document.getElementById("computer_video");
  vid.play();
  vid.onplaying = function () {
    setTimeout(function () {
      checkResult((result, image) => {
        if (result == null) {
          resultEl.innerText = "Cannot detect hand";
        } else {
          if (result.categoryName == "None") {
            resultEl.innerText = "Invalid gesture detected";
          } else if (computerResult[index] == result.categoryName) {
            resultEl.innerHTML =
              'Draw <p class="hand_detect_text"> You chose: ' +
              result.categoryName +
              "</p>";
          } else if (
            (computerResult[index] == "Paper" &&
              result.categoryName == "Rock") ||
            (computerResult[index] == "Rock" &&
              result.categoryName == "Scissors") ||
            (computerResult[index] == "Scissors" &&
              result.categoryName == "Paper")
          ) {
            resultEl.innerHTML =
              'Computer wins <p class="hand_detect_text"> You chose: ' +
              result.categoryName +
              "</p>";
            computerScore += 1;
            computerResultEl.innerText = computerScore.toString();
          } else {
            resultEl.innerHTML =
              'You win! <p class="hand_detect_text">You chose: ' +
              result.categoryName +
              "</p>";

            yourScore += 1;
            yourResultEl.innerText = yourScore.toString();
          }
        }
        resultEl.style.display = initialState;
        nexRoundEl.style.display = initialState;
        captureImageEl.style.display = initialState;
        captureImageEl.src = image;
        setTimeout(function () {
          resultEl.style.display = noneState;
          nexRoundEl.style.display = noneState;
          captureImageEl.style.display = noneState;
          state = waitHands;
          videoContentEl.innerHTML = "<p>?</p>";
        }, 5000);
      });
    }, 2500);
  };
}

// Change UI after finish load model
function loadModelFinish() {
  beginBtnEl.style.display = initialState;
  loadingEl.innerText = "Load completed";
  loadViewEl.style.display = noneState;
}

// Restart data
function restart() {
  yourScore = 0;
  computerScore = 0;
  frameNoHands = 0;
  computerResultEl.innerText = computerScore.toString();
  yourResultEl.innerText = yourScore.toString();
  state = waitHands;
  showHandViewEl.style.display = initialState;
  restartButtonEl.style.display = noneState;
}

// Load GestureRecognizer
const loadGestureRecognizer = async () => {
  checkOS();

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://assets.codepen.io/9177687/rock_paper_scissor.task",
      numHands: 1
    }
  });
  loadModelFinish();
}

loadGestureRecognizer();
