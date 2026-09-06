import nodemailer from "nodemailer";

export interface SendEmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

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

  attachments?: SendEmailAttachment[];
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | null;
}

export async function sendEtherealEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const transporter = nodemailer.createTransport({
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

    html: input.body,

    text: input.body
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),

    ...(input.attachments?.length
      ? {
          attachments: input.attachments.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType,
          })),
        }
      : {}),

    messageId: `<${input.emailId}@reachinbox.local>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    previewUrl:
      typeof previewUrl === "string"
        ? previewUrl
        : null,
  };
}