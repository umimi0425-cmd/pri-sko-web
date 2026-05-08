const LIFF_ID = '2010019541-j317IzH2';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbw64qbX4u0Ekwt2ffA4-KiXrPmlMKOBggH1Vx6CCECUvoUCYVhQzUYf07qk5Li-VF-Jiw/exec';

const orderId = new URLSearchParams(location.search).get('order_id') || '';
let lineUserId = '';

// 注文番号が無ければエラー画面を表示
if (!orderId) {
  document.getElementById('form-view').classList.add('hidden');
  document.getElementById('error-view').classList.remove('hidden');
}

document.getElementById('order-id-display').textContent = orderId || '—';

liff.init({ liffId: LIFF_ID })
  .then(() => {
    if (liff.isLoggedIn()) return liff.getProfile();
  })
  .then(profile => {
    if (profile) lineUserId = profile.userId;
  })
  .catch(() => {});

// ── フォーム送信 ──
document.getElementById('payment-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const paymentMethod = document.getElementById('payment-method').value;
  if (!paymentMethod) {
    const el = document.getElementById('err-payment-method');
    el.textContent = 'お支払い方法を選択してください';
    document.getElementById('payment-method').classList.add('is-error');
    return;
  }
  document.getElementById('err-payment-method').textContent = '';
  document.getElementById('payment-method').classList.remove('is-error');

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = '送信中...';

  const notes = document.getElementById('notes').value.trim();

  try {
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams({ action: 'payment', orderId, lineUserId, paymentMethod, notes }),
    });
  } catch {
    btn.disabled = false;
    btn.textContent = '入金完了を報告する';
    alert('送信に失敗しました。もう一度お試しください。');
    return;
  }

  document.getElementById('form-view').classList.add('hidden');
  document.getElementById('done-view').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── 閉じるボタン ──
document.getElementById('close-btn').addEventListener('click', () => {
  if (liff.isInClient()) liff.closeWindow();
});
