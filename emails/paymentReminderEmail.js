export function paymentReminderEmailEN(user, dueDate) {
  const formatted = dueDate.toLocaleDateString("en-US");

  return {
    subject: "Upcoming Payment Reminder - LaConfe30",
    html: `
      <div style="font-family: Arial; color:#333; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo" alt="La Confe 30" style="width: 150px; height: auto;" />
        </div>

        <h2 style="color:#213cd2ff;">Hello ${user.firstName},</h2>

        <p>This is a reminder that your next installment payment for LaConfe30 is due soon.</p>

        <p><strong>Due Date:</strong> ${formatted} (End of the month)</p>

        <p>Please make your payment through the following link:</p>

        <p>
          <a href="https://la-confe-bz.vercel.app/es/login" 
             style="background:#213cd2ff; color:white; padding:10px 16px; border-radius:6px; text-decoration:none;">
             Access Payment Portal
          </a>
        </p>

        <p>If you have already made this payment, please disregard this message.</p>

        <p>Best regards,<br/>LaConfe30 Organizing Committee</p>
      </div>
    `
  };
}

export function paymentReminderEmailES(user, dueDate) {
  const formatted = dueDate.toLocaleDateString("es-ES");

  return {
    subject: "Recordatorio de Pago Próximo - LaConfe30",
    html: `
      <div style="font-family: Arial; color:#333; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo" alt="La Confe 30" style="width: 150px; height: auto;" />
        </div>

        <h2 style="color:#213cd2ff;">Hola ${user.firstName},</h2>

        <p>Este es un recordatorio de que tu próxima cuota de pago para LaConfe30 vence pronto.</p>

        <p><strong>Fecha de Vencimiento:</strong> ${formatted} (Fin de mes)</p>

        <p>Por favor realiza tu pago en el siguiente enlace:</p>

        <p>
          <a href="https://la-confe-bz.vercel.app/es/login" 
             style="background:#213cd2ff; color:white; padding:10px 16px; border-radius:6px; text-decoration:none;">
             Acceder al Portal de Pagos
          </a>
        </p>

        <p>Si ya realizaste este pago, por favor ignora este mensaje.</p>

        <p>Saludos cordiales,<br/>Comité Organizador de LaConfe30</p>
      </div>
    `
  };
}
