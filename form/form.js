const LIFF_ID = '2010105129-8clJHsYL';
const SUPABASE_URL = 'https://wurgbhvlrrdbcwpzkhrm.supabase.co';
const SUPABASE_KEY = 'sb_publishable__Vh8Fv5L5e8WOViMAt7KUg_7zNv7OFT';
const CRM_LIFF_FORM = 'https://skinlabcrm-gezjnr2g.manus.space/api/trpc/webhook.liffForm';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let lineUserId = '';

liff.init({ liffId: LIFF_ID })
  .then(() => {
    if (liff.isLoggedIn()) return liff.getProfile();
  })
  .then(async profile => {
    if (!profile) return;
    lineUserId = profile.userId;
    const { data } = await db
      .from('orders')
      .select('name, kana, zip, prefecture, city, building, tel')
      .eq('line_id', lineUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data) prefillForm(data);
  })
  .catch(() => {});

function prefillForm(data) {
  document.getElementById('name').value       = data.name       || '';
  document.getElementById('kana').value       = data.kana       || '';
  document.getElementById('zip').value        = data.zip        || '';
  document.getElementById('prefecture').value = data.prefecture || '';
  document.getElementById('city').value       = data.city       || '';
  document.getElementById('building').value   = data.building   || '';
  document.getElementById('tel').value        = data.tel        || '';
  document.getElementById('prefill-notice').classList.remove('hidden');
}

// ── 注文番号生成 ──
function generateOrderId() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ORD-${date}-${time}-${rand}`;
}

// ── 電話番号 自動フォーマット ──
function formatPhone(value) {
  const d = value.replace(/\D/g, '');
  if (/^0[5-9]0/.test(d)) {
    if (d.length <= 3) return d;
    if (d.length <= 7) return d.slice(0, 3) + '-' + d.slice(3);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7, 11);
  }
  if (/^0[36]/.test(d)) {
    if (d.length <= 2) return d;
    if (d.length <= 6) return d.slice(0, 2) + '-' + d.slice(2);
    return d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6, 10);
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return d.slice(0, 3) + '-' + d.slice(3);
  return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7, 11);
}

document.getElementById('tel').addEventListener('input', (e) => {
  const pos = e.target.selectionStart;
  const prev = e.target.value;
  const formatted = formatPhone(prev);
  e.target.value = formatted;
  const diff = formatted.length - prev.length;
  e.target.setSelectionRange(pos + diff, pos + diff);
});

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

// ── フォーム → 確認画面へ ──
document.getElementById('delivery-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) return;

  document.getElementById('conf-name').textContent     = document.getElementById('name').value.trim();
  document.getElementById('conf-kana').textContent     = document.getElementById('kana').value.trim();
  document.getElementById('conf-zip').textContent      = document.getElementById('zip').value.trim();
  document.getElementById('conf-pref').textContent     = document.getElementById('prefecture').value;
  document.getElementById('conf-city').textContent     = document.getElementById('city').value.trim();
  document.getElementById('conf-tel').textContent      = document.getElementById('tel').value.trim();
  const building = document.getElementById('building').value.trim();
  document.getElementById('conf-building').textContent = building || '—';

  document.getElementById('form-view').classList.add('hidden');
  document.getElementById('confirm-view').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── 修正するボタン ──
document.getElementById('back-btn').addEventListener('click', () => {
  document.getElementById('confirm-view').classList.add('hidden');
  document.getElementById('form-view').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── 確認画面 → 送信 ──
document.getElementById('send-btn').addEventListener('click', async () => {
  const btn = document.getElementById('send-btn');
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

  // CRM に注文登録（失敗してもユーザーフローは止めない）
  fetch(CRM_LIFF_FORM, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      json: {
        orderId,
        tel,
        lineId: lineUserId || null,
        name,
        kana,
        zip,
        prefecture: pref,
        city,
        building: building || null,
        paymentReportUrl: paymentUrl,
      },
    }),
  }).catch(function() {});

  // LINEトークに送信
  let lineSuccess = false;
  if (liff.isInClient()) {
    const address = [pref, city, building].filter(Boolean).join(' ');
    const messageText =
      `お届け先情報を受け付けました。\n\n` +
      `注文番号：${orderId}\n\n` +
      `【お届け先】\n` +
      `お名前：${name}（${kana}）\n` +
      `郵便番号：${zip}\n` +
      `住所：${address}\n` +
      `電話番号：${tel}\n\n` +
      `内容に誤りがある場合は、このトークでご連絡ください。\n\n` +
      `入金完了後は、以下のURLからご報告ください。\n${paymentUrl}`;
    try {
      await liff.sendMessages([{ type: 'text', text: messageText }]);
      lineSuccess = true;
    } catch {
      lineSuccess = false;
    }
  }

  location.href = `/form/thanks?order_id=${orderId}&line=${lineSuccess ? 1 : 0}`;
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
