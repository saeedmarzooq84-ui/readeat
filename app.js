
"use strict";

const app = document.getElementById("app");

const STORAGE = {
  answers: "haykal_math_answers_v2",
  extra: "haykal_math_extra_v2",
  progress: "haykal_math_progress_v2"
};

const state = {
  page: "home",
  review: 0,
  index: 0,
  selected: load(STORAGE.answers, {}),
  extraQuestions: load(STORAGE.extra, []),
  editingId: null,
  search: ""
};

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function allQuestions() {
  const base = Array.isArray(questions) ? questions : [];
  return [...base, ...state.extraQuestions];
}

function reviewQuestions(number) {
  return allQuestions().filter(q => Number(q.review) === number);
}

function answeredCount(list) {
  return list.filter(q =>
    Object.prototype.hasOwnProperty.call(state.selected, q.id)
  ).length;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function toast(message) {
  document.querySelector(".toast")?.remove();

  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2300);
}

function header() {
  return `
    <div class="topbar">
      <div class="brand">
        <div class="brand-mark">هـ</div>
        <div>
          <div class="brand-name">هيكل الرياضيات</div>
          <div class="brand-caption">منصة المراجعة التعليمية</div>
        </div>
      </div>
      <button class="icon-button" onclick="goHome()" aria-label="الرئيسية">⌂</button>
    </div>
  `;
}

function footer() {
  return `
    <footer class="footer">
      تم إنشاؤه بواسطة معلمي الرياضيات – مدرسة البريرات – الحلقة الثانية بنين
      <br>
      نسخة مراجعة مرتبطة بالملزمة الأصلية
    </footer>
  `;
}

function renderHome() {
  state.page = "home";

  const all = allQuestions();
  const totalAnswered = Object.keys(state.selected).filter(id =>
    all.some(q => q.id === id)
  ).length;

  const cards = [0, 1, 2].map(number => {
    const list = reviewQuestions(number);
    const done = answeredCount(list);
    const names = ["المراجعة الأولى", "المراجعة الثانية", "المراجعة الثالثة"];
    const pages = ["الصفحات 1–20", "الصفحات 21–40", "الصفحات 41–69"];

    return `
      <button class="review-card" onclick="startReview(${number})">
        <div class="review-icon">${["①", "②", "③"][number]}</div>
        <div>
          <h3>${names[number]}</h3>
          <p>${pages[number]}</p>
        </div>
        <div class="review-count">${done}/${list.length}</div>
      </button>
    `;
  }).join("");

  app.innerHTML = `
    <main class="shell">
      ${header()}

      <section class="hero">
        <span class="hero-tag">منصة المراجعة</span>
        <h1>أهلاً بك في هيكل الرياضيات 💙</h1>
        <p>
          راجع أسئلتك خطوة بخطوة، اختر إجاباتك، كبّر الصور عند الحاجة،
          وتابع مقدار إنجازك في كل مراجعة.
        </p>
        <div class="hero-actions">
          <button class="hero-button" onclick="startReview(0)">ابدأ المراجعة</button>
          <button class="hero-button ghost" onclick="openAdmin()">إدارة الأسئلة</button>
        </div>
      </section>

      <div class="section-heading">
        <div>
          <h2>المراجعات</h2>
          <p>اختر القسم الذي تريد مراجعته</p>
        </div>
        <span class="small">${all.length} سؤال مضاف</span>
      </div>

      <section class="review-grid">
        ${cards}
      </section>

      <section class="panel">
        <div class="section-heading" style="margin:0 0 12px">
          <div>
            <h2>ملخص الإنجاز</h2>
            <p>إجاباتك المحفوظة على هذا الجهاز</p>
          </div>
          <strong style="color:var(--blue)">${totalAnswered}/${all.length}</strong>
        </div>

        <div class="stats-grid">
          <div class="stat">
            <strong>${all.length}</strong>
            <span>إجمالي الأسئلة</span>
          </div>
          <div class="stat">
            <strong>${totalAnswered}</strong>
            <span>تمت الإجابة</span>
          </div>
          <div class="stat">
            <strong>${Math.max(0, all.length - totalAnswered)}</strong>
            <span>متبقي</span>
          </div>
        </div>

        <div class="progress-track">
          <div class="progress-fill"
            style="width:${all.length ? totalAnswered / all.length * 100 : 0}%">
          </div>
        </div>

        <button class="btn btn-soft btn-block" style="margin-top:15px"
          onclick="renderResults()">
          عرض النتائج التفصيلية
        </button>
      </section>

      <section class="panel">
        <div class="row between wrap">
          <div>
            <strong>إدارة المحتوى</strong>
            <p class="small">أضف أسئلة أو استورد بنك الأسئلة.</p>
          </div>
          <button class="btn btn-primary" onclick="openAdmin()">فتح الإدارة</button>
        </div>
      </section>

      ${footer()}
    </main>
  `;
}

