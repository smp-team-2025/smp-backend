import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "SMP <onboarding@resend.dev>";

export async function sendApprovalEmail(
  to: string,
  name: string,
  password: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[DEV EMAIL] RESEND_API_KEY missing. Would email:", to);
    return;
  }




/**
 * NOTES:
 * - Emails are currently sent using Resend's default onboarding domain.
 * - Optional: Once a custom domain is purchased and verified in Resend,
 *             the EMAIL_FROM address should be updated accordingly.           
 */

  try {
    await resend.emails.send({
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
      `,
    });
  } catch (err) {
    console.error("[APPROVAL EMAIL ERROR]", err);
  }
}
