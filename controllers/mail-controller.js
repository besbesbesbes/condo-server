const prisma = require("../models/index");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const nodemailer = require("nodemailer");

module.exports.newTran = tryCatch(async (req, res, next) => {
  const { to, subject, text } = req.body;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // or 587
    secure: true, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000, // 10s timeout so it won't hang forever
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
