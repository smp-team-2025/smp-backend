import nodemailer from "nodemailer";

const FROM = process.env.EMAIL_FROM || "SMP <satmorphy@physik.tu-darmstadt.de>";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user,
      pass,
    },
  });
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendHiwiWelcomeEmail(
  to: string,
  name: string,
  password: string
) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log("[DEV EMAIL] SMTP not configured. Would send HIWI email to:", to);
    console.log("Password:", password);
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Ihr SMP-Zugang wurde erstellt",
    html: `
      <p>Hallo ${escapeHtml(name)},</p>
      <p>für Sie wurde ein SMP-Zugang als Hiwi erstellt.</p>
      <p><strong>Ihre Login-Daten:</strong></p>
      <ul>
        <li>E-Mail: ${escapeHtml(to)}</li>
        <li>Passwort: <strong>${escapeHtml(password)}</strong></li>
      </ul>
      <p>Bitte melden Sie sich mit diesen Zugangsdaten an.</p>
    `,
  });
}