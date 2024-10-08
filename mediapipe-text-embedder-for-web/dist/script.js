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
import { MDCTextField } from "https://cdn.skypack.dev/@material/textfield";
import text from "https://cdn.skypack.dev/@mediapipe/tasks-text@0.10.0";
const { TextEmbedder, FilesetResolver, TextEmbedderResult } = text;
const demosSection = document.getElementById("demos");
let textEmbedder;
// Before we can use TextEmbedder class we must wait for it to finish loading.
async function createEmbedder() {
    const textFiles = await FilesetResolver.forTextTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@0.10.0/wasm");
    textEmbedder = await TextEmbedder.createFromOptions(textFiles, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/text_embedder/universal_sentence_encoder/float32/1/universal_sentence_encoder.tflite`
        }
    });
    demosSection.classList.remove("invisible");
}
createEmbedder();
const textInput1 = new MDCTextField(document.getElementById("textField1"));
const textInput2 = new MDCTextField(document.getElementById("textField2"));
const calculateBt = document.getElementById("calculate");
const resultLB = document.getElementById("result");
calculateBt.addEventListener("click", calculateSimilarity);
async function calculateSimilarity() {
    const text1 = textInput1.value;
    const text2 = textInput2.value;
    if (text1 == "" || text2 == "") {
        alert("Please enter text in both boxes to compare");
        return;
    }
    resultLB.innerText = "Computing similarity...";
    // Wait to run the function until inner text is set
    await sleep(5);
    const embeddingResult1 = await textEmbedder.embed(text1);
    const embeddingResult2 = await textEmbedder.embed(text2);
    // Compute cosine similarity.
    const similarity = TextEmbedder.cosineSimilarity(embeddingResult1.embeddings[0], embeddingResult2.embeddings[0]);
    resultLB.innerText = similarity.toFixed(2);
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}