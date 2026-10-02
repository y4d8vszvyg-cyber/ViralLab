// Legal pages (Impressum, Datenschutz, AGB, Widerruf, Kündigung).
// Operator details come from environment variables so they can be filled in on
// the hosting platform without touching code. Missing values render as visible
// placeholders. The texts are templates, not legal advice.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function legalInfo(env = process.env) {
  const ph = (v, label) => (v && v.trim() ? esc(v.trim()) : `<mark>[${label}]</mark>`);
  return {
    name: ph(env.LEGAL_NAME, 'Vor- und Nachname / Firma'),
    address: env.LEGAL_ADDRESS ? env.LEGAL_ADDRESS.split(',').map((l) => esc(l.trim())).join('<br>') : '<mark>[Straße Hausnummer]</mark><br><mark>[PLZ Ort]</mark>',
    email: ph(env.LEGAL_EMAIL, 'E-Mail-Adresse'),
    phone: env.LEGAL_PHONE ? `Telefon: ${esc(env.LEGAL_PHONE)}<br>` : '',
    vat: env.LEGAL_VAT_ID ? `<h2>Umsatzsteuer-ID</h2><p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ${esc(env.LEGAL_VAT_ID)}</p>` : '',
    priceNote: env.LEGAL_SMALL_BUSINESS === 'true'
      ? 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).'
      : 'Alle Preise verstehen sich inklusive der gesetzlichen Umsatzsteuer.',
    hoster: esc(env.LEGAL_HOSTER || 'Render Services, Inc., 525 Brannan Street, Suite 300, San Francisco, CA 94107, USA'),
    complete: Boolean(env.LEGAL_NAME && env.LEGAL_ADDRESS && env.LEGAL_EMAIL),
  };
}

function layout(title, body, info) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} – ViralLab</title>
  <meta name="robots" content="noindex">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="topbar"><a class="logo" href="/"><span class="flask">🧪</span> Viral<span>Lab</span></a><nav><a class="link" href="/">← Zur App</a></nav></header>
  <main class="legal">
    ${info.complete ? '' : '<p class="legal-warning">⚠️ Betreiberangaben fehlen noch. Setze <code>LEGAL_NAME</code>, <code>LEGAL_ADDRESS</code> und <code>LEGAL_EMAIL</code> in den Umgebungsvariablen.</p>'}
    <h1>${title}</h1>
    ${body}
  </main>
  ${footer()}
