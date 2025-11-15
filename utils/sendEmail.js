import nodemailer from "nodemailer";

export default async function sendEmail({ to, subject, html, attachments = [] }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"LaConfe26" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
}
