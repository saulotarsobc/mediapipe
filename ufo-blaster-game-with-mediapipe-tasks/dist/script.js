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
import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
/**********************************************
 * Game Models
 **********************************************/
class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}
class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update(ctx) {
        this.draw(ctx);
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update(ctx) {
        this.draw(ctx);
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    update(ctx) {
        this.draw(ctx);
        // Slow fown
        this.velocity.x *= 0.99;
        this.velocity.y *= 0.99;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}
class GameBoard {
    constructor(canvas, ctx, onGameOver, width = window.innerWidth, height = window.innerHeight) {
        this.projectiles = [];
        this.enemies = [];
        this.particles = [];
        this.gameLevel = {
            1: 4000,
            2: 3000,
            3: 2000,
            4: 1000,
            5: 800,
            6: 600,
            7: 500,
            8: 400,
            9: 300,
            other: 300
        };
        this.currentLevel = 1;
        this.spawmEnemies = () => {
            this.spawmEnemiesInterval = setInterval(() => {
                const radius = Math.random() * (30 - 4) + 10;
                let x;
                let y;
                if (Math.random() < 0.5) {
                    x = Math.random() < 0.5 ? 0 - radius : this.gameCanvas.width + radius;
                    y = Math.random() * this.gameCanvas.height;
                }
                else {
                    x = Math.random() * this.gameCanvas.width;
                    y = Math.random() < 0.5 ? 0 - radius : this.gameCanvas.height + radius;
                }
                const angel = Math.atan2(this.gameCanvas.height / 2 - y, this.gameCanvas.width / 2 - x);
                const velocity = {
                    x: Math.cos(angel),
                    y: Math.sin(angel)
                };
                this.enemies.push(new Enemy(x, y, radius, `hsl(${Math.random() * 360}, 50%, 50%)`, velocity));
            }, 
            // Time of spawm enemies follow the gameLevel
            // this.gameLevel[(this.score / 1000).toFixed(0)] || this.gameLevel['other']);
            this.gameLevel[this.currentLevel] || this.gameLevel['other']);
        };
        this.start = () => {
            this.init();
            this.run();
            this.spawmEnemies();
            this.updateScore();
        };
        this.run = () => {
            this.animateObj = requestAnimationFrame(this.run);
            this.ctxGame.fillStyle = 'rgba(0,0,0,0.1)';
            this.ctxGame.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
            this.player.draw(this.ctxGame);
            this.updateScore();
            this.particles.forEach((particle, index) => {
                if (particle.alpha <= 0) {
                    this.particles.splice(index, 1);
                }
                else {
                    particle.update(this.ctxGame);
                }
            });
            this.projectiles.forEach((projectile, index) => {
                projectile.update(this.ctxGame);
                // Clear projectiles from edges screen
                if (projectile.x + projectile.radius < 0 ||
                    projectile.x - projectile.radius > this.gameCanvas.width ||
                    projectile.y + projectile.radius < 0 ||
                    projectile.y - projectile.radius > this.gameCanvas.height) {
                    setTimeout(() => {
                        this.projectiles.splice(index, 1);
                    }, 0);
                }
            });
            this.enemies.forEach((enemy, index) => {
                enemy.update(this.ctxGame);
                const distancePlayer = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
                if (distancePlayer - enemy.radius - this.player.radius < 1) {
                    cancelAnimationFrame(this.animateObj);
                    // Execute onGameOver
                    if (this.onGameOver) {
                        this.onGameOver(this.score);
                    }
                    this.clearSpawmEnemier();
                }
                this.projectiles.forEach((projectile, indexPro) => {
                    const distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
                    // When projectile touch enemy
                    if (distance - enemy.radius - projectile.radius < 1) {
                        // Create explosions
                        for (let i = 0; i < enemy.radius * 2; i++) {
                            this.particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                                x: (Math.random() - 0.5) * (Math.random() * 6),
                                y: (Math.random() - 0.5) * (Math.random() * 6)
                            }));
                        }
                        if (enemy.radius - 6 > 10) {
                            // Decrease enemy radius
                            window['gsap'].to(enemy, {
                                radius: enemy.radius - 6
                            });
                            this.score += 10;
                            setTimeout(() => {
                                this.projectiles.splice(indexPro, 1);
                            }, 0);
                        }
                        else {
                            // Remove enemy
                            this.score += 20;
                            setTimeout(() => {
                                this.enemies.splice(index, 1);
                                this.projectiles.splice(indexPro, 1);
                            }, 0);
                        }
                        // this.updateScore();
                    }
                });
            });
        };
        this.createProjectile = (x, y) => {
            const angel = Math.atan2(y - this.gameCanvas.height / 2, x - this.gameCanvas.width / 2);
            const velocity = {
                x: Math.cos(angel) * 6,
                y: Math.sin(angel) * 6
            };
            this.projectiles.push(new Projectile(this.gameCanvas.width / 2, this.gameCanvas.height / 2, 5, '#ffffff', velocity));
            // Decrease score when fight projectile
            this.score -= 1;
            // this.updateScore();
        };
        this.updateScore = () => {
            this.ctxGame.font = '20px sans-serif';
            this.ctxGame.textBaseline = 'top';
            this.ctxGame.fillStyle = '#FFFFFF';
            this.ctxGame.fillText(`Score: ${this.score} - Current level: ${this.currentLevel}`, 16, 16);
            // When score reaching each 1000 point, updating game level, level 9 is maximum level
            if (this.currentLevel < 9 && this.score > this.currentLevel * 1000) {
                this.currentLevel += 1;
                this.clearSpawmEnemier();
                this.spawmEnemies();
            }
        };
        this.gameCanvas = canvas;
        this.ctxGame = ctx;
        // this.scoreEl = scoreEl;
        this.onGameOver = onGameOver;
        this.width = width;
        this.height = height;
        this.gameCanvas.width = this.width;
        this.gameCanvas.height = this.height;
        this.player = new Player(this.gameCanvas.width / 2, this.gameCanvas.height / 2, 20, '#ffffff');
        this.score = 20;
        this.currentLevel = 1;
    }
    init() {
        this.player = new Player(this.gameCanvas.width / 2, this.gameCanvas.height / 2, 20, '#ffffff');
        this.projectiles = [];
        this.enemies.length = 0;
        this.particles = [];
        this.score = 20;
        this.currentLevel = 1;
    }
    clearSpawmEnemier() {
        if (this.spawmEnemiesInterval) {
            clearInterval(this.spawmEnemiesInterval);
        }
    }
    changesize(width = window.innerWidth, height = window.innerHeight) {
        this.width = width;
        this.height = height;
        this.gameCanvas.width = this.width;
        this.gameCanvas.height = this.height;
        this.player.x = this.gameCanvas.width / 2;
        this.player.y = this.gameCanvas.height / 2;
    }
}
/**********************************************
 * FaceDetector Model
 **********************************************/
