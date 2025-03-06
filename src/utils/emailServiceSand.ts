import sgMail from "@sendgrid/mail";
import "dotenv/config";

export const sendEmail = async (to: string, subject: string, html: string) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  const msg = {
    to,
    from: {
      email: process.env.SENDER_EMAIL!,
      name: process.env.SENDER_NAME!,
    },
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    return { success: false, message: "Failed to send email" };
  }
};
