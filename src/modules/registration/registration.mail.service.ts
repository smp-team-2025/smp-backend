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
  password: string
) {
  const client = getResend();

  if (!client) {
    console.log("[DEV EMAIL] Would send approval email to:", to);
    console.log("Password:", password);
    return;
  }

  try {
    await client.emails.send({
      from: FROM,
      to,
      subject: "Your SMP registration has been approved",
      html: `
        <p>Hello ${name},</p>
        <p>Your registration for SMP has been approved.</p>
        <p><strong>Your login credentials:</strong></p>
        <ul>
          <li>Email: ${to}</li>
          <li>Password: <strong>${password}</strong></li>
        </ul>
        <p>Please log in and change your password immediately.</p>
      `,
    });
  } catch (err) {
    console.error("[APPROVAL EMAIL ERROR]", err);
  }
}