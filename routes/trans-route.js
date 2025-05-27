const express = require("express");
const transRoute = express.Router();
const transController = require("../controllers/trans-controller");
const authenticate = require("../middlewares/authenticate");
const upload = require("../middlewares/upload");

transRoute.post("/", authenticate, transController.getTrans);
transRoute.post(
  "/edit-tran",
  authenticate,
  upload.array("images", 10),
  transController.editTran
);
transRoute.post("/delete-tran", authenticate, transController.deleteTran);
transRoute.post("/delete-photo", authenticate, transController.deletePhoto);

module.exports = transRoute;
