(() => {
  "use strict";

  const curriculum = {
    "Number Sense": [
      "Counting & Number Recognition",
      "Place Value",
      "Comparing Numbers",
      "Rounding & Estimation",
      "Even & Odd Numbers",
      "Factors & Multiples"
    ],
    "Addition & Subtraction": [
      "Addition Within 20",
      "Addition Within 100",
      "Multi-Digit Addition",
      "Subtraction Within 20",
      "Subtraction Within 100",
      "Multi-Digit Subtraction",
      "Word Problems"
    ],
    "Multiplication & Division": [
      "Multiplication Facts",
      "Two-Digit Multiplication",
      "Division Facts",
      "Long Division",
      "Order of Operations",
      "Multiplication & Division Word Problems"
    ],
    "Fractions": [
      "Fraction Basics",
      "Equivalent Fractions",
      "Comparing Fractions",
      "Adding Fractions",
      "Subtracting Fractions",
      "Multiplying Fractions",
      "Dividing Fractions",
      "Mixed Numbers"
    ],
    "Decimals": [
      "Decimal Place Value",
      "Comparing Decimals",
      "Adding Decimals",
      "Subtracting Decimals",
      "Multiplying Decimals",
      "Dividing Decimals",
      "Fractions & Decimals"
    ],
    "Ratios & Percent": [
      "Ratios",
      "Rates",
      "Proportions",
      "Percents",
      "Percent of a Number",
      "Percent Word Problems"
    ],
    "Geometry": [
      "Lines & Angles",
      "2D Shapes",
      "Perimeter",
      "Area",
      "Volume",
      "Coordinate Plane"
    ],
    "Pre-Algebra": [
      "Integers",
      "Expressions",
      "Order of Operations",
      "One-Step Equations",
      "Two-Step Equations",
      "Inequalities",
      "Patterns",
      "Functions",
      "Graphing Linear Relationships"
    ]
  };

  const allSkills = Object.values(curriculum).flat();
  const skills = {};

  allSkills.forEach(skill => {
    skills[skill] = { mastery: 0, attempts: 0, correct: 0 };
  });

  let selectedTopic = Object.keys(curriculum)[0];
  let activeSkill = null;
  let currentQuestion = null;
  let xp = 0;
  let streak = 0;
  let nextQuestionTimer = null;

  const $ = id => document.getElementById(id);

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function saveProgress() {
    try {
      localStorage.setItem("mathQuestProgress", JSON.stringify({
        skills,
        xp,
        streak
      }));
    } catch (_) {
      // The game still works if storage is unavailable.
    }
  }

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem("mathQuestProgress") || "null");
      if (!saved) return;

      xp = Number(saved.xp) || 0;
      streak = Number(saved.streak) || 0;

      if (saved.skills && typeof saved.skills === "object") {
        allSkills.forEach(skill => {
          if (saved.skills[skill]) {
            skills[skill] = {
              mastery: Number(saved.skills[skill].mastery) || 0,
              attempts: Number(saved.skills[skill].attempts) || 0,
              correct: Number(saved.skills[skill].correct) || 0
            };
          }
        });
      }
    } catch (_) {
      // Ignore corrupted or unavailable saved data.
    }
  }

  function updateStats() {
    const values = Object.values(skills);
    const mastery = values.length
      ? Math.round(values.reduce((sum, skill) => sum + skill.mastery, 0) / values.length)
      : 0;

    $("xp").textContent = xp;
    $("streak").textContent = streak;
    $("mastery").textContent = `${mastery}%`;
    saveProgress();
  }

  function renderTopics() {
    const container = $("topics");
    container.innerHTML = "";

    Object.keys(curriculum).forEach(topic => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `topic${topic === selectedTopic ? " active" : ""}`;
      button.textContent = topic;

      button.addEventListener("click", () => {
        selectedTopic = topic;
        renderTopics();
        renderCurriculum();
      });

      container.appendChild(button);
    });
  }

  function renderCurriculum() {
    $("practice").classList.add("hidden");
    $("curriculum").classList.remove("hidden");

    const lessons = curriculum[selectedTopic];
    const panel = $("curriculum");

    panel.innerHTML = `
      <h2>${selectedTopic}</h2>
      <p class="muted">
        Complete lessons to build mastery. Math Quest adapts practice to each skill.
      </p>
      <div class="lesson-grid" id="lessonGrid"></div>
    `;

    const grid = $("lessonGrid");

    lessons.forEach((skill, index) => {
      const data = skills[skill];
      const state =
        data.mastery >= 80 ? "🏆 Mastered" :
        data.mastery >= 50 ? "🟢 Developing" :
        "🔵 Ready";

      const card = document.createElement("article");
      card.className = "lesson";

      card.innerHTML = `
        <span class="pill">Lesson ${index + 1}</span>
        <h3>${skill}</h3>
        <div class="muted">${state}</div>
        <div class="progress">
          <div class="progress-fill" style="width:${data.mastery}%"></div>
        </div>
        <div class="muted">${data.mastery}% mastery</div>
        <button class="lesson-button" type="button">Practice lesson</button>
      `;

      card.querySelector("button").addEventListener("click", () => startSkill(skill));
      grid.appendChild(card);
    });
  }

  function makeQuestion(skill) {
    const mastery = skills[skill].mastery;
    const difficulty = mastery < 25 ? 1 : mastery < 55 ? 2 : mastery < 80 ? 3 : 4;

    let a;
    let b;
    let answer;
    let symbol;

    if (skill.includes("Decimal")) {
      a = (randomInt(1, 999) / 100).toFixed(2);
      b = (randomInt(1, 999) / 100).toFixed(2);
      answer = (Number(a) + Number(b)).toFixed(2);
      symbol = "+";
    } else if (skill.includes("Multiplication")) {
      a = randomInt(2, 5 + difficulty * 2);
      b = randomInt(2, 12);
      answer = a * b;
      symbol = "×";
    } else if (skill.includes("Division")) {
      b = randomInt(2, 12);
      answer = randomInt(2, 10 + difficulty * 3);
      a = b * answer;
      symbol = "÷";
    } else if (skill.includes("Subtraction")) {
      a = randomInt(10, 40 + difficulty * 30);
      b = randomInt(1, a);
      answer = a - b;
      symbol = "−";
    } else if (skill.includes("Equation") || skill.includes("Expressions")) {
      const x = randomInt(1, 10 + difficulty * 3);
      const c = randomInt(1, 10);
      answer = x;

      const options = new Set([
        String(x),
        String(x + c),
        String(Math.max(0, x - c)),
        String(x + 1)
      ]);

      return {
        text: `x + ${c} = ${x + c}`,
        options: [...options].sort(() => Math.random() - 0.5),
        answer: String(answer)
      };
    } else {
      a = randomInt(1, 10 + difficulty * 20);
      b = randomInt(1, 10 + difficulty * 20);
      answer = a + b;
      symbol = "+";
    }

    const options = new Set([String(answer)]);

    while (options.size < 4) {
      const delta = randomInt(-Math.max(2, difficulty * 3), Math.max(2, difficulty * 3));
      const value = Number(answer) + delta;
      if (value >= 0) options.add(String(value));
    }

    return {
      text: `${a} ${symbol} ${b} = ?`,
      options: [...options].sort(() => Math.random() - 0.5),
      answer: String(answer)
    };
  }

  function startSkill(skill) {
    activeSkill = skill;
    currentQuestion = makeQuestion(skill);

    $("curriculum").classList.add("hidden");
    $("practice").classList.remove("hidden");
    $("practiceSkill").textContent =
      `${skill} • Adaptive Practice • ${skills[skill].mastery}% mastery`;
    $("question").textContent = currentQuestion.text;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";

    const answers = $("answers");
    answers.innerHTML = "";

    currentQuestion.options.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer";
      button.textContent = option;

      button.addEventListener("click", () => answerQuestion(option));
      answers.appendChild(button);
    });
  }

  function answerQuestion(value) {
    if (!activeSkill || !currentQuestion) return;

    const data = skills[activeSkill];
    data.attempts += 1;

    const correct = value === currentQuestion.answer;

    if (correct) {
      data.correct += 1;
      data.mastery = Math.min(
        100,
        data.mastery + Math.max(5, 12 - Math.floor(data.mastery / 15))
      );
      xp += 10;
      streak += 1;

      $("feedback").textContent = "✅ Correct! Mastery increased.";
      $("feedback").className = "feedback correct";
    } else {
      data.mastery = Math.max(0, data.mastery - 3);
      streak = 0;

      $("feedback").textContent =
        `❌ Not quite. The correct answer was ${currentQuestion.answer}.`;
      $("feedback").className = "feedback wrong";
    }

    updateStats();

    clearTimeout(nextQuestionTimer);
    nextQuestionTimer = setTimeout(() => startSkill(activeSkill), 750);
  }

  function returnToLessons() {
    clearTimeout(nextQuestionTimer);
    activeSkill = null;
    currentQuestion = null;
    renderCurriculum();
  }

  $("backButton").addEventListener("click", returnToLessons);

  loadProgress();
  renderTopics();
  renderCurriculum();
  updateStats();
})();
