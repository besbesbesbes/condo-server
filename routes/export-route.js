const express = require("express");
const exportRoute = express.Router();
const exportController = require("../controllers/export-controller");
const authenticate = require("../middlewares/authenticate");

exportRoute.get("/", authenticate, exportController.exportReport);

module.exports = exportRoute;