export class FaceDetector {
    constructor(faceLandmarker, cameraEl, canvasEl, width = 720, height = 480) {
        this.draw = (results, cameraEl) => {
            this.canvasCtx.save();
            this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvasCtx.drawImage(cameraEl, 0, 0, this.canvas.width, this.canvas.height);
            if (results.faceLandmarks.length) {
                const facePoints = [
                    // Face oval
                    // results.multiFaceLandmarks[0][10],
                    // results.multiFaceLandmarks[0][323],
                    // results.multiFaceLandmarks[0][93],
                    // results.multiFaceLandmarks[0][152],
                    results.faceLandmarks[0][8], // between eyes 168, 8, 9
                    // Lips inner
                    // results.multiFaceLandmarks[0][78],
                    // results.multiFaceLandmarks[0][13],
                    // results.multiFaceLandmarks[0][308],
                    // results.multiFaceLandmarks[0][14],
                ];
                // Example draw key points
                for (const key of facePoints) {
                    this.canvasCtx.beginPath();
                    this.canvasCtx.arc(key.x * this.cameraWidth, key.y * this.cameraHeight, 4, 0, 2 * Math.PI);
                    this.canvasCtx.fillStyle = '#30FF30';
                    this.canvasCtx.fill();
                }
            }
            this.canvasCtx.restore();
            this.onResults(results);
        };
        this.cameraEl = cameraEl;
        this.faceLandmarker = faceLandmarker;
        this.cameraWidth = window.innerWidth < window.innerHeight ? height : width;
        this.cameraHeight = window.innerWidth < window.innerHeight ? width : height;
        this.canvas = canvasEl;
        this.canvas.width = this.cameraWidth;
        this.canvas.height = this.cameraHeight;
        this.canvasCtx = this.canvas.getContext('2d');
    }
}
/**********************************************
 * Main
 **********************************************/
