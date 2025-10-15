const prisma = require("../models/index");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

module.exports.newTran = tryCatch(async (req, res, next) => {
  const { to, subject, text } = req.body;

  const sentFrom = new Sender(
    "info@test-zkq340ewj5kgd796.mlsender.net",
    "KB Admin"
  );
  const recipients = [new Recipient(to, "Customer")];

  const htmlText = text.replace(/\n/g, "<br>");
  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(subject)
    .setHtml(htmlText)
    .setText(text);

  await mailerSend.email.send(emailParams);

  res.json({
    message: "Send email successful...",
  });
});
