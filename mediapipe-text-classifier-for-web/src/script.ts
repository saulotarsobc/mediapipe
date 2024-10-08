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
import {
  TextClassifier,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@0.10.0";

const textField = new MDCTextField(document.querySelector(".mdc-text-field"));
const defaultText =
  "But soft, what light through yonder window breaks? \n \
It is the East, and Juliet is the sun.\n \
Arise, fair sun, and kill the envious moon,\n \
Who is already sick and pale with grief\n \
That thou, her maid, art far more fair than she.\n \
Be not her maid since she is envious.\n \
Her vestal livery is but sick and green,\n \
And none but fools do wear it. Cast it off.\n \
It is my lady. O, it is my love!\n \
O, that she knew she were!\n othing. What of that?\n \
Her eye discourses; I will answer it.";

// Get the required elements
const input = document.getElementById("input") as HTMLInputElement;
const output = document.getElementById("output") as HTMLElement;
const submit = document.getElementById("submit") as HTMLButtonElement;
const defaultTextButton = document.getElementById(
  "populate-text"
) as HTMLButtonElement;
const demosSection: HTMLElement = document.getElementById("demos");

let textClassifier: TextClassifier;
// Create the TextClassifier object upon page load
const createTextClassifier = async () => {
  const text = await FilesetResolver.forTextTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@0.10.0/wasm"
  );
  textClassifier = await TextClassifier.createFromOptions(text, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/text_classifier/bert_classifier/float32/1/bert_classifier.tflite`
    },
    maxResults: 5
  });

  // Show demo section now model is ready to use.
  demosSection.classList.remove("invisible");
};
createTextClassifier();

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

  output.innerText = "Classifying...";

  await sleep(5);
  const result = textClassifier.classify(
    input.value
  );
  displayClassificationResult(result);
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Iterate through the sentiment categories in the TextClassifierResult object, then display them in #output
function displayClassificationResult(result: TextClassifierResult) {
  if (result.classifications[0].categories.length > 0) {
    output.innerText = "";
  } else {
    output.innerText = "Result is empty";
  }
  const categories: string[] = [];
  // Single-head model.
  for (const category of result.classifications[0].categories) {
    const categoryDiv = document.createElement("div");
    categoryDiv.innerText = `${category.categoryName}: ${category.score.toFixed(
      2
    )}`;
    // highlight the likely category
    if (category.score.toFixed(2) > 0.5) {
      categoryDiv.style.color = "#12b5cb";
    }
    output.appendChild(categoryDiv);
  }
}
