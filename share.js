const button = document.querySelector('#share');
const status = document.querySelector('#status');
button.addEventListener('click', () => {
  if (!navigator.geolocation) {
    status.textContent = 'Deze browser ondersteunt geen locatiebepaling.';
    return;
  }
  button.disabled = true;
  status.textContent = 'De browser vraagt je nu om toestemming…';
  navigator.geolocation.getCurrentPosition(async position => {
    status.textContent = 'Locatie gevonden. Bezig met delen…';
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      });
      if (!response.ok) throw new Error('Verzenden mislukt');
      status.textContent = 'Gelukt! Je locatie is één keer gedeeld met de organisator en wordt maximaal 15 minuten bewaard.';
    } catch {
      status.textContent = 'Locatie is niet doorgestuurd. Controleer je internetverbinding en probeer opnieuw.';
    } finally {
      button.disabled = false;
    }
  }, error => {
    const messages = {
      1: 'Geen toestemming gegeven; er is niets gedeeld.',
      2: 'Locatie kon niet worden bepaald. Controleer je locatie-instellingen.',
      3: 'Locatiebepaling duurde te lang. Probeer opnieuw.'
    };
    status.textContent = messages[error.code] || 'Locatiebepaling mislukt.';
    button.disabled = false;
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
});
