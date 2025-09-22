const prisma = require("../models/index");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const nodemailer = require("nodemailer");
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });

module.exports.newTran = tryCatch(async (req, res, next) => {
  const { to, subject, text } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"KB Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent:", info.response);

  res.json({ message: "Email sent successfully" });
});
