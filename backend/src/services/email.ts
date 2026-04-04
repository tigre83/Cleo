import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const digits = code.split('');
    const digitBoxes = digits
      .map(
        (d) =>
          `<td style="width:48px;height:56px;background:#111111;border:1px solid #222222;border-radius:10px;text-align:center;font-size:28px;font-weight:700;font-family:'Courier New',monospace;color:#4ADE80;letter-spacing:2px;">${d}</td>`
      )
      .join('<td style="width:8px;"></td>');

    const result = await resend.emails.send({
      from: 'Cleo <soporte@cleoia.app>',
      to: email,
      subject: 'Verifica tu email — Cleo',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080808;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <!-- Logo -->
        <tr><td style="text-align:center;padding-bottom:32px;">
          <span style="font-size:32px;font-weight:800;color:#4ADE80;">Cleo</span>
        </td></tr>
        <!-- Card -->
        <tr><td style="background:#0D0D0D;border:1px solid #1A1A1A;border-radius:16px;padding:40px 36px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#FFFFFF;">Verifica tu email</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#888888;line-height:1.5;">
            Ingresa este código en Cleo para activar tu cuenta. Expira en 15 minutos.
          </p>
          <!-- Code digits -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
            <tr>${digitBoxes}</tr>
          </table>
          <!-- Divider -->
          <div style="height:1px;background:linear-gradient(to right,transparent,#222222,transparent);margin:0 0 20px;"></div>
          <p style="margin:0;font-size:13px;color:#555555;line-height:1.5;">
            Si no creaste una cuenta en Cleo, puedes ignorar este mensaje.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="text-align:center;padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#444444;">
            &copy; ${new Date().getFullYear()} Cleo &mdash; Tu asistente de ventas con IA
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });

    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(email: string, companyName: string) {
  try {
    const result = await resend.emails.send({
      from: 'Cleo <soporte@cleoia.app>',
      to: email,
      subject: '¡Bienvenido a Cleo!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Bienvenido, ${companyName}!</h2>
          <p>Tu IA ya está activa y lista para trabajar 24/7.</p>
          <p>Próximos pasos:</p>
          <ol>
            <li>Configura tu negocio en el dashboard</li>
            <li>Conecta tu WhatsApp</li>
            <li>Comparte tu número con tus clientes</li>
          </ol>
        </div>
      `,
    });

    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}