const MDCSlider = mdc.slider.MDCSlider;
const videoElement = document.getElementById('input-video');
const canvasElement = document.getElementById('output-canvas');
const outputScreen = document.getElementsByClassName('output-screen')[0];
const startBtn = document.getElementsByClassName('start-btn')[0];
const scoreDialog = document.getElementsByClassName('score-dialog')[0];
const scorePoint = document.getElementsByClassName('score-point')[0];
const CAMERA_WIDTH = 720;
const CAMERA_HEIGHT = 480;
const MOVEMENT_SCALE = 3;
let SCREEN_WIDTH = 720;
let SCREEN_HEIGHT = 480;
const FRAME_TO_FIGHT = 6;
// Controller
const sliderMovementScale = new MDCSlider(document.querySelector('.slider-movement-scale'));
const txtMovementScale = document.getElementsByClassName('slider-movement-scale-value')[0];
// Controller events
sliderMovementScale.listen('MDCSlider:change', () => {
    txtMovementScale.innerHTML = `${sliderMovementScale.getValue()}`;
});
// Set default thresholds
sliderMovementScale.setValue(MOVEMENT_SCALE);
// Mouse move controller variable
let startPoint = null;
let prevPoint = null;
// Frames to fight projectile
let frameToFight = FRAME_TO_FIGHT;
// Game controller
let isGameRunning = false;
// Detect width of simulation screen depend on the device
const detectSimulationScreen = () => {
    if (outputScreen) {
        SCREEN_WIDTH = outputScreen.offsetWidth - 2; // 2px of borders
        SCREEN_HEIGHT = outputScreen.offsetHeight - 2;
    }
};
detectSimulationScreen();
const distance2Points = (point1, point2) => {
    return Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2 + (point2.z - point1.z) ** 2);
};
const moveDistance = (point1, point2) => {
    return {
        moveX: point2.x - point1.x,
        moveY: point2.y - point1.y
    };
};
const getMovementScale = (point1, point2) => {
    const scaleRatio = sliderMovementScale.getValue();
    return {
        newX: (point2.x - point1.x) * scaleRatio,
        newY: (point2.y - point1.y) * scaleRatio
    };
};
const detectMovement = (newPoint) => {
    if (!startPoint || !startPoint['x'] || !startPoint['y']) {
        startPoint = { x: newPoint.x, y: newPoint.y };
        prevPoint = { x: newPoint.x, y: newPoint.y };
        return prevPoint;
    }
    // const movement = moveDistance(prevPoint, newPoint);
    const movement = getMovementScale(startPoint, newPoint);
    prevPoint.x = startPoint.x + movement.newX;
    prevPoint.y = startPoint.y + movement.newY;
    return {
        x: prevPoint['x'],
        y: prevPoint['y']
    };
};
const detectMouthOpen = (landmarks) => {
    return distance2Points(landmarks[0][13], landmarks[0][14]) > 0.02;
};
function onResults(results) {
    if (results.faceLandmarks.length) {
        const isOpenMouth = detectMouthOpen(results.faceLandmarks);
        const { x, y } = detectMovement(results.faceLandmarks[0][8]);
        const newX = window.innerWidth - (x * window.innerWidth); // Mirror camera
        const newY = y * window.innerHeight;
        // Draw green point when game running
        if (isGameRunning) {
            ctxGame.beginPath();
            ctxGame.arc(newX, newY, 4, 0, 2 * Math.PI);
            ctxGame.fillStyle = '#30FF30';
            ctxGame.fill();
            if (isOpenMouth) {
                frameToFight += 1;
                if (frameToFight > FRAME_TO_FIGHT) {
                    gameBoard.createProjectile(newX, newY);
                    frameToFight = 0;
                }
            }
            else {
                frameToFight = FRAME_TO_FIGHT;
            }
        }
    }
}
;
let faceDetector;
async function createFaceDetector() {
    console.log("Loading face landmarker model.");
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm');
    const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        },
        runningMode: 'VIDEO',
        outputFaceBlendshapes: true,
        numFaces: 1
    });
    console.log("Face landmarker model loaded successfully.");
    faceDetector = new FaceDetector(faceLandmarker, videoElement, canvasElement, CAMERA_WIDTH, CAMERA_HEIGHT);
    faceDetector.onResults = onResults;
}
createFaceDetector();
// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
// getUsermedia parameters.
const constraints = {
    video: true
};
// Activate the webcam stream.
navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    videoElement.srcObject = stream;
    videoElement.addEventListener('loadeddata', predictWebcam);
});
async function predictWebcam() {
    let nowInMs = Date.now();
    if (!faceDetector) {
        window.requestAnimationFrame(predictWebcam);
        return;
    }
    const results = await faceDetector.faceLandmarker.detectForVideo(videoElement, nowInMs);
    faceDetector.draw(results, videoElement);
    window.requestAnimationFrame(predictWebcam);
}
// Game
const gameCanvas = document.getElementById('game-canvas');
const ctxGame = gameCanvas.getContext('2d');
const gameOverFunc = (score) => {
    isGameRunning = false;
    scorePoint.innerHTML = `${score}`;
    scoreDialog.style.display = 'block';
};
const gameBoard = new GameBoard(gameCanvas, ctxGame, gameOverFunc);
startBtn.addEventListener('click', () => {
    isGameRunning = true;
    gameBoard.start();
    scoreDialog.style.display = 'none';
});
window.addEventListener('resize', resizeGameBoard, false);
function resizeGameBoard() {
    gameBoard.changesize();
}