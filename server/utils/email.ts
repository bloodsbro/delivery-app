import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user, 
        pass: testAccount.pass, 
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: '"Delivery App" <no-reply@delivery.app>', 
      to,
      subject,
      text, 
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2>${subject}</h2>
        <p>${text}</p>
        <hr>
        <small>Це автоматичне повідомлення.</small>
      </div>`,
    });

    console.log(`[Email] Message sent: ${info.messageId}`);
    console.log(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
  }
};
