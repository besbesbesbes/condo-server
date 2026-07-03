const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const bcrypt = require("bcryptjs");

module.exports.userInfo = tryCatch(async (req, res, next) => {
  const returnUser = await prisma.user.findUnique({
    where: {
      userId: req.user.userId,
    },
  });
  if (!returnUser) {
    createError(400, "User not found!");
  }
  const { userPassword, ...restUser } = returnUser;

  const buddyRequest = await prisma.buddyRequest.findFirst({
    where: {
      requestUserId: req.user.userId,
    },
  });

  if (buddyRequest) {
    const targetUser = await prisma.user.findUnique({
      where: {
        userId: buddyRequest.targetUserId,
      },
    });

    return res.json({
      user: restUser,
      buddy: {
        buddyName: targetUser.userName,
        status: "PENDING",
      },
      msg: "Get user info successful...",
    });
  }

  const buddy = await prisma.buddy.findUnique({
    where: {
      user1Id: req.user.userId,
    },
    include: {
      user2: true,
    },
  });

  if (!buddy) {
    return res.json({
      user: restUser,
      buddy: {
        buddyName: "",
        status: "NONE",
      },
      msg: "Get user info successful...",
    });
  }

  const buddyUser = buddy.user2;

  const buddyInfo = {
    buddyName: buddyUser.isDummy ? "" : buddyUser.userName,
    status: buddyUser.isDummy ? "NONE" : "BUDDY",
  };

  res.json({
    user: restUser,
    buddy: buddyInfo,
    msg: "Get user info successful...",
  });
});

module.exports.changePassword = tryCatch(async (req, res, next) => {
  const { userId } = req.user;
  const { curPass, newPass, conPass } = req.body;
  //validate
  if (!(curPass.trim() && newPass.trim() && conPass.trim())) {
    createError(400, "Please fill all data!");
  }
  if (
    !(
      typeof curPass == "string" &&
      typeof newPass == "string" &&
      typeof conPass == "string"
    )
  ) {
    createError(400, "All data should be string!");
  }
  const user = await prisma.user.findUnique({
    where: {
      userId,
    },
  });
  if (!user) {
    createError(400, "User not found!");
  }
  //compare password
  if (newPass !== conPass) {
    createError(400, "New password not matched!");
  }
  const isPasswordMatch = await bcrypt.compare(curPass, user.userPassword);
  if (!isPasswordMatch) {
    createError(400, "Password is invalid!");
  }
  //hash password
  const hashedPassword = await bcrypt.hash(newPass, 10);
  //update user
  const newUser = await prisma.user.update({
    where: {
      userId,
    },
    data: {
      userPassword: hashedPassword,
    },
    select: {
      userId: true,
      userName: true,
    },
  });
  res.json({ newUser, msg: "Change password successful..." });
});
