/* Copyright 2023 The MediaPipe Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */
import { MDCTextField } from "https://cdn.skypack.dev/@material/textfield";
import { LanguageDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@0.10.0";
// Create the LanguageDetector object upon page load
let languageDetector;
const createLanguageDetector = async () => {
    const text = await FilesetResolver.forTextTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@0.10.0/wasm");
    languageDetector = await LanguageDetector.createFromOptions(text, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/language_detector/language_detector/float32/1/language_detector.tflite`
        },
        maxResults: 5
    });
};
createLanguageDetector();
const textField = new MDCTextField(document.querySelector(".mdc-text-field"));
const defaultText = "日本語は、日本国内や、かつての日本領だった国、そして国外移民や移住者を含む日本人同士の間で使用されている言語。日本は法令によって公用語を規定していないが、法令その他の公用文は全て日本語で記述され、各種法令において日本語を用いることが規定され、学校教育においては「国語」の教科として学習を行うなど、事実上日本国内において唯一の公用語となっている。";
// Get the required elements
const input = document.getElementById("input");
const output = document.getElementById("output");
const submit = document.getElementById("submit");
const defaultTextButton = document.getElementById("populate-text");
// Add a button click listener to add the default text
defaultTextButton.addEventListener("click", () => {
    input.value = defaultText;
});
// Add a button click listener that classifies text on click
submit.addEventListener("click", async () => {
    if (input.value === "") {
        alert("Please write some text, or click 'Populate text' to add text");
        return;
    }
    output.innerText = "Detecting language...";
    await sleep(5);
    const result = await languageDetector.detect(input.value);
    displayDetectionResult(result);
});
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// Iterate through the detected languages in the LanguageDetectorResult object, then display them in #output
function displayDetectionResult(result) {
    if (result.languages.length > 0) {
        output.innerText = "";
    }
    else {
        output.innerText = "Result is empty";
    }
    for (const language of result.languages) {
        const categoryDiv = document.createElement("div");
        categoryDiv.innerText = `${language.languageCode}: ${language.probability.toFixed(2)}`;
        output.appendChild(categoryDiv);
    }
}