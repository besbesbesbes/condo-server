const express = require("express");
const reportRoute = express.Router();
const reportController = require("../controllers/report-controller");
const authenticate = require("../middlewares/authenticate");

reportRoute.post("/", authenticate, reportController.getReportInfo);
module.exports = reportRoute;
