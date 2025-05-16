const express = require("express");
const mailRoute = express.Router();
const mailController = require("../controllers/mail-controller");

mailRoute.post("/test", mailController.testSendMail);

module.exports = mailRoute;
