const express = require("express");
const chatRoute = express.Router();
const chatController = require("../controllers/chat-controller");
const authenticate = require("../middlewares/authenticate");

chatRoute.get("/", authenticate, chatController.getChatInfo);
chatRoute.post("/add", authenticate, chatController.addNewMsg);

module.exports = chatRoute;
