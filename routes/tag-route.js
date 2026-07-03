const express = require("express");
const tagRoute = express.Router();
const tagController = require("../controllers/tag-controller");
const authenticate = require("../middlewares/authenticate");

tagRoute.get("/get-tag", authenticate, tagController.getTag);
tagRoute.post("/get-tag-tran", authenticate, tagController.getTagTran);
tagRoute.post("/edit-tag-tran", authenticate, tagController.editTagTran);
tagRoute.get("/get-recent-tag", authenticate, tagController.getRecentTag);

module.exports = tagRoute;
