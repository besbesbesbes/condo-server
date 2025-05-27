require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error");
const notFound = require("./middlewares/not-found");
const authRoute = require("./routes/auth-route");
const userRoute = require("./routes/user-route");
const newRoute = require("./routes/new-route");
const transRoute = require("./routes/trans-route");
const reportRoute = require("./routes/report-route");
const testRoute = require("./routes/test-route");
const chatRoute = require("./routes/chat-route");
const mailRoute = require("./routes/mail-route");
const exportRoute = require("./routes/export-route");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Log every user who connects via socket
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// //middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Attach io to every req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// routing
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/new", newRoute);
app.use("/api/trans", transRoute);
app.use("/api/report", reportRoute);
app.use("/api/test", testRoute);
app.use("/api/chat", chatRoute);
app.use("/api/mail", mailRoute);
app.use("/api/export", exportRoute);
app.use(notFound);
app.use(errorMiddleware);

// start server
const port = process.env.PORT || 8009;
server.listen(port, () => console.log("SERVER ON:", port));
