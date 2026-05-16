const LIFF_ID = '2010105129-8clJHsYL';
const SUPABASE_URL = 'https://wurgbhvlrrdbcwpzkhrm.supabase.co';
const SUPABASE_KEY = 'sb_publishable__Vh8Fv5L5e8WOViMAt7KUg_7zNv7OFT';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

  const { error } = await db.from('orders')
    .update({
      payment_reported_at: new Date().toISOString(),
      reporter_line_id: lineUserId || null,
    })
    .eq('order_id', orderId);

  if (error) {
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
