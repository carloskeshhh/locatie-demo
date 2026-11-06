# Locatie-link demonstratie (IT-cursus)

Deze demo heeft twee pagina's:
- `/` — een deelnemer kiest expliciet om **eenmalig** een locatie te delen.
- `/dashboard` — de organisator bekijkt de **laatst gedeelde locatie** achter een geheime beheerderssleutel.

De locatie (breedtegraad, lengtegraad en geschatte nauwkeurigheid) wordt via HTTPS naar de server verstuurd. Deze demo bewaart alleen de laatst gedeelde locatie, in het werkgeheugen van de server, maximaal 15 minuten. Bij herstart van de server verdwijnt die automatisch. Er wordt geen databank gebruikt en geen bewegingsgeschiedenis opgeslagen.

## Eerst op eigen computer proberen

Zorg voor Node.js versie 18 of hoger. Open een terminal in de projectmap:

- macOS / Linux:
  `ADMIN_KEY='maak-hier-een-geheime-sleutel-van-minstens-12-tekens' npm start`
- Windows PowerShell:
  `$env:ADMIN_KEY='maak-hier-een-geheime-sleutel-van-minstens-12-tekens'; npm start`

Ga naar `http://localhost:3000` voor de deelpagina en `http://localhost:3000/dashboard` voor het dashboard. Localhost geldt voor geolocatie als veilige context. Test met toestemming van de deelnemer (je kunt zelf beide tabs openen).

## Een publieke HTTPS-link maken via Render

1. Maak een GitHub-repository en upload de bestanden **uit de projectmap**, dus `server.js`, `package.json` en de map `public/`. Het zip-bestand zelf wordt niet rechtstreeks door Render uitgevoerd.
2. Ga naar [render.com](https://render.com), maak een account en selecteer **New > Web Service**.
3. Verbind de zojuist gemaakte GitHub-repository. Kies runtime **Node**.
4. Zet **Build Command** op `npm install` en **Start Command** op `npm start`.
5. Stel onder de omgevingsvariabelen `ADMIN_KEY` in met een eigen lange, geheime waarde (minstens 12 tekens). **Zet je echte ADMIN_KEY nooit in GitHub of de gedeelde URL.**
6. Deploy. Je krijgt een `https://...onrender.com`-domein. Stuur een proefdeelnemer alleen de basislink `/`.
7. Open zelf `https://...onrender.com/dashboard` en voer de beheerderssleutel in. Bij het vrijwillig delen verschijnt de locatie binnen circa drie seconden.

Let op: dit is een onderwijsdemo, geen geharde productieapplicatie. Gebruik hem alleen met vrijwillige, geïnformeerde toestemming. Deel het dashboard of de beheerderssleutel niet met deelnemers. Render kan gratis instances pauzeren; omdat locatie alleen in geheugen staat, kan de data dan eerder verdwijnen. Bij een browser die geen locatiegegevens mag opvragen, werkt het delen niet. Gebruik HTTPS (niet een gewone http-link op afstand).

## Uitleg voor presentatie

1. Browser `navigator.geolocation.getCurrentPosition()` vraagt expliciet toestemming.
2. JavaScript verstuurt lat/lon/nauwkeurigheid met `fetch()` via `POST /api/share`.
3. Node.js ontvangt het verzoek en bewaart de nieuwste waarden 15 minuten in het werkgeheugen.
4. Het dashboard vraagt met een geheime sleutel `GET /api/latest` op en toont de coördinaten.
5. Bij openen in Google Maps worden de coördinaten aan Google Maps doorgegeven. Doe dit alleen wanneer dat passend is voor de demo.
6. Beveiliging en privacy: HTTPS, expliciete toestemming, eenmalig delen, beperkte bewaartermijn, geen historische dataset.

## Aanbevolen voor een echte toepassing

Gebruik gebruikersaccounts, rate limiting, per-deelnemer revocatie, versleutelde opslag als opslag noodzakelijk is, en een privacyverklaring. Deze onderwijsdemo is niet ontworpen voor publieke of grootschalige inzet.
