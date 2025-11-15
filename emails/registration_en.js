import path from "path";

export default function registrationEmailEN(firstName) {
  return {
    subject: "Account Registration Successful - LaConfe26",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:confe_logo" alt="La Confe 26" style="width: 150px; height: auto;" />
        </div>

        <!-- Heading -->
        <h2 style="text-align: center; color: #213cd2ff;">Welcome to LaConfe26!</h2>

        <!-- Message -->
        <p>Hi ${firstName},</p>

        <p>Thank you for creating an account for <strong>LaConfe26</strong>! You can now log in and continue using the website to purchase your accommodation and conference access before the deadline. We encourage you to complete your selections early to secure your preferred options.</p>

        <p>We have attached an <strong>information PDF</strong> that explains the full process step-by-step, including registration, payment, accommodations, and event guidelines.</p>

        <p>If you have any questions, feel free to reach out to our support team.</p>

        <p style="margin-top: 30px;">Warm regards,<br/>La Confe 26 Organizing Committee</p>

        <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999; text-align: center;">© 2025 La Confe 26. All rights reserved.</p>
      </div>
    `,
    attachments: [
      {
        filename: "logo.png",
        path: path.join(process.cwd(), "public", "logo.png"),
        cid: "confe_logo", // <--- referenced in HTML as cid:confe_logo
      },
    ],
  };
}
