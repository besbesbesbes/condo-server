const express = require("express");
const buddyRoute = express.Router();
const buddyController = require("../controllers/buddy-controller");
const authenticate = require("../middlewares/authenticate");

buddyRoute.post("/request", authenticate, buddyController.requestBuddy);

module.exports = buddyRoute;
