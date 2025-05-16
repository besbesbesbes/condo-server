const express = require("express");
const mailRoute = express.Router();
const mailController = require("../controllers/mail-controller");
const authenticate = require("../middlewares/authenticate");

mailRoute.post("/addTran", authenticate, mailController.newTran);

module.exports = mailRoute;
