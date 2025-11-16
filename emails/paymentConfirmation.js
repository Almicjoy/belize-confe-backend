export function paymentConfirmationEN(payment, user, room) {
  const total = Number(payment.amount).toFixed(2);
  const formattedDate = new Date().toLocaleDateString("en-US");

  const actualInstallment = (room.price / payment.planId).toFixed(2);

  const perInstallment = (total * 0.01 / 2).toFixed(2);

  const fullPromo = payment.promoCode && Number(payment.planId) > 1 
    ? (room.price * 0.05).toFixed(2) // Example discount calc
    : null;

  const promoPerInstallment = payment.promoCode && Number(payment.planId) > 1 
    ? ((total * 0.01 / 2) * 0.05).toFixed(2) // Example discount calc
    : null;

  return {
    subject: `Payment Confirmation - LaConfe26`,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo" alt="La Confe 26" style="width: 150px; height: auto;" />
        </div>
        <h2 style="color:#213cd2ff;">Hello ${user.firstName},</h2>
        <p>Thank you for your payment for LaConfe26. Here is your receipt:</p>

        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
          <tr style="background:#f3f3f3;">
            <th style="padding:8px; text-align:left; border-bottom:1px solid #ccc;">Item</th>
            <th style="padding:8px; text-align:right; border-bottom:1px solid #ccc;">Amount (USD)</th>
          </tr>
          <tr>
            <td style="padding:8px;">Accommodation: ${room.name}</td>
            <td style="padding:8px; text-align:right;">$${Number(room.price).toFixed(2)}</td>
          </tr>
          ${payment.promoCode ? `<tr><td style="padding:8px;">Full Discount Applied: ${payment.promoCode}</td><td style="padding:8px; text-align:right;">-${fullPromo}</td></tr>` : ""}
          <tr>
            <td style="padding:8px;">Per Installment Amount: ${payment.planId} installment(s)</td>
            <td style="padding:8px; text-align:right;">$${actualInstallment}</td>
          </tr>
          ${payment.promoCode ? `<tr><td style="padding:8px;">Promo Applied: ${payment.promoCode}</td><td style="padding:8px; text-align:right;">-${promoPerInstallment}</td></tr>` : ""}
          <tr style="font-weight:bold;">
            <td style="padding:8px;">Total Paid</td>
            <td style="padding:8px; text-align:right;">$${perInstallment}</td>
          </tr>
        </table>

        <p>Name: ${user.firstName} ${user.lastName}</p>
        <p style="margin-top:20px;">Date: ${formattedDate}</p>
        <p>Order Number: ${payment.orderNumber}</p>
        <p>Payment Plan: ${payment.planId} installment(s)</p>
        <p>If you have any questions, please contact our support team.</p>

        <p>Best regards,<br/>LaConfe26 Organizing Committee</p>
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

  const actualInstallment = (room.price / payment.planId).toFixed(2);

  const perInstallment = (total * 0.01 / 2).toFixed(2);

  const fullPromo = payment.promoCode && Number(payment.planId) > 1 
    ? (room.price * 0.05).toFixed(2)
    : null;

  const promoPerInstallment = payment.promoCode && Number(payment.planId) > 1 
    ? ((total * 0.01 / 2) * 0.05).toFixed(2)
    : null;

  return {
    subject: `Confirmación de Pago - LaConfe26`,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo" alt="La Confe 26" style="width: 150px; height: auto;" />
        </div>
        <h2 style="color:#213cd2ff;">Hola ${user.firstName},</h2>
        <p>Gracias por tu pago para LaConfe26. Aquí tienes tu recibo:</p>

        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
          <tr style="background:#f3f3f3;">
            <th style="padding:8px; text-align:left; border-bottom:1px solid #ccc;">Artículo</th>
            <th style="padding:8px; text-align:right; border-bottom:1px solid #ccc;">Monto (USD)</th>
          </tr>
          <tr>
            <td style="padding:8px;">Alojamiento: ${room.name}</td>
            <td style="padding:8px; text-align:right;">$${Number(room.price).toFixed(2)}</td>
          </tr>
          ${payment.promoCode ? `<tr><td style="padding:8px;">Descuento Completo Aplicado: ${payment.promoCode}</td><td style="padding:8px; text-align:right;">-${fullPromo}</td></tr>` : ""}
          <tr>
            <td style="padding:8px;">Monto por Cuota: ${payment.planId} cuota(s)</td>
            <td style="padding:8px; text-align:right;">$${actualInstallment}</td>
          </tr>
          ${payment.promoCode ? `<tr><td style="padding:8px;">Descuento por Cuota: ${payment.promoCode}</td><td style="padding:8px; text-align:right;">-${promoPerInstallment}</td></tr>` : ""}
          <tr style="font-weight:bold;">
            <td style="padding:8px;">Total Pagado</td>
            <td style="padding:8px; text-align:right;">$${perInstallment}</td>
          </tr>
        </table>

        <p>Nombre: ${user.firstName} ${user.lastName}</p>
        <p style="margin-top:20px;">Fecha: ${formattedDate}</p>
        <p>Número de Orden: ${payment.orderNumber}</p>
        <p>Plan de Pago: ${payment.planId} cuota(s)</p>
        <p>Si tienes alguna pregunta, por favor contacta a nuestro equipo de soporte.</p>

        <p>Saludos cordiales,<br/>Comité Organizador de LaConfe26</p>
      </div>
    `,
    attachments: [
      { filename: 'logo.png', path: 'public/logo.png', cid: 'logo' }
    ]
  };
}
