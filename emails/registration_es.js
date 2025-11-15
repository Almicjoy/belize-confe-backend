import path from "path";

export default function registrationEmailES(firstName) {
  return {
    subject: "Registro de Cuenta Exitoso - LaConfe26",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:confe_logo" alt="La Confe 26" style="width: 150px; height: auto;" />
        </div>

        <!-- Heading -->
        <h2 style="text-align: center; color: #213cd2ff;">¡Bienvenido a LaConfe26!</h2>

        <!-- Message -->
        <p>Hola ${firstName},</p>

        <p>¡Gracias por crear una cuenta para <strong>LaConfe26</strong>! Ahora puedes iniciar sesión y continuar usando el sitio web para comprar tu alojamiento y acceso a la conferencia antes de la fecha límite. Te recomendamos completar tus elecciones lo antes posible para asegurar tus opciones preferidas.</p>

        <p>Hemos adjuntado un <strong>PDF informativo</strong> que explica todo el proceso paso a paso, incluyendo registro, pago, alojamiento y las directrices del evento.</p>

        <p>Si tienes alguna pregunta, no dudes en comunicarte con nuestro equipo de soporte.</p>

        <p style="margin-top: 30px;">Saludos cordiales,<br/>Comité Organizador de La Confe26</p>

        <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999; text-align: center;">© 2025 La Confe 26. Todos los derechos reservados.</p>
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
