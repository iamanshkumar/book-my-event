import nodemailer from "nodemailer";
import { Resend } from "resend";
import { getSmtpSettings, getGeneralSettings } from "@/backend/lib/settings";

const defaultResendClient = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<any> {
  try {
    const smtp = await getSmtpSettings();
    const general = await getGeneralSettings();

    const fromName = general.websiteTitle || "BookMyEvent";
    
    const hostServer = smtp.smtpServer ? smtp.smtpServer.trim() : "";
    const smtpUser = smtp.smtpUser ? smtp.smtpUser.trim() : "";
    const smtpPassword = smtp.smtpPassword ? smtp.smtpPassword.trim() : "";

    // Check if the SMTP server is configured and is not default "localhost"
    const hasSmtpServer = hostServer !== "" && hostServer !== "localhost";

    if (hasSmtpServer) {
      console.log(`[Mail Dispatcher] Routing email to ${to} via SMTP: ${hostServer}:${smtp.smtpPort}`);
      
      const transportConfig: any = {
        host: hostServer,
        port: smtp.smtpPort,
        secure: smtp.smtpProtocol === "SSL" || smtp.smtpPort === 465,
      };

      if (smtpUser || smtpPassword) {
        transportConfig.auth = {
          user: smtpUser,
          pass: smtpPassword,
        };
      }

      const transporter = nodemailer.createTransport(transportConfig);

      const fromAddress = smtpUser || "onboarding@resend.dev";
      const fromField = `"${fromName}" <${fromAddress}>`;

      const result = await transporter.sendMail({
        from: fromField,
        to,
        subject,
        html,
      });

      return result;
    } else {
      console.log(`[Mail Dispatcher] SMTP not configured. Falling back to Resend API for ${to}`);
      const fromField = `BookMyEvent <onboarding@resend.dev>`;
      
      const result = await defaultResendClient.emails.send({
        from: fromField,
        to,
        subject,
        html,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to send email via Resend API.");
      }

      return result.data;
    }
  } catch (err: any) {
    console.error("[Mail Dispatcher Error]", err);
    throw err;
  }
}
