const prisma = require("../models/index");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");

const restoreUserToDummy = async (tx, userId) => {
  const dummyUser = await tx.user.findFirst({
    where: { ownerUserId: userId, isDummy: true },
  });

  if (!dummyUser) {
    throw createError(500, "Dummy user not found");
  }

  await tx.buddy.update({
    where: { user1Id: userId },
    data: { user2Id: dummyUser.userId },
  });
};

module.exports.requestBuddy = tryCatch(async (req, res, next) => {
  const requestUserId = req.user.userId;
  const { targetUserName } = req.body;

  if (!targetUserName?.trim()) {
    return createError(400, "Please enter buddy username");
  }

  const targetName = targetUserName.trim();

  const requestUser = await prisma.user.findUnique({
    where: { userId: requestUserId },
  });

  if (!requestUser) {
    return createError(404, "User not found");
  }

  if (requestUser.userName.toLowerCase() === targetName.toLowerCase()) {
    return createError(400, "You cannot request yourself");
  }

  const targetUser = await prisma.user.findUnique({
    where: { userName: targetName },
  });

  if (!targetUser) {
    return createError(404, "Buddy not found");
  }

  if (targetUser.isDummy) {
    return createError(400, "Cannot request dummy user");
  }

  return await prisma.$transaction(async (tx) => {
    const myBuddyRow = await tx.buddy.findUnique({
      where: { user1Id: requestUserId },
      include: { user2: true },
    });

    if (!myBuddyRow) {
      throw createError(500, "Buddy record not found");
    }

    const targetRequest = await tx.buddyRequest.findUnique({
      where: { requestUserId: targetUser.userId },
    });

    const isMutualMatch =
      targetRequest && targetRequest.targetUserId === requestUserId;

    if (isMutualMatch) {
      await tx.buddyRequest.deleteMany({
        where: {
          requestUserId: { in: [requestUserId, targetUser.userId] },
        },
      });

      await tx.buddy.update({
        where: { user1Id: requestUserId },
        data: { user2Id: targetUser.userId },
      });

      await tx.buddy.update({
        where: { user1Id: targetUser.userId },
        data: { user2Id: requestUserId },
      });

      return res.json({
        msg: "Buddy matched successfully",
      });
    }

    const currentPartner = myBuddyRow.user2;
    if (!currentPartner.isDummy) {
      await restoreUserToDummy(tx, requestUserId);
      await restoreUserToDummy(tx, currentPartner.userId);
    }

    await tx.buddyRequest.deleteMany({
      where: { requestUserId },
    });

    await tx.buddyRequest.create({
      data: {
        requestUserId,
        targetUserId: targetUser.userId,
      },
    });

    return res.json({
      msg: !currentPartner.isDummy
        ? "Buddy changed request sent"
        : "Buddy request sent",
    });
  });
});