function goHome() {
  renderHome();
}

function startReview(number) {
  const list = reviewQuestions(number);

  if (!list.length) {
    toast("لا توجد أسئلة مضافة في هذه المراجعة بعد");
    openAdmin();
    return;
  }

  state.review = number;
  state.index = 0;
  state.page = "review";
  renderQuestion();
}

function renderQuestion() {
  const list = reviewQuestions(state.review);

  if (!list.length) {
    renderHome();
    return;
  }

  state.index = Math.max(0, Math.min(state.index, list.length - 1));

  const q = list[state.index];
  const chosen = state.selected[q.id];
  const percent = ((state.index + 1) / list.length) * 100;

  const image = q.img
    ? `
      <img class="question-image"
        src="${esc(q.img)}"
        alt="صورة السؤال"
        onclick="zoomImage('${esc(q.img)}')"
        onerror="this.style.display='none'">
    `
    : "";

  const options = Array.isArray(q.options) ? q.options : [];

  const optionHTML = options.length
    ? `
      <div class="option-list">
        ${options.map((answer, i) => `
          <button class="option ${chosen === i ? "selected" : ""}"
            onclick="chooseAnswer(${i})">
            <span class="option-index">${i + 1}</span>
            <span class="option-text">${esc(answer)}</span>
          </button>
        `).join("")}
      </div>
    `
    : `
      <div class="form-field">
        <label>مساحة الإجابة الكتابية</label>
        <textarea class="answer-input"
          placeholder="يمكنك كتابة إجابتك هنا..."
          oninput="saveWrittenAnswer(this.value, '${esc(q.id)}')">${esc(typeof chosen === "string" ? chosen : "")}</textarea>
      </div>
    `;

  app.innerHTML = `
    <main class="shell">
      ${header()}

      <div class="row between wrap">
        <button class="btn btn-soft" onclick="goHome()">← الرئيسية</button>
        <span class="small">المراجعة ${state.review + 1}</span>
      </div>

      <section class="panel">
        <div class="row between">
          <strong>تقدمك في المراجعة</strong>
          <strong style="color:var(--blue)">${state.index + 1} / ${list.length}</strong>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${percent}%"></div>
        </div>
      </section>

      <section class="question-card">
        <div class="question-top">
          ${image}
          <div>
            <div class="question-number">السؤال رقم ${state.index + 1}</div>
            <p class="question-text">${esc(q.text)}</p>
            ${q.page ? `<p class="small">صفحة ${esc(q.page)}</p>` : ""}
          </div>
        </div>
      </section>

      <section class="question-card">
        <strong>الإجابات</strong>
        ${optionHTML}
      </section>

      <div class="question-navigation">
        <button class="btn btn-soft" onclick="previousQuestion()"
          ${state.index === 0 ? "disabled" : ""}>
          السابق
        </button>

        <button class="btn btn-primary" onclick="nextQuestion()">
          ${state.index === list.length - 1 ? "إنهاء المراجعة" : "السؤال التالي"}
        </button>
      </div>

      <div class="row between" style="margin-top:14px">
        <span class="small">لا يتم عرض صح أو خطأ.</span>
        <button class="btn btn-soft" onclick="clearCurrentAnswer()">مسح الإجابة</button>
      </div>

      ${footer()}
    </main>
  `;
}

