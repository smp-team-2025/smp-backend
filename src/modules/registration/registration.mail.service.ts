import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "SMP <onboarding@resend.dev>";

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
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
  const client = getResend();

  if (!client) {
    console.log("[DEV EMAIL] Would send approval email to:", to);
    console.log("Password:", password);
    return;
  }

  const escapeHtml = (input: string) =>
    input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const intro = (opts?.introText ?? "").trim();
  const introHtml = intro
    ? `<div style="margin-bottom:16px">${escapeHtml(intro).replace(/\n/g, "<br/>")}</div>`
    : "";

  const subject = (opts?.subject ?? "").trim() || "Your SMP registration has been approved";

  try {
    await client.emails.send({
      from: FROM,
      to,
      subject,
      html: `
        ${introHtml}
        <p>Hello ${name},</p>
        <p>Your registration for SMP has been approved.</p>
        <p><strong>Your login credentials:</strong></p>
        <ul>
          <li>Email: ${to}</li>
          <li>Password: <strong>${password}</strong></li>
        </ul>
      `,
    });
  } catch (err) {
    console.error("[APPROVAL EMAIL ERROR]", err);
  }
}