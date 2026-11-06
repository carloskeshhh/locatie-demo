const secretInput = document.querySelector('#secret');
const connection = document.querySelector('#connection');
const result = document.querySelector('#result');
const positionEl = document.querySelector('#position');
const empty = document.querySelector('#empty');
let key = '';
let refreshHandle = null;
function authHeaders() { return { Authorization: `Bearer ${key}` }; }
async function refresh() {
  if (!key) return;
  try {
    const response = await fetch('/api/latest', { headers: authHeaders(), cache: 'no-store' });
    if (response.status === 401) {
      key = '';
      clearInterval(refreshHandle);
      refreshHandle = null;
      result.hidden = true;
      connection.textContent = 'De beheerderssleutel is onjuist.';
      return;
    }
    if (!response.ok) throw new Error('Kon gegevens niet ophalen');
    const { location } = await response.json();
    connection.textContent = 'Verbonden. Je ontvangt nieuwe locatiegegevens automatisch.';
    result.hidden = false;
    empty.hidden = !!location;
    positionEl.hidden = !location;
    if (!location) return;
    document.querySelector('#lat').textContent = location.latitude.toFixed(6);
    document.querySelector('#lon').textContent = location.longitude.toFixed(6);
    document.querySelector('#accuracy').textContent = `${Math.round(location.accuracy)} meter (geschat)`;
    document.querySelector('#time').textContent = new Date(location.receivedAt).toLocaleString('nl-NL');
    document.querySelector('#map').href = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  } catch {
    connection.textContent = 'Verbinding tijdelijk niet beschikbaar. Nieuwe poging volgt automatisch.';
  }
}
document.querySelector('#connect').addEventListener('click', () => {
  if (!secretInput.value.trim()) {
    connection.textContent = 'Vul eerst je beheerderssleutel in.';
    return;
  }
  key = secretInput.value.trim();
  secretInput.value = '';
  if (refreshHandle) clearInterval(refreshHandle);
  refresh();
  refreshHandle = setInterval(refresh, 3000);
});
document.querySelector('#clear').addEventListener('click', async () => {
  if (!key) return;
  const response = await fetch('/api/clear', { method: 'POST', headers: authHeaders() });
  if (response.ok) refresh();
});
