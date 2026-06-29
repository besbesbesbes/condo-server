const express = require("express");
const memoRoute = express.Router();
const memoController = require("../controllers/memo-controller");
const authenticate = require("../middlewares/authenticate");

memoRoute.get("/get-memo", authenticate, memoController.getMemo);
memoRoute.post("/add-memo", authenticate, memoController.addMemo);
memoRoute.post("/edit-memo", authenticate, memoController.editMemo);
memoRoute.post("/delete-memo", authenticate, memoController.deleteMemo);

module.exports = memoRoute;
