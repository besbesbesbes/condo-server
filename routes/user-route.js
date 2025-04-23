const express = require("express");
const userRoute = express.Router();
const userController = require("../controllers/user-controller");
const authenticate = require("../middlewares/authenticate");

userRoute.get("/", authenticate, userController.userInfo);
userRoute.post("/change-password", authenticate, userController.changePassword);

module.exports = userRoute;
