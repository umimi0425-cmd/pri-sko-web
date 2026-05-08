const LIFF_ID = 'YOUR_LIFF_ID'; // LINE DevelopersのLIFF IDに差し替える
const GAS_URL = 'https://script.google.com/macros/s/AKfycbw64qbX4u0Ekwt2ffA4-KiXrPmlMKOBggH1Vx6CCECUvoUCYVhQzUYf07qk5Li-VF-Jiw/exec';

let lineUserId = '';

liff.init({ liffId: LIFF_ID })
  .then(() => {
    if (liff.isLoggedIn()) return liff.getProfile();
  })
  .then(profile => {
    if (profile) lineUserId = profile.userId;
  })
  .catch(() => {});

// ── 郵便番号 → 住所自動入力 ──
document.getElementById('zip-btn').addEventListener('click', async () => {
  const zip = document.getElementById('zip').value.replace(/-/g, '').trim();
  if (zip.length !== 7) {
    setError('err-zip', '7桁の郵便番号を入力してください');
    return;
  }
  try {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
    const data = await res.json();
    if (!data.results) {
      setError('err-zip', '住所が見つかりませんでした');
      return;
    }
    const r = data.results[0];
    document.getElementById('prefecture').value = r.address1;
    document.getElementById('city').value = r.address2 + r.address3;
    clearError('err-zip');
  } catch {
    setError('err-zip', '通信エラーが発生しました');
  }
});

// ── バリデーション ──
function validate() {
  let ok = true;

  const name = document.getElementById('name').value.trim();
  if (!name) { setError('err-name', 'お名前を入力してください'); ok = false; }
  else clearError('err-name');

  const kana = document.getElementById('kana').value.trim();
  if (!kana) { setError('err-kana', 'フリガナを入力してください'); ok = false; }
  else clearError('err-kana');

  const zip = document.getElementById('zip').value.trim();
  if (!zip) { setError('err-zip', '郵便番号を入力してください'); ok = false; }
  else clearError('err-zip');

  const pref = document.getElementById('prefecture').value;
  if (!pref) { setError('err-pref', '都道府県を選択してください'); ok = false; }
  else clearError('err-pref');

  const city = document.getElementById('city').value.trim();
  if (!city) { setError('err-city', '市区町村・番地を入力してください'); ok = false; }
  else clearError('err-city');

  const tel = document.getElementById('tel').value.trim();
  if (!tel) { setError('err-tel', '電話番号を入力してください'); ok = false; }
  else clearError('err-tel');

  return ok;
}

// ── フォーム送信 ──
document.getElementById('delivery-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = '送信中...';

  const name     = document.getElementById('name').value.trim();
  const kana     = document.getElementById('kana').value.trim();
  const zip      = document.getElementById('zip').value.trim();
  const pref     = document.getElementById('prefecture').value;
  const city     = document.getElementById('city').value.trim();
  const building = document.getElementById('building').value.trim();
  const tel      = document.getElementById('tel').value.trim();

  const address = building ? `${pref}${city} ${building}` : `${pref}${city}`;

  const messageText =
    `【お届け先】\n` +
    `お名前：${name}（${kana}）\n` +
    `郵便番号：〒${zip}\n` +
    `住所：${address}\n` +
    `電話番号：${tel}`;

  try {
    // スプレッドシートに送信
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams({ name, kana, zip, prefecture: pref, city, building, tel, lineUserId }),
    });

    // LINEに通知（LINEアプリ内の場合のみ）
    if (liff.isInClient()) {
      await liff.sendMessages([{ type: 'text', text: messageText }]);
    }

    showDone();
  } catch {
    btn.disabled = false;
    btn.textContent = 'この内容で送信する';
    alert('送信に失敗しました。もう一度お試しください。');
  }
});

// ── 閉じるボタン ──
document.getElementById('close-btn').addEventListener('click', () => {
  if (liff.isInClient()) {
    liff.closeWindow();
  }
});

// ── ヘルパー ──
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
  const fieldId = id.replace('err-', '');
  const input = document.getElementById(fieldId);
  if (input) input.classList.add('is-error');
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
  const fieldId = id.replace('err-', '');
  const input = document.getElementById(fieldId);
  if (input) input.classList.remove('is-error');
}

function showDone() {
  document.getElementById('form-view').classList.add('hidden');
  document.getElementById('done-view').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
