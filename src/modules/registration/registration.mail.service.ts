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
    secure: false, // port 587 => STARTTLS
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

export async function sendApprovalEmail(
  to: string,
  name: string,
  password: string,
  opts?: {
    subject?: string | null;
    introText?: string | null;
  }
) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log("[DEV EMAIL] SMTP not configured. Would send approval email to:", to);
    console.log("Password:", password);
    return;
  }

  const intro = (opts?.introText ?? "").trim();
  const introHtml = intro
    ? `<div style="margin-bottom:16px">${escapeHtml(intro).replace(/\n/g, "<br/>")}</div>`
    : "";

  const subject =
    (opts?.subject ?? "").trim() || "Your SMP registration has been approved";

  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html: `
        ${introHtml}
        <p>Hello ${escapeHtml(name)},</p>
        <p>Your registration for SMP has been approved.</p>
        <p><strong>Your login credentials:</strong></p>
        <ul>
          <li>Email: ${escapeHtml(to)}</li>
          <li>Password: <strong>${escapeHtml(password)}</strong></li>
        </ul>
      `,
    });

    console.log("[APPROVAL EMAIL SENT] Sent to:", to);
  } catch (err) {
    console.error("[APPROVAL EMAIL ERROR]", err);
    throw err;
  }
}