function chooseAnswer(index) {
  const q = reviewQuestions(state.review)[state.index];

  state.selected[q.id] = index;
  save(STORAGE.answers, state.selected);
  renderQuestion();
}

function saveWrittenAnswer(value, id) {
  state.selected[id] = value;
  save(STORAGE.answers, state.selected);
}

function clearCurrentAnswer() {
  const q = reviewQuestions(state.review)[state.index];
  delete state.selected[q.id];
  save(STORAGE.answers, state.selected);
  renderQuestion();
  toast("تم مسح الإجابة");
}

function nextQuestion() {
  const list = reviewQuestions(state.review);

  if (state.index < list.length - 1) {
    state.index++;
    renderQuestion();
  } else {
    renderResults();
  }
}

function previousQuestion() {
  if (state.index > 0) {
    state.index--;
    renderQuestion();
  }
}

function zoomImage(src) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `<img class="modal-image" src="${esc(src)}" alt="صورة السؤال مكبرة">`;
  modal.onclick = () => modal.remove();
  document.body.appendChild(modal);
}

function renderResults() {
  state.page = "results";

  const all = allQuestions();
  const total = all.length;
  const done = answeredCount(all);

  const rows = [0, 1, 2].map(number => {
    const list = reviewQuestions(number);
    const count = answeredCount(list);
    const names = ["المراجعة الأولى", "المراجعة الثانية", "المراجعة الثالثة"];

    return `
      <div class="admin-question">
        <div class="row between">
          <strong>${names[number]}</strong>
          <strong style="color:var(--blue)">${count} / ${list.length}</strong>
        </div>
        <div class="progress-track">
          <div class="progress-fill"
            style="width:${list.length ? count / list.length * 100 : 0}%">
          </div>
        </div>
      </div>
    `;
  }).join("");

  app.innerHTML = `
    <main class="shell">
      ${header()}
      <h1 class="page-title">نتائج المراجعة</h1>

      <section class="hero">
        <span class="hero-tag">ملخص الإنجاز</span>
        <h1>${done} من ${total}</h1>
        <p>هذا عدد الأسئلة التي تم اختيار إجابة لها، وليس تقييماً لصحة الإجابات.</p>
      </section>

      <section class="panel">
        <h3>تفاصيل المراجعات</h3>
        ${rows}
      </section>

      <section class="panel">
        <button class="btn btn-primary btn-block" onclick="goHome()">العودة للرئيسية</button>
      </section>
      ${footer()}
    </main>
  `;
}

function openAdmin() {
  state.page = "admin";
  state.search = "";
  renderAdmin();
}

