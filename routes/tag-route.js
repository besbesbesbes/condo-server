const express = require("express");
const tagRoute = express.Router();
const tagController = require("../controllers/tag-controller");
const authenticate = require("../middlewares/authenticate");

tagRoute.get("/get-tag", authenticate, tagController.getTag);
tagRoute.post("/get-tag-tran", authenticate, tagController.getTagTran);

module.exports = tagRoute;
