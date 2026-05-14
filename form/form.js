const LIFF_ID = '2010019541-j317IzH2';
const SUPABASE_URL = 'https://wurgbhvlrrdbcwpzkhrm.supabase.co';
const SUPABASE_KEY = 'sb_publishable__Vh8Fv5L5e8WOViMAt7KUg_7zNv7OFT';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let lineUserId = '';

liff.init({ liffId: LIFF_ID })
  .then(() => {
    if (liff.isLoggedIn()) return liff.getProfile();
  })
  .then(profile => {
    if (profile) lineUserId = profile.userId;
  })
  .catch(() => {});

// ── 注文番号生成 ──
function generateOrderId() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ORD-${date}-${time}-${rand}`;
}

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

  const orderId  = generateOrderId();
  const name     = document.getElementById('name').value.trim();
  const kana     = document.getElementById('kana').value.trim();
  const zip      = document.getElementById('zip').value.trim();
  const pref     = document.getElementById('prefecture').value;
  const city     = document.getElementById('city').value.trim();
  const building = document.getElementById('building').value.trim();
  const tel      = document.getElementById('tel').value.trim();

  const paymentUrl = `https://skinlabonline.inside-story.info/payment-report?order_id=${orderId}`;

  const { error } = await db.from('orders').insert({
    order_id: orderId,
    line_id: lineUserId,
    name,
    kana,
    zip,
    prefecture: pref,
    city,
    building,
    tel,
  });

  if (error) {
    btn.disabled = false;
    btn.textContent = 'この内容で送信する';
    alert('送信に失敗しました。もう一度お試しください。');
    return;
  }

  // LINEトークに送信
  let lineSuccess = false;
  if (liff.isInClient()) {
    const messageText =
      `お届け先情報を受け付けました。\n\n` +
      `注文番号：\n${orderId}\n\n` +
      `入金完了後は、以下のURLからご報告ください。\n${paymentUrl}`;
    try {
      await liff.sendMessages([{ type: 'text', text: messageText }]);
      lineSuccess = true;
    } catch {
      lineSuccess = false;
    }
  }

  showDone(orderId, paymentUrl, lineSuccess);
});

// ── 閉じるボタン ──
document.getElementById('close-btn').addEventListener('click', () => {
  if (liff.isInClient()) liff.closeWindow();
});

// ── ヘルパー ──
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
  const input = document.getElementById(id.replace('err-', ''));
  if (input) input.classList.add('is-error');
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
  const input = document.getElementById(id.replace('err-', ''));
  if (input) input.classList.remove('is-error');
}

function showDone(orderId, paymentUrl, lineSuccess) {
  document.getElementById('done-order-id').textContent = orderId;

  if (lineSuccess) {
    document.getElementById('done-message').textContent = '入金完了後は、LINEトークに届いたURLからご報告ください。';
  } else {
    document.getElementById('done-message').textContent = '入金完了後は、以下のURLからご報告ください。';
    const link = document.getElementById('done-payment-link');
    link.href = paymentUrl;
    link.textContent = paymentUrl;
    document.getElementById('done-fallback').classList.remove('hidden');
  }

  document.getElementById('form-view').classList.add('hidden');
  document.getElementById('done-view').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
