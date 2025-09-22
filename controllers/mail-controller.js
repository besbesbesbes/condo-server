const prisma = require("../models/index");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const { google } = require("googleapis");
const MailComposer = require("nodemailer/lib/mail-composer");

module.exports.newTran = tryCatch(async (req, res, next) => {
  const { to, subject, text } = req.body;

  // 1) Build the mail (RFC 2822)
  const htmlText = text.replace(/\n/g, "<br>");
  const mailOptions = {
    from: `"KB Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html: `<p>${htmlText}</p>`,
  };

  const mailComposer = new MailComposer(mailOptions);
  const messageBuffer = await new Promise((resolve, reject) => {
    mailComposer.compile().build((err, message) => {
      if (err) return reject(err);
      resolve(message); // Buffer
    });
  });

  // 2) base64url encode the RFC822 message for Gmail API
  const raw = messageBuffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // 3) Authorize with OAuth2 (use refresh token stored in env)
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  // 4) Send via Gmail API
  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
    },
  });

  res.json({ message: "Email sent successfully" });
});
