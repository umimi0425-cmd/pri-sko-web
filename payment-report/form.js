const LIFF_ID = '2010019541-j317IzH2';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbw64qbX4u0Ekwt2ffA4-KiXrPmlMKOBggH1Vx6CCECUvoUCYVhQzUYf07qk5Li-VF-Jiw/exec';

const orderId = new URLSearchParams(location.search).get('order_id') || '';
let lineUserId = '';

if (!orderId) {
  document.getElementById('form-view').classList.add('hidden');
  document.getElementById('error-view').classList.remove('hidden');
}

document.getElementById('order-id-display').textContent = orderId || '—';

liff.init({ liffId: LIFF_ID })
  .then(function() {
    if (liff.isLoggedIn()) return liff.getProfile();
  })
  .then(function(profile) {
    if (profile) lineUserId = profile.userId;
  })
  .catch(function() {});

document.getElementById('report-btn').addEventListener('click', async function() {
  const btn = document.getElementById('report-btn');
  btn.disabled = true;
  btn.textContent = '送信中...';

  try {
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams({ action: 'payment', orderId: orderId, lineUserId: lineUserId }),
    });
  } catch (e) {
    btn.disabled = false;
    btn.textContent = '入金完了を報告する';
    alert('送信に失敗しました。もう一度お試しください。');
    return;
  }

  document.getElementById('form-view').classList.add('hidden');
  document.getElementById('done-view').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('close-btn').addEventListener('click', function() {
  if (liff.isInClient()) liff.closeWindow();
});