function renderAdmin() {
  const all = allQuestions();
  const filtered = all.filter(q =>
    `${q.id} ${q.text}`.toLowerCase().includes(state.search.toLowerCase())
  );

  const listHTML = filtered.map(q => `
    <div class="admin-question">
      <div class="row between wrap">
        <strong>${esc(q.id)}</strong>
        <span class="small">المراجعة ${Number(q.review) + 1}</span>
      </div>
      <p>${esc(q.text)}</p>
      <div class="row wrap">
        <button class="btn btn-soft" onclick="editQuestion('${esc(q.id)}')">تعديل</button>
        <button class="btn btn-danger" onclick="deleteQuestion('${esc(q.id)}')">حذف</button>
      </div>
    </div>
  `).join("");

  app.innerHTML = `
    <main class="shell">
      ${header()}
      <div class="row between wrap">
        <h1 class="page-title">إدارة الأسئلة</h1>
        <button class="btn btn-soft" onclick="goHome()">الرئيسية</button>
      </div>

      <section class="panel">
        <h3>إضافة سؤال جديد</h3>
        <p class="small">أضف سؤالاً واختياراته وصورته إن وجدت.</p>
        <button class="btn btn-primary btn-block" onclick="questionForm()">＋ إضافة سؤال</button>
      </section>

      <section class="panel">
        <h3>إدارة بنك الأسئلة</h3>
        <div class="form-field">
          <label>البحث عن سؤال</label>
          <input id="question-search" placeholder="ابحث بالنص أو رقم السؤال..."
            value="${esc(state.search)}">
        </div>
        <p class="small">عدد الأسئلة: ${all.length}</p>
        ${listHTML || `<div class="empty-state">لا توجد أسئلة مطابقة للبحث.</div>`}
      </section>

      <section class="panel">
        <h3>نسخ احتياطي</h3>
        <p class="small">احتفظ بنسخة من الأسئلة التي أضفتها وإجاباتك.</p>
        <div class="row wrap">
          <button class="btn btn-primary" onclick="exportData()">تصدير البيانات</button>
          <button class="btn btn-soft" onclick="document.getElementById('import-file').click()">استيراد JSON</button>
        </div>
      </section>

      ${footer()}
    </main>
  `;

  document.getElementById("question-search").addEventListener("input", e => {
    state.search = e.target.value;
    const cursor = e.target.selectionStart;
    renderAdmin();
    const input = document.getElementById("question-search");
    input.focus();
    input.setSelectionRange(cursor, cursor);
  });
}

function questionForm(id = null) {
  state.editingId = id;
  const old = id ? allQuestions().find(q => q.id === id) : null;

  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-content">
      <div class="row between">
        <h2>${old ? "تعديل السؤال" : "إضافة سؤال"}</h2>
        <button class="icon-button" id="close-form">×</button>
      </div>

      <form id="question-form">
        <div class="form-field">
          <label>رقم السؤال</label>
          <input name="id" required value="${esc(old?.id || "")}"
            placeholder="مثال: Q1">
        </div>

        <div class="form-field">
          <label>المراجعة</label>
          <select name="review">
            <option value="0" ${old?.review === 0 ? "selected" : ""}>المراجعة الأولى</option>
            <option value="1" ${old?.review === 1 ? "selected" : ""}>المراجعة الثانية</option>
            <option value="2" ${old?.review === 2 ? "selected" : ""}>المراجعة الثالثة</option>
          </select>
        </div>

        <div class="form-field">
          <label>رقم الصفحة</label>
          <input name="page" type="number" min="1" value="${esc(old?.page || "")}">
        </div>

        <div class="form-field">
          <label>نص السؤال</label>
          <textarea name="text" required>${esc(old?.text || "")}</textarea>
        </div>

        <div class="form-field">
          <label>مسار الصورة (اختياري)</label>
          <input name="img" value="${esc(old?.img || "")}"
            placeholder="questions/Q1.png">
        </div>

        <div class="form-field">
          <label>الاختيار الأول</label>
          <input name="o1" value="${esc(old?.options?.[0] || "")}">
        </div>
        <div class="form-field">
          <label>الاختيار الثاني</label>
          <input name="o2" value="${esc(old?.options?.[1] || "")}">
        </div>
        <div class="form-field">
          <label>الاختيار الثالث</label>
          <input name="o3" value="${esc(old?.options?.[2] || "")}">
        </div>
        <div class="form-field">
          <label>الاختيار الرابع</label>
          <input name="o4" value="${esc(old?.options?.[3] || "")}">
        </div>

        <p class="small">اترك الاختيارات كلها فارغة إذا كان السؤال كتابياً.</p>
        <button class="btn btn-primary btn-block" type="submit">حفظ السؤال</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#close-form").onclick = () => modal.remove();

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelector("#question-form").onsubmit = e => {
    e.preventDefault();

    const data = new FormData(e.target);
    const idValue = String(data.get("id")).trim();
    const textValue = String(data.get("text")).trim();

    const options = ["o1", "o2", "o3", "o4"]
      .map(key => String(data.get(key)).trim())
      .filter(Boolean);

    if (options.length !== 0 && options.length !== 4) {
      toast("أدخل الاختيارات الأربعة أو اتركها كلها فارغة");
      return;
    }

    const existingBase = questions.some(q => q.id === idValue);

    if (!old && (allQuestions().some(q => q.id === idValue))) {
      toast("رقم السؤال مستخدم من قبل");
      return;
    }

    if (old && existingBase) {
      toast("هذا السؤال من البنك الأساسي؛ لا يمكن تعديل مصدره هنا");
      return;
    }

    const question = {
      id: idValue,
      review: Number(data.get("review")),
      page: Number(data.get("page")) || null,
      text: textValue,
      img: String(data.get("img")).trim(),
      options
    };

    if (old) {
      const index = state.extraQuestions.findIndex(q => q.id === old.id);
      state.extraQuestions[index] = question;
    } else {
      state.extraQuestions.push(question);
    }

    save(STORAGE.extra, state.extraQuestions);
    modal.remove();
    renderAdmin();
    toast("تم حفظ السؤال");
  };
}

