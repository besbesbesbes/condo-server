const crypto = require("crypto");
const prisma = require("../models/index");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports.register = tryCatch(async (req, res, next) => {
  const { userName, password, confirmPassword } = req.body;
  if (!userName || !password || !confirmPassword) {
    return createError(400, "Please fill all fields");
  }

  if (password !== confirmPassword) {
    return createError(400, "Password does not match");
  }

  // 2. Check system setting
  const registerSetting = await prisma.test.findUnique({
    where: {
      testId: 2,
    },
  });

  if (!registerSetting || registerSetting.test !== "1") {
    return createError(403, "New registration is currently disabled.");
  }

  const existUser = await prisma.user.findUnique({
    where: {
      userName,
    },
  });

  if (existUser) {
    return createError(400, "Username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const dummyPassword = await bcrypt.hash(crypto.randomUUID(), 10);

  const newUser = await prisma.$transaction(async (tx) => {
    // Create real user
    const realUser = await tx.user.create({
      data: {
        userName,
        userPassword: hashedPassword,
      },
    });

    // Create dummy user
    const dummyUser = await tx.user.create({
      data: {
        userName: `dummy${userName}`,
        userPassword: dummyPassword,
        isDummy: true,
        ownerUserId: realUser.userId,
      },
    });

    // Create buddy relationship
    await tx.buddy.create({
      data: {
        user1Id: realUser.userId,
        user2Id: dummyUser.userId,
      },
    });

    return realUser;
  });

  const payload = {
    userId: newUser.userId,
    userName: newUser.userName,
  };

  const token = jwt.sign({ id: newUser.userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.json({
    msg: "Register successful",
    token,
    user: payload,
  });
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
      buddyAsUser1: {
        select: {
          user2: {
            select: {
              userId: true,
              userName: true,
              isDummy: true,
            },
          },
        },
      },
    },
  });

  res.json({ token, user: returnUser, msg: "Login successful..." });
});
