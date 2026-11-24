
const reviews = [
  { name: "المراجعة الأولى", pages: "1–20" },
  { name: "المراجعة الثانية", pages: "21–40" },
  { name: "المراجعة الثالثة", pages: "41–69" }
];

let currentReview = 0;
let currentIndex = 0;
let selectedAnswers = {};
let reviewScores = {};

const $ = id => document.getElementById(id);

function showOnly(id) {
  ["home", "quiz", "result", "results"].forEach(x =>
    $(x).classList.add("hidden")
  );
  $(id).classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderReviews() {
  $("reviews").innerHTML = "";

  reviews.forEach((review, index) => {
    const count = questions.filter(q => q.review === index).length;
    const div = document.createElement("div");
    div.className = "review";

    const info = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = review.name;

    const details = document.createElement("span");
    details.className = "muted";
    details.textContent = `الصفحات ${review.pages} · ${count} سؤال`;

    info.append(title, details);

    const button = document.createElement("button");
    button.textContent = "ابدأ";
    button.onclick = () => startReview(index);

    div.append(info, button);
    $("reviews").appendChild(div);
  });
}

function startReview(index) {
  currentReview = index;
  currentIndex = 0;
  selectedAnswers = {};
  showOnly("quiz");
  renderQuestion();
}

function getCurrentQuestions() {
  return questions.filter(q => q.review === currentReview);
}

function renderQuestion() {
  const list = getCurrentQuestions();
  const q = list[currentIndex];

  if (!q) {
    finishReview();
    return;
  }

  $("reviewTitle").textContent = reviews[currentReview].name;
  $("counter").textContent = `${currentIndex + 1} / ${list.length}`;
  $("progress").style.width =
    `${((currentIndex + 1) / list.length) * 100}%`;

  $("questionId").textContent = q.id || "";
  $("questionPage").textContent = q.page ? `صفحة ${q.page}` : "";
  $("question").textContent = q.text;

  $("answers").innerHTML = "";
  $("feedback").innerHTML = "";
  $("next").disabled = true;

  $("next").textContent =
    currentIndex === list.length - 1 ? "إنهاء المراجعة" : "التالي";

  if (q.options && q.options.length) {
    $("writtenWrap").classList.add("hidden");
    $("answers").classList.remove("hidden");

    q.options.forEach((option, i) => {
      const button = document.createElement("button");
      button.className = "answer";

      const number = document.createElement("span");
      number.className = "number";
      number.textContent = i + 1;

      const text = document.createElement("span");
      text.textContent = option;

      button.append(number, text);
      button.onclick = () => chooseAnswer(i + 1);

      $("answers").appendChild(button);
    });
  } else {
    $("answers").classList.add("hidden");
    $("writtenWrap").classList.remove("hidden");
    $("writtenAnswer").value =
      selectedAnswers[currentIndex]?.text || "";
    $("next").disabled = false;
  }
}

function chooseAnswer(number) {
  const q = getCurrentQuestions()[currentIndex];

  if (selectedAnswers[currentIndex]) return;

  selectedAnswers[currentIndex] = { answer: number };

  const buttons = $("answers").querySelectorAll("button");

  buttons.forEach((button, i) => {
    button.disabled = true;

    if (q.correct === i + 1) {
      button.classList.add("correct");
    }

    if (number === i + 1 && number !== q.correct) {
      button.classList.add("wrong");
    }
  });

  if (!q.correct) {
    $("feedback").innerHTML =
      `<div class="feedback">تم تسجيل إجابتك، لكن لا يوجد مفتاح تصحيح لهذا السؤال.</div>`;
  } else if (number === q.correct) {
    $("feedback").innerHTML =
      `<div class="feedback good">✅ إجابتك صحيحة!</div>`;
  } else {
    $("feedback").innerHTML =
      `<div class="feedback bad">❌ إجابتك غلط! الإجابة الصحيحة: ${q.options[q.correct - 1]}</div>`;
  }

  $("next").disabled = false;
}

function nextQuestion() {
  const list = getCurrentQuestions();
  const q = list[currentIndex];

  if (!q.options || !q.options.length) {
    selectedAnswers[currentIndex] = {
      text: $("writtenAnswer").value
    };
  }

  if (currentIndex < list.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    finishReview();
  }
}

function finishReview() {
  const list = getCurrentQuestions();
  let correct = 0;
  let checked = 0;

  list.forEach((q, i) => {
    const answer = selectedAnswers[i];

    if (answer && q.correct && answer.answer) {
      checked++;
      if (answer.answer === q.correct) correct++;
    }
  });

  reviewScores[currentReview] = {
    correct,
    checked,
    total: list.length
  };

  $("score").textContent = `${correct} / ${checked}`;
  $("summary").textContent =
    `أجبت عن ${Object.keys(selectedAnswers).length} من ${list.length} سؤالاً.`;

  showOnly("result");
}

function goHome() {
  showOnly("home");
}

function showResults() {
  $("allResults").innerHTML = "";

  reviews.forEach((review, index) => {
    const score = reviewScores[index];
    const div = document.createElement("div");
    div.className = "result-row";

    const name = document.createElement("b");
    name.textContent = review.name;

    const value = document.createElement("span");
    value.textContent = score
      ? `${score.correct} / ${score.checked}`
      : "لم تبدأ بعد";

    div.append(name, value);
    $("allResults").appendChild(div);
  });

  showOnly("results");
}

renderReviews();
