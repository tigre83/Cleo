import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const result = await resend.emails.send({
      from: 'Cleo <soporte@cleoia.app>',
      to: email,
      subject: 'Tu código de verificación de Cleo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verifica tu email</h2>
          <p>Tu código de verificación es:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="letter-spacing: 10px; color: #4ADE80;">${code}</h1>
          </div>
          <p>Este código expira en 15 minutos.</p>
          <p>Si no solicitaste este código, ignora este email.</p>
        </div>
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
