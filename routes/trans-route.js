const express = require("express");
const transRoute = express.Router();
const transController = require("../controllers/trans-controller");
const authenticate = require("../middlewares/authenticate");

transRoute.post("/", authenticate, transController.getTrans);
transRoute.post("/edit-tran", authenticate, transController.editTran);
transRoute.post("/delete-tran", authenticate, transController.deleteTran);

module.exports = transRoute;
