const prisma = require("../models/index");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports.register = tryCatch(async (req, res, next) => {
  const { name, password } = req.body;
  // validate
  if (!(name && password)) {
    createError(400, "Body lack!");
  }
  if (!(typeof name == "string" && typeof password == "string")) {
    createError(400, "All data should be string!");
  }
  if (!(name.trim() && password.trim())) {
    createError(400, "Please fill all data!");
  }
  const isUserExist = await prisma.user.findUnique({
    where: {
      userName: name,
    },
  });
  if (isUserExist) {
    createError(400, "user already exist!");
  }
  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  // create new user
  const newUser = await prisma.user.create({
    data: {
      userName: name,
      userPassword: hashedPassword,
    },
    select: {
      userId: true,
      userName: true,
    },
  });

  res.json({ msg: "Register successful...", newUser });
});
module.exports.login = tryCatch(async (req, res, next) => {
  const { name, password } = req.body;
  //validate
  if (!(name.trim() && password.trim())) {
    createError(400, "Please fill all data!");
  }
  if (!(typeof name == "string" && typeof password == "string")) {
    createError(400, "All data should be string!");
  }
  const user = await prisma.user.findUnique({
    where: {
      userName: name,
    },
  });
  if (!user) {
    createError(400, "User not found!");
  }
  //compare password
  const isPasswordMatch = await bcrypt.compare(password, user.userPassword);
  if (!isPasswordMatch) {
    return createError(400, "Email or password is invalid!");
  }
  //create access token
  const token = jwt.sign({ id: user.userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
  //reuturn user
  const returnUser = await prisma.user.findUnique({
    where: {
      userId: user.userId,
    },
    select: {
      userId: true,
      userName: true,
    },
  });
  res.json({ token, user: returnUser, msg: "Login successful..." });
});
