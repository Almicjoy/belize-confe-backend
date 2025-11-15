export function paymentConfirmationEN(payment, user, room) {
  const total = Number(payment.amount).toFixed(2);
  const formattedDate = new Date().toLocaleDateString("en-US");

  const perInstallment = payment.installments > 1 
    ? (total / payment.installments).toFixed(2)
    : total;

  const promoPerInstallment = payment.promoCode && payment.installments > 1 
    ? (total / payment.installments * 0.1).toFixed(2) // Example discount calc
    : null;

  return {
    subject: `Payment Confirmation - LaConfe26`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <img src="cid:logo" alt="LaConfe26 Logo" style="width:150px; margin-bottom:20px;" />
        <h2 style="color:#D22163;">Hello ${user.firstName},</h2>
        <p>Thank you for your payment for La Confe 26. Here is your receipt:</p>

        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
          <tr style="background:#f3f3f3;">
            <th style="padding:8px; text-align:left; border-bottom:1px solid #ccc;">Item</th>
            <th style="padding:8px; text-align:right; border-bottom:1px solid #ccc;">Amount (USD)</th>
          </tr>
          <tr>
            <td style="padding:8px;">Accommodation: ${room.name}</td>
            <td style="padding:8px; text-align:right;">$${Number(room.price).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px;">Payment Plan: ${payment.installments} installment(s)</td>
            <td style="padding:8px; text-align:right;">$${perInstallment}</td>
          </tr>
          ${payment.promoCode ? `<tr><td style="padding:8px;">Promo Applied: ${payment.promoCode}</td><td style="padding:8px; text-align:right;">-${promoPerInstallment}</td></tr>` : ""}
          <tr style="font-weight:bold;">
            <td style="padding:8px;">Total Paid</td>
            <td style="padding:8px; text-align:right;">$${total}</td>
          </tr>
        </table>

        <p style="margin-top:20px;">Date: ${formattedDate}</p>
        <p>Order Number: ${payment.orderNumber}</p>
        <p>If you have any questions, please contact our support team.</p>

        <p>Best regards,<br/>La Confe 26 Organizing Committee</p>
      </div>
    `,
    attachments: [
      { filename: 'logo.png', path: 'public/logo.png', cid: 'logo' }
    ]
  };
}

export function paymentConfirmationES(payment, user, room) {
  const total = Number(payment.amount).toFixed(2);
  const formattedDate = new Date().toLocaleDateString("es-ES");

  const perInstallment = payment.installments > 1 
    ? (total / payment.installments).toFixed(2)
    : total;

  const promoPerInstallment = payment.promoCode && payment.installments > 1 
    ? (total / payment.installments * 0.1).toFixed(2) 
    : null;

  return {
    subject: `Confirmación de Pago - LaConfe26`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <img src="cid:logo" alt="LaConfe26 Logo" style="width:150px; margin-bottom:20px;" />
        <h2 style="color:#D22163;">Hola ${user.firstName},</h2>
        <p>Gracias por tu pago para La Confe 26. Aquí está tu recibo:</p>

        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
          <tr style="background:#f3f3f3;">
            <th style="padding:8px; text-align:left; border-bottom:1px solid #ccc;">Artículo</th>
            <th style="padding:8px; text-align:right; border-bottom:1px solid #ccc;">Monto (USD)</th>
          </tr>
          <tr>
            <td style="padding:8px;">Alojamiento: ${room.name}</td>
            <td style="padding:8px; text-align:right;">$${Number(room.price).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px;">Plan de Pago: ${payment.installments} cuota(s)</td>
            <td style="padding:8px; text-align:right;">$${perInstallment}</td>
          </tr>
          ${payment.promoCode ? `<tr><td style="padding:8px;">Promo Aplicado: ${payment.promoCode}</td><td style="padding:8px; text-align:right;">-${promoPerInstallment}</td></tr>` : ""}
          <tr style="font-weight:bold;">
            <td style="padding:8px;">Total Pagado</td>
            <td style="padding:8px; text-align:right;">$${total}</td>
          </tr>
        </table>

        <p style="margin-top:20px;">Fecha: ${formattedDate}</p>
        <p>Número de Orden: ${payment.orderNumber}</p>
        <p>Si tienes alguna pregunta, por favor contacta a nuestro equipo de soporte.</p>

        <p>Saludos cordiales,<br/>Comité Organizador de La Confe 26</p>
      </div>
    `,
    attachments: [
      { filename: 'logo.png', path: 'public/logo.png', cid: 'logo' }
    ]
  };
}