function editQuestion(id) {
  const q = state.extraQuestions.find(item => item.id === id);

  if (!q) {
    toast("هذا سؤال أساسي، لا يمكن تعديله من هنا");
    return;
  }

  questionForm(id);
}

function deleteQuestion(id) {
  const q = state.extraQuestions.find(item => item.id === id);

  if (!q) {
    toast("لا يمكن حذف سؤال من البنك الأساسي");
    return;
  }

  if (!confirm("هل تريد حذف هذا السؤال؟")) return;

  state.extraQuestions = state.extraQuestions.filter(item => item.id !== id);
  delete state.selected[id];

  save(STORAGE.extra, state.extraQuestions);
  save(STORAGE.answers, state.selected);

  renderAdmin();
  toast("تم حذف السؤال");
}

function exportData() {
  const data = {
    app: "هيكل الرياضيات",
    version: 2,
    questions: state.extraQuestions,
    answers: state.selected
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "هيكل-الرياضيات-نسخة-احتياطية.json";
  link.click();

  URL.revokeObjectURL(url);
}

document.getElementById("import-file").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());
    const incoming = Array.isArray(data) ? data : data.questions;

    if (!Array.isArray(incoming)) {
      throw new Error("ملف غير صالح");
    }

    const valid = incoming.filter(q =>
      q &&
      typeof q.id === "string" &&
      typeof q.text === "string" &&
      [0, 1, 2].includes(Number(q.review)) &&
      Array.isArray(q.options)
    );

    if (!valid.length) {
      throw new Error("لم يتم العثور على أسئلة صالحة");
    }

    const ids = new Set(state.extraQuestions.map(q => q.id));

    valid.forEach(q => {
      if (!questions.some(base => base.id === q.id)) {
        ids.add(q.id);
      }
    });

    const merged = new Map(
      state.extraQuestions.map(q => [q.id, q])
    );

    valid.forEach(q => {
      if (!questions.some(base => base.id === q.id)) {
        merged.set(q.id, {
          ...q,
          review: Number(q.review),
          options: q.options
        });
      }
    });

    state.extraQuestions = [...merged.values()];
    save(STORAGE.extra, state.extraQuestions);

    if (data.answers && typeof data.answers === "object") {
      state.selected = { ...state.selected, ...data.answers };
      save(STORAGE.answers, state.selected);
    }

    toast(`تم استيراد ${valid.length} سؤال`);
    renderAdmin();
  } catch (error) {
    alert("تعذر استيراد الملف: " + error.message);
  }

  e.target.value = "";
});

renderHome();