</body>
</html>`;
}

export function footer() {
  return `<footer class="foot">
    <nav class="foot-links"><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a><a href="/agb">AGB</a><a href="/widerruf">Widerrufsbelehrung</a><a href="/kuendigen" class="cancel-link">Verträge hier kündigen</a></nav>
    <p>ViralLab · Made with 🧪 &amp; Claude</p>
  </footer>`;
}

const PAGES = {
  impressum: (i) => ['Impressum', `
    <h2>Angaben gemäß § 5 DDG</h2>
    <p>${i.name}<br>${i.address}</p>
    <h2>Kontakt</h2>
    <p>${i.phone}E-Mail: ${i.email}</p>
    ${i.vat}
    <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
    <p>${i.name}<br>${i.address}</p>
    <h2>EU-Streitschlichtung und Verbraucherstreitbeilegung</h2>
    <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>`],

  datenschutz: (i) => ['Datenschutzerklärung', `
    <h2>1. Verantwortlicher</h2>
    <p>${i.name}<br>${i.address}<br>E-Mail: ${i.email}</p>

    <h2>2. Hosting</h2>
    <p>Diese Website wird bei ${i.hoster} gehostet. Beim Aufruf verarbeitet der Hoster technisch notwendige Daten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser-Informationen) in Server-Logfiles. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (sicherer und stabiler Betrieb). Eine Übermittlung in die USA erfolgt auf Grundlage der EU-Standardvertragsklauseln bzw. des EU-U.S. Data Privacy Framework.</p>

    <h2>3. Cookie</h2>
    <p>Wir setzen ein einziges, technisch notwendiges Cookie (<code>vl_uid</code>). Es enthält eine zufällige Kennung, mit der wir dein Kontingent an kostenlosen Generierungen, deinen Pro-Status und deine gespeicherten Pläne zuordnen. Es wird nicht für Tracking oder Werbung verwendet und nach 12 Monaten gelöscht. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG und Art. 6 Abs. 1 lit. b DSGVO. Wir verwenden keine Analyse- oder Marketing-Tools. Schriftarten werden von unserem eigenen Server geladen.</p>

    <h2>4. Erstellung von Content-Plänen (KI)</h2>
    <p>Die Texte, die du eingibst (Beschreibung deines Business, Markenname, Tonalität und optional Daten zu Videos deiner Nische), verarbeiten wir, um deinen Content-Plan zu erstellen. Dafür werden sie an die Anthropic PBC, 548 Market Street, PMB 90375, San Francisco, CA 94104, USA, übermittelt, die das KI-Modell Claude bereitstellt. Anthropic verwendet Daten aus der API nach eigenen Angaben nicht zum Training seiner Modelle. Die Übermittlung erfolgt auf Grundlage der EU-Standardvertragsklauseln. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Nutzungsvertrags). Bitte gib keine personenbezogenen Daten Dritter oder sensiblen Daten ein.</p>
    <p>Erstellte Pläne speichern wir, damit du sie unter „Meine Pläne“ wieder öffnen kannst. Du kannst sie dort jederzeit löschen.</p>

    <h2>5. Zahlungen</h2>
    <p>Für das Pro-Abo nutzen wir Stripe (Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland). Zahlungsdaten gibst du direkt bei Stripe ein; wir erhalten sie nicht. Wir speichern lediglich die Kunden- und Abo-Kennung von Stripe, um deinen Pro-Status zuzuordnen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO sowie Art. 6 Abs. 1 lit. c DSGVO (steuer- und handelsrechtliche Aufbewahrungspflichten).</p>

    <h2>6. Kündigungen</h2>
    <p>Wenn du das Kündigungsformular nutzt, verarbeiten wir Name, E-Mail-Adresse und die Angaben zur Kündigung, um sie auszuführen und zu bestätigen (Art. 6 Abs. 1 lit. b und c DSGVO).</p>

    <h2>7. Speicherdauer</h2>
    <p>Wir speichern Daten nur so lange, wie es für die genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen (bis zu 10 Jahre für Buchungsbelege) es verlangen.</p>

    <h2>8. Deine Rechte</h2>
    <p>Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Wende dich dafür an ${i.email}. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO).</p>`],

  agb: (i) => ['Allgemeine Geschäftsbedingungen', `
    <h2>§ 1 Geltungsbereich und Anbieter</h2>
    <p>Diese AGB gelten für die Nutzung von ViralLab. Anbieter ist ${i.name}, ${i.address.replace(/<br>/g, ', ')} (nachfolgend „wir“).</p>

    <h2>§ 2 Leistungen</h2>
    <p>ViralLab erstellt mithilfe künstlicher Intelligenz Vorschläge für Kurzvideo-Inhalte (Hooks, Skripte, Captions, Hashtags, Content-Kalender) und analysiert vom Nutzer eingegebene Daten zu Videos.</p>
    <ul>
      <li><b>Free:</b> 10 kostenlose Generierungen.</li>
      <li><b>Pro:</b> unbegrenzte Generierungen für 9,99 € pro Monat. ${i.priceNote}</li>
    </ul>
    <p>Wir bemühen uns um eine hohe Verfügbarkeit, schulden aber keine ununterbrochene Erreichbarkeit. Wartungen und Störungen bei Drittanbietern können zu Unterbrechungen führen.</p>

    <h2>§ 3 Vertragsschluss</h2>
    <p>Der Vertrag über das Pro-Abo kommt zustande, wenn du den Bestellvorgang mit „Jetzt Pro werden“ abschließt und die Zahlung über Stripe bestätigst.</p>

    <h2>§ 4 Laufzeit, Zahlung und Kündigung</h2>
    <p>Das Pro-Abo läuft jeweils einen Monat und verlängert sich automatisch um einen weiteren Monat, wenn es nicht gekündigt wird. Der Betrag wird zu Beginn jedes Abrechnungszeitraums über Stripe eingezogen. Du kannst jederzeit zum Ende des laufenden Abrechnungszeitraums kündigen, z.B. über den Button „Verträge hier kündigen“ oder über „Abo verwalten“. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.</p>

    <h2>§ 5 Nutzung der Inhalte</h2>
    <p>Die für dich generierten Inhalte darfst du uneingeschränkt verwenden, auch kommerziell. KI-generierte Inhalte können fehlerhaft sein oder Rechte Dritter berühren; prüfe sie vor der Veröffentlichung. Wir garantieren keine bestimmte Reichweite, Verkäufe oder sonstigen Erfolge.</p>

    <h2>§ 6 Pflichten der Nutzer</h2>
    <p>Du darfst ViralLab nicht für rechtswidrige Inhalte nutzen und keine Daten eingeben, an denen du keine Rechte hast. Eine automatisierte Massennutzung ist nicht gestattet.</p>

    <h2>§ 7 Haftung</h2>
    <p>Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Bei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vertragstypischen, vorhersehbaren Schaden. Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.</p>

    <h2>§ 8 Widerrufsrecht</h2>
    <p>Verbrauchern steht ein Widerrufsrecht nach Maßgabe der <a href="/widerruf">Widerrufsbelehrung</a> zu.</p>

    <h2>§ 9 Schlussbestimmungen</h2>
    <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gegenüber Verbrauchern gilt diese Rechtswahl nur, soweit dadurch nicht zwingende Verbraucherschutzvorschriften des Staates ihres gewöhnlichen Aufenthalts entzogen werden.</p>`],

  widerruf: (i) => ['Widerrufsbelehrung', `
    <h2>Widerrufsrecht</h2>
    <p>Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
    <p>Um dein Widerrufsrecht auszuüben, musst du uns (${i.name}, ${i.address.replace(/<br>/g, ', ')}, E-Mail: ${i.email}) mittels einer eindeutigen Erklärung (z.B. per E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.</p>
    <h2>Folgen des Widerrufs</h2>
    <p>Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.</p>
    <p>Hast du verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem du uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichtest, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.</p>
    <h2>Muster-Widerrufsformular</h2>
    <p class="caption">An ${i.name}, ${i.address.replace(/<br>/g, ', ')}, E-Mail: ${i.email}:<br><br>
    Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: ViralLab Pro<br>
    Bestellt am (*) / erhalten am (*)<br>
    Name des/der Verbraucher(s)<br>
    Anschrift des/der Verbraucher(s)<br>
    Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)<br>
    Datum<br><br>
    (*) Unzutreffendes streichen.</p>`],
};

export function renderLegalPage(slug, env = process.env) {
  const build = PAGES[slug];
  if (!build) return null;
  const info = legalInfo(env);
  const [title, body] = build(info);
  return layout(title, body, info);
}

export function renderCancelPage(env = process.env) {
  const info = legalInfo(env);
  return layout('Verträge hier kündigen', `
    <p>Hier kannst du dein ViralLab-Pro-Abo kündigen. Ohne Angabe eines Datums kündigst du ordentlich zum nächstmöglichen Zeitpunkt, also zum Ende des laufenden Abrechnungszeitraums.</p>
    <form id="cancelForm" class="card cancel-form">
      <label>Kündigungsart
        <select id="cancelType" name="type">
          <option value="ordentlich">Ordentliche Kündigung</option>
          <option value="ausserordentlich">Außerordentliche Kündigung</option>
        </select>
      </label>
      <label id="reasonWrap" hidden>Kündigungsgrund <small>(bei außerordentlicher Kündigung)</small>
        <textarea id="cancelReason" name="reason" rows="3" maxlength="1000"></textarea>
      </label>
      <label>Vor- und Nachname<input id="cancelName" name="name" required maxlength="120" autocomplete="name"></label>
      <label>E-Mail-Adresse, die du bei der Zahlung verwendet hast<input id="cancelEmail" name="email" type="email" required maxlength="200" autocomplete="email"></label>
      <label>Gewünschter Kündigungszeitpunkt <small>(optional)</small><input id="cancelDate" name="date" type="date"></label>
      <button class="btn primary" type="submit">Jetzt kündigen</button>
      <p class="error" id="cancelError" role="alert"></p>
    </form>
    <div id="cancelDone" hidden></div>
    <script>
      const f = document.getElementById('cancelForm');
      document.getElementById('cancelType').addEventListener('change', (e) => { document.getElementById('reasonWrap').hidden = e.target.value !== 'ausserordentlich'; });
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(f));
        const res = await fetch('/api/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { document.getElementById('cancelError').textContent = data.error || 'Kündigung konnte nicht übermittelt werden.'; return; }
        const c = data.cancellation;
        const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
        f.hidden = true;
        const done = document.getElementById('cancelDone');
        done.hidden = false;
        done.innerHTML = '<div class="card"><h2>✅ Deine Kündigung ist eingegangen</h2>' +
          '<p>Eingang: <b>' + new Date(c.receivedAt).toLocaleString('de-DE') + '</b><br>Referenz: <b>' + esc(c.id) + '</b><br>' +
          'Name: ' + esc(c.name) + '<br>E-Mail: ' + esc(c.email) + '<br>Art: ' + (c.type === 'ausserordentlich' ? 'außerordentlich' : 'ordentlich') +
          '<br>Wirksam zum: ' + esc(c.effective) + '</p>' +
          '<p class="muted">Bitte speichere diese Seite oder mach einen Screenshot. ' + (data.mailSent ? 'Eine Bestätigung haben wir dir zusätzlich per E-Mail geschickt.' : 'Eine Bestätigung schicken wir dir zusätzlich per E-Mail.') + '</p></div>';
      });
    </script>`, info);
}
