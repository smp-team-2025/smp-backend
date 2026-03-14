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

export async function sendForgotPasswordEmail(
  to: string,
  name: string,
  newPassword: string
) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log("======================================");
    console.log("[FORGOT PASSWORD]");
    console.log("email:", to);
    console.log("new password:", newPassword);
    console.log("======================================");
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Ihr neues SMP-Passwort",
    html: `
      <p>Hallo ${escapeHtml(name)},</p>
      <p>für Ihr SMP-Konto wurde ein neues Passwort erstellt.</p>
      <p><strong>Ihr neues Passwort:</strong> ${escapeHtml(newPassword)}</p>
      <p>Bitte melden Sie sich mit diesem Passwort an.</p>
    `,
  });
}