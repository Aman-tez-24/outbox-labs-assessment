import nodemailer from "nodemailer";

export interface SendEmailInput {
  emailId: string;

  from: {
    name: string;
    email: string;
  };

  smtpUser: string;
  smtpPassword: string;

  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | null;
}

export async function sendEtherealEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const transporter =
    nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,

      auth: {
        user: input.smtpUser,
        pass: input.smtpPassword,
      },
    });

  const info = await transporter.sendMail({
    from: `"${input.from.name}" <${input.from.email}>`,

    to: input.to,

    subject: input.subject,

    text: input.body,

    html: input.body.replace(
      /\n/g,
      "<br />",
    ),

    messageId:
      `<${input.emailId}@reachinbox.local>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

return {
  messageId: info.messageId,
  previewUrl: typeof previewUrl === "string" ? previewUrl : null,
};
}