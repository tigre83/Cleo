const { Resend } = require('resend');

const resend = new Resend('re_Kcc3C8LB_8kHgdSsr2gH65JtnkB6URNgg');

resend.emails.send({
  from: 'Cleo <soporte@cleoia.app>',
  to: 'francisco_gomez26@hotmail.com',
  subject: 'Test de Resend',
  html: '<h1>Hola Francisco</h1><p>Este es un test de Resend</p>'
}).then(result => {
  console.log('✅ Email enviado:', result);
}).catch(error => {
  console.error('❌ Error:', error);
});
