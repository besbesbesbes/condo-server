require("dotenv").config();
const express = require("express");
const app = express();
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

// //middleware
app.use(cors());
app.use(express.json());

// routing
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/new", newRoute);
app.use("/api/trans", transRoute);
app.use("/api/report", reportRoute);
app.use("/api/test", testRoute);
app.use("/api/chat", chatRoute);
app.use(notFound);
app.use(errorMiddleware);

// start server
const port = process.env.PORT || 8009;
app.listen(port, () => console.log("SERVER ON: ", port));
