// Transactional e-mail via the Resend HTTP API (optional).
// Without RESEND_API_KEY mails are only logged, so the operator must send the
// cancellation confirmation manually.

export function mailEnabled() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function sendMail({ to, subject, text, bcc }) {
  if (!mailEnabled()) {
    console.warn(`[mail] Nicht konfiguriert – E-Mail an ${to} nicht gesendet: ${subject}`);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], bcc: bcc ? [bcc] : undefined, subject, text }),
  });
  if (!res.ok) {
    console.error(`[mail] Versand fehlgeschlagen (${res.status}): ${await res.text()}`);
    return false;
  }
  return true;
}
