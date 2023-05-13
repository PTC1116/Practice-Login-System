// Select DOM elements
const startBtn = document.querySelector(".startBtn");
const start = document.querySelector(".start");
const intro = document.querySelector(".intro");
const content = document.querySelector(".content");
const okBtn = document.querySelector(".okBtn");
const question = document.querySelector(".question");
const btn = document.querySelectorAll(".choiceBtn");
const nextBtn = document.querySelector(".nextBtn");
const choices = document.querySelector(".choices");
const result = document.querySelector(".result");
const resultSubtitle = document.querySelector(".resultSubtitle");
const resultDetails = document.querySelector(".resultDetails");
const wrap = document.querySelector(".wrap");
const againBtn = document.querySelector(".againBtn");

const totalQuestionCount = 6;

// Initialize variables
let questionData = [];
let vocabData = [];
let resultData = [];
let questionNum = 0;
let randomQuestion = 0;
let choiceIndexes = [];
let questionCount = 0;
let selectedNum = "";
let answerNum = "";
let score = 0;
let correctAnsCount = 0; //counts the number of times a user is correct

function fetchData() {
  // Use axios to fetch data
  let endpoints = [
    "https://ptc1116.github.io/questionList.json",
    "https://ptc1116.github.io/vocabList.json",
  ];

  axios
    .all(endpoints.map((endpoint) => axios.get(endpoint)))
    .then((res) => {
      //Store data in variables
      questionData = res[0].data;
      vocabData = res[1].data;
      generateQuestionAndChoices();
    })
    // Handle any errors
    .catch((error) => {
      alert.error("ERROR");
    });
}
function generateQuestionAndChoices() {
  // Generate the question
  randomQuestion = getRandomQuestionIndexes(questionData.length);
  question.textContent = questionData[randomQuestion].question;
  // Store the "num" property of the question
  questionNum = questionData[randomQuestion].num;
  // Push the index of the correct answer into the array "choiceIndexes"
  choiceIndexes.push(questionNum);
  getRandomChoiceIndexes(choiceIndexes, vocabData.length);
  shuffleArray(choiceIndexes);
  // Generate choices
  btn.forEach((item, index) => {
    item.textContent = vocabData[choiceIndexes[index]].vocab;
    item.setAttribute("data-Num", vocabData[choiceIndexes[index]].num);
  });
}

// Generate 1 random number
function getRandomQuestionIndexes(questionDataLen) {
  return Math.floor(Math.random() * questionDataLen);
}

// Generatre n random numbers
function getRandomChoiceIndexes(array, vocabDataLen) {
  let n = 0;
  while (n < 3) {
    let random = Math.floor(Math.random() * vocabDataLen);
    if (array.includes(random)) {
      n--;
    } else {
      array.push(random);
    }
    n++;
  }
}

// shuffle arrays
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Reset the buttons for the next question
function reset() {
  // Remove the question to avoid repetition
  questionData.splice(randomQuestion, 1);
  // Clear the choiceIndexs array
  choiceIndexes = [];
  btn.forEach((btn) => {
    btn.classList.remove("green", "red");
    btn.style.pointerEvents = "auto";
  });
  nextBtn.classList.add("visibilityHidden");
  choices.classList.remove("disabled");
}

function recordResult() {
  let obj = {};
  obj.question = questionData[randomQuestion].question;
  obj.correctAns = vocabData[questionNum].vocab;
  obj.playerAns = vocabData[selectedNum].vocab;
  obj.correctAnsDef = vocabData[questionNum].def;
  obj.playerAnsDef = vocabData[selectedNum].def;
  resultData.push(obj);
}

function clacScore() {
  resultData.forEach((item) => {
    if (item.correctAns === item.playerAns) {
      score += 5;
    } else {
      score += 3;
    }
  });
}

function sendScore() {
  axios.post("http://localhost:3600/game", { score: score });
}

function printResult() {
  resultSubtitle.textContent = `${correctAnsCount} of ${totalQuestionCount} Questions answered correctly`;
  let str = "";
  resultData.forEach(function (item, index) {
    if (item.correctAns === item.playerAns) {
      str += `<span><p><strong>Question ${index + 1}:</strong> ${
        item.question
      }</p>
        <p><strong>Correct Answer:</strong> ${item.correctAns} (${
        item.correctAnsDef
      })</p>
      <p><strong>Your Answer:</strong> ${item.playerAns} (${
        item.playerAnsDef
      })</p>
      <hr></span>`;
    } else {
      str += `<span class = "wrong"><p><strong>Question ${
        index + 1
      }:</strong> ${item.question}</p>
      <p><strong>Correct Answer:</strong> ${item.correctAns} (${
        item.correctAnsDef
      })</p>
      <p><strong>Your Answer:</strong> ${item.playerAns} (${
        item.playerAnsDef
      })</p>
      <hr></span>`;
    }
  });
  resultDetails.innerHTML = str;
}

function startNewRound() {
  resultData = [];
  questionCount = 0;
  correctAnsCount = 0;
  choiceIndexes = [];
  score = 0;
}

fetchData();

// Event listener for start button
startBtn.addEventListener("click", (e) => {
  intro.classList.remove("hide");
  start.classList.add("hide");
});

// Event listener for ok button
okBtn.addEventListener("click", (e) => {
  content.classList.remove("hide");
  intro.classList.add("hide");
});

// Event listener for next button
nextBtn.addEventListener("click", (e) => {
  // Reset the answer area
  reset();
  // Generate new question and choices
  generateQuestionAndChoices();
  questionCount++;
  // If all questions have been asked, hide content section
  if (questionCount === totalQuestionCount) {
    content.classList.add("hide");
    result.classList.remove("hide");
    wrap.classList.add("heightAuto");
    clacScore();
    sendScore();
    printResult();
    // Initialize variables before new Round
    startNewRound();
  }
});

// Event listener for choices buttons
choices.addEventListener("click", (e) => {
  if (e.target.nodeName === "BUTTON") {
    // Stop hover effect
    btn.forEach((item) => (item.style.pointerEvents = "none"));
    // Highlight the selected choice
    selectedNum = parseInt(e.target.getAttribute("data-Num"), 10);
    answerNum = questionNum;
    if (selectedNum === answerNum) {
      e.target.classList.add("green");
      correctAnsCount++;
    } else {
      e.target.classList.add("red");
      btn.forEach((item) => {
        if (parseInt(item.getAttribute("data-Num")) === answerNum) {
          item.classList.add("green");
        }
      });
    }
    recordResult();
    nextBtn.classList.remove("visibilityHidden");
  }
});

againBtn.addEventListener("click", (e) => {
  wrap.classList.remove("heightAuto");
  result.classList.add("hide");
  start.classList.remove("hide");
  fetchData();
});
