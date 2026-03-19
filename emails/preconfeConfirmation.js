export function preconfeConfirmationEN(payment, preconfeOptions) {
  const total = Number(payment.amount / 100).toFixed(2); // assuming amount is in cents like Sberbank
  const formattedDate = new Date().toLocaleDateString("en-US");

  const itemRows = preconfeOptions.map(option => `
    <tr>
      <td style="padding:8px;">PreConfe: ${option.destination}</td>
      <td style="padding:8px; text-align:right;">Included</td>
    </tr>
  `).join("");

  return {
    subject: `PreConfe Payment Confirmation - LaConfe30`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo" alt="La Confe 30" style="width: 150px; height: auto;" />
        </div>
        <h2 style="color:#213cd2ff;">Hello ${payment.fullName},</h2>
        <p>Thank you for your PreConfe registration for LaConfe30. Here is your receipt:</p>

        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
          <tr style="background:#f3f3f3;">
            <th style="padding:8px; text-align:left; border-bottom:1px solid #ccc;">Item</th>
            <th style="padding:8px; text-align:right; border-bottom:1px solid #ccc;">Amount (USD)</th>
          </tr>
          ${itemRows}
          <tr style="font-weight:bold;">
            <td style="padding:8px;">Total Paid</td>
            <td style="padding:8px; text-align:right;">$${total}</td>
          </tr>
        </table>

        <p>Name: ${payment.fullName}</p>
        <p style="margin-top:20px;">Date: ${formattedDate}</p>
        <p>Order Number: ${payment.orderNumber}</p>
        <p>If you have any questions, please contact our support team.</p>

        <p>Best regards,<br/>LaConfe30 Organizing Committee</p>
      </div>
    `,
    attachments: [
      { filename: 'logo.png', path: 'public/logo.png', cid: 'logo' }
    ]
  };
}

export function preconfeConfirmationES(payment, preconfeOptions) {
  const total = Number(payment.amount / 100).toFixed(2);
  const formattedDate = new Date().toLocaleDateString("es-ES");

  const itemRows = preconfeOptions.map(option => `
    <tr>
      <td style="padding:8px;">PreConfe: ${option.destination}</td>
      <td style="padding:8px; text-align:right;">Incluido</td>
    </tr>
  `).join("");

  return {
    subject: `Confirmación de Pago PreConfe - LaConfe30`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo" alt="La Confe 30" style="width: 150px; height: auto;" />
        </div>
        <h2 style="color:#213cd2ff;">Hola ${payment.fullName},</h2>
        <p>Gracias por tu registro al PreConfe de LaConfe30. Aquí tienes tu recibo:</p>

        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
          <tr style="background:#f3f3f3;">
            <th style="padding:8px; text-align:left; border-bottom:1px solid #ccc;">Artículo</th>
            <th style="padding:8px; text-align:right; border-bottom:1px solid #ccc;">Monto (USD)</th>
          </tr>
          ${itemRows}
          <tr style="font-weight:bold;">
            <td style="padding:8px;">Total Pagado</td>
            <td style="padding:8px; text-align:right;">$${total}</td>
          </tr>
        </table>

        <p>Nombre: ${payment.fullName}</p>
        <p style="margin-top:20px;">Fecha: ${formattedDate}</p>
        <p>Número de Orden: ${payment.orderNumber}</p>
        <p>Si tienes alguna pregunta, por favor contacta a nuestro equipo de soporte.</p>

        <p>Saludos cordiales,<br/>Comité Organizador de LaConfe30</p>
      </div>
    `,
    attachments: [
      { filename: 'logo.png', path: 'public/logo.png', cid: 'logo' }
    ]
  };
}