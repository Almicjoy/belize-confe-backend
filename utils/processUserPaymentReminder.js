async function processUserPaymentReminder(user, flags) {
  const { isBeginning, isMiddle, isBeforeEnd } = flags;

  const payments = await Payment.find({ email: user.email, status: "1" }).sort("createdAt");
  if (payments.length === 0) return; // No valid payments yet → skip

  const firstPayment = payments[0];
  const successfulPaymentsCount = payments.length;
  const totalInstallments = Number(firstPayment.planId);
  if (successfulPaymentsCount >= totalInstallments) return; // fully paid

  // Calculate next due date (last day of the month)
  const firstDate = new Date(firstPayment.createdAt);
  const nextInstallmentIndex = successfulPaymentsCount;

  const nextDueDate = new Date(
    firstDate.getFullYear(),
    firstDate.getMonth() + 1 + nextInstallmentIndex,
    0
  );

  // Only send emails for payments due THIS month
  const now = new Date();
  if (
    nextDueDate.getMonth() !== now.getMonth() ||
    nextDueDate.getFullYear() !== now.getFullYear()
  ) {
    return;
  }

  // If today is a valid reminder day → send email
  let subject, html;

  if (user.locale === "es") {
    ({ subject, html } = paymentReminderEmailES(user, nextDueDate));
  } else {
    ({ subject, html } = paymentReminderEmailEN(user, nextDueDate));
  }

  await sendMail({
    to: user.email,
    subject,
    html,
    attachments: [
      { filename: "logo.png", path: "public/logo.png", cid: "logo" }
    ]
  });

  console.log(`Reminder email sent to ${user.email}`);
}
