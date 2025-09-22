const prisma = require("../models/index");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const nodemailer = require("nodemailer");

module.exports.newTran = tryCatch(async (req, res, next) => {
  const { to, subject, text } = req.body;

  // Use SMTP transport instead of Gmail service
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER, // your Gmail
      pass: process.env.EMAIL_PASS, // 16-char app password
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  const htmlText = text.replace(/\n/g, "<br>");
  const mailOptions = {
    from: `"KB Admin" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    text: text,
    html: `<p>${htmlText}</p>`,
  };

  await transporter.sendMail(mailOptions);

  res.json({ message: "Email sent successfully" });
});
