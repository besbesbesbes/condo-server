const express = require("express");
const newRoute = express.Router();
const newController = require("../controllers/new-controller");
const authenticate = require("../middlewares/authenticate");
const upload = require("../middlewares/upload");

newRoute.get("/new-tran-info", authenticate, newController.newTranInfo);
newRoute.post("/add-new-type", authenticate, newController.addNewType);
newRoute.post("/delete-type", authenticate, newController.deleteType);
newRoute.post("/edit-type", authenticate, newController.editType);
newRoute.post(
  "/add-new-tran",
  authenticate,
  upload.array("images", 10),
  newController.addNewTran
);

module.exports = newRoute;
