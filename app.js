let review = 0;
let items = [];
let idx = 0;
let selected = [];
let written = [];

let saved = JSON.parse(
  localStorage.getItem('mathReviewScoresV2') || '[null,null,null]'
);

function section(id) {
  ['home', 'quiz', 'results'].forEach(x => {
    document.getElementById(x).classList.toggle('hidden', x !== id);
  });
}

function init() {
  document.getElementById('reviewCards').innerHTML = reviews.map((r, i) => {
    let count = questions.filter(q => q.review === i).length;

    return `
      <article class="card">
        <div>
          <h3>${r.name}</h3>
          <p>الصفحات ${r.pages} · ${count} سؤالًا</p>
        </div>
        <button class="btn soft" onclick="start(${i})">ابدأ</button>
      </article>
    `;
  }).join('');
}

function start(i) {
  review = i;
  items = questions.filter(q => q.review === i);
  idx = 0;
  selected = Array(items.length).fill(null);
  written = Array(items.length).fill('');
  section('quiz');
  render();
}

function render() {
  let q = items[idx];

  document.getElementById('reviewName').textContent = reviews[review].name;
  document.getElementById('counter').textContent = `${idx + 1} / ${items.length}`;
  document.getElementById('bar').style.width =
    ((idx + 1) / items.length * 100) + '%';

  document.getElementById('qid').textContent = `السؤال ${idx + 1}`;
  document.getElementById('page').textContent = `صفحة ${q.page}`;

  let img = document.getElementById('qimg');
  img.src = q.img || '';
  img.style.display = q.img ? 'block' : 'none';

  document.getElementById('zoomImg').src = q.img || '';
  document.getElementById('questionText').textContent =
    q.text || 'اقرأ السؤال من الصورة المرفقة.';

  let list = document.getElementById('answerList');
  let wrap = document.getElementById('writtenWrap');
  let title = document.getElementById('answerTitle');

  if (q.options && q.options.length === 4 && q.options.every(Boolean)) {
    wrap.classList.add('hidden');
    list.classList.remove('hidden');
    title.textContent = 'اختر الإجابة';

    list.innerHTML = q.options.map((v, i) => `
      <button class="answer-option ${selected[idx] === i + 1 ? 'selected' : ''}"
        onclick="choose(${i + 1})">
        <span class="num">${i + 1}</span>
        <span>${escapeText(v)}</span>
      </button>
    `).join('');
  } else {
    list.classList.add('hidden');
    wrap.classList.remove('hidden');
    title.textContent = 'اكتب إجابتك';

    let input = document.getElementById('writtenAnswer');
    input.value = written[idx] || '';

    input.oninput = e => {
      written[idx] = e.target.value;
      document.getElementById('next').disabled =
        !e.target.value.trim();
    };
  }

  let hasOptions = q.options && q.options.length === 4 && q.options.every(Boolean);

  document.getElementById('next').disabled = hasOptions
    ? selected[idx] === null
    : !(written[idx] || '').trim();
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function choose(n) {
  selected[idx] = n;

  document.querySelectorAll('.answer-option').forEach((button, i) => {
    button.classList.toggle('selected', i + 1 === n);
  });

  document.getElementById('next').disabled = false;
}

function zoomImage() {
  if (!items[idx].img) return;
  document.getElementById('zoom').classList.add('open');
}

function closeZoom() {
  document.getElementById('zoom').classList.remove('open');
}

function nextQ() {
  let q = items[idx];
  let hasOptions = q.options && q.options.length === 4 && q.options.every(Boolean);

  if (hasOptions && selected[idx] === null) return;
  if (!hasOptions && !(written[idx] || '').trim()) return;

  if (idx < items.length - 1) {
    idx++;
    render();
  } else {
    let done =
      selected.filter(x => x !== null).length +
      written.filter(x => (x || '').trim()).length;

    saved[review] = {
      done,
      total: items.length,
      percent: Math.round(done / items.length * 100),
      date: new Date().toLocaleDateString('ar-AE')
    };

    localStorage.setItem('mathReviewScoresV2', JSON.stringify(saved));
    showResults();
  }
}

function showResults() {
  section('results');

  document.getElementById('rows').innerHTML = reviews.map((r, i) => {
    let x = saved[i];

    return `
      <div class="result">
        <b>${r.name}</b>
        <span>${x ? `${x.done} من ${x.total} سؤال تمت الإجابة عنه` : 'لم تُنجز بعد'}</span>
      </div>
    `;
  }).join('');
}

function toHome() {
  section('home');
}

init();