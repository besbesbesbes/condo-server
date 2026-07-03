const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");

module.exports.addMemo = tryCatch(async (req, res, next) => {
  const userId = req.user.userId;
  const { txt, isPrivate, isLock } = req.body;

  // validate
  if (!txt || !txt.trim()) {
    return createError(400, "Memo text is required");
  }

  // create
  const memo = await prisma.memo.create({
    data: {
      userId,
      txt: txt.trim(),
      isPrivate: !!isPrivate,
      isLock: !!isLock,
      isActive: true,
    },
  });

  res.json({ msg: "Add new memo successful...", data: memo });
});

module.exports.getMemo = tryCatch(async (req, res, next) => {
  const userId = req.user.userId;

  // 1. Get login user + buddy
  const user = await prisma.user.findUnique({
    where: { userId },
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

  const buddy = user.buddyAsUser1[0]?.user2;

  // 2. Users for filter UI
  const users = [
    {
      userId: user.userId,
      userName: user.userName,
    },
  ];

  if (buddy && !buddy.isDummy) {
    users.push({
      userId: buddy.userId,
      userName: buddy.userName,
    });
  }

  const userIds = users.map((u) => u.userId);

  // 3. Get memos (only me + buddy)
  const memos = await prisma.memo.findMany({
    where: {
      isActive: true,
      userId: {
        in: userIds,
      },
      OR: [
        { isPrivate: false }, // everyone's public memo
        { userId }, // my private memo
      ],
    },
    include: {
      user: {
        select: {
          userId: true, // ✅ IMPORTANT
          userName: true,
        },
      },
      hiddenBy: {
        where: {
          userId,
        },
        select: {
          memoHiddenId: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const result = memos.map((memo) => ({
    ...memo,
    isHidden: memo.hiddenBy.length > 0,
  }));

  res.json({
    msg: "Get memo successful...",
    memos: result,
    users,
  });
});

module.exports.editMemo = tryCatch(async (req, res, next) => {
  const userId = req.user.userId;
  const { memoId, txt, isPrivate, isLock, isHidden } = req.body;

  // Validate memoId
  if (!memoId) {
    return createError(400, "Memo ID is required");
  }

  // Find memo
  const memo = await prisma.memo.findUnique({
    where: {
      memoId: Number(memoId),
    },
  });

  if (!memo || !memo.isActive) {
    return createError(404, "Memo not found");
  }

  const isOwner = memo.userId === userId;

  let updatedMemo = memo;

  // ======================================================
  // Edit memo (only when txt is sent)
  // ======================================================
  if (typeof txt !== "undefined") {
    if (!txt.trim()) {
      return createError(400, "Memo text is required");
    }

    // Non-owner cannot edit locked memo
    if (!isOwner && memo.isLock) {
      return createError(403, "This memo is locked");
    }

    const data = {
      txt: txt.trim(),
      updatedAt: new Date(),
    };

    // Only owner can change these fields
    if (isOwner) {
      if (typeof isPrivate !== "undefined") {
        data.isPrivate = !!isPrivate;
      }

      if (typeof isLock !== "undefined") {
        data.isLock = !!isLock;
      }
    }

    updatedMemo = await prisma.memo.update({
      where: {
        memoId: Number(memoId),
      },
      data,
    });
  }

  // ======================================================
  // Hide / Unhide (always allowed)
  // ======================================================
  if (typeof isHidden !== "undefined") {
    const memoIdNum = Number(memoId);

    if (isHidden) {
      await prisma.memoHidden.upsert({
        where: {
          memoId_userId: {
            memoId: memoIdNum,
            userId,
          },
        },
        update: {},
        create: {
          memoId: memoIdNum,
          userId,
        },
      });
    } else {
      await prisma.memoHidden.deleteMany({
        where: {
          memoId: memoIdNum,
          userId,
        },
      });
    }
  }

  res.json({
    msg: "Edit memo successful",
    data: updatedMemo,
  });
});

module.exports.deleteMemo = tryCatch(async (req, res, next) => {
  const userId = req.user.userId;
  const { memoId } = req.body;

  //   validate
  if (!memoId) {
    createError(400, "Memo ID is required");
  }

  const memo = await prisma.memo.findUnique({
    where: {
      memoId: Number(memoId),
    },
  });

  if (!memo || !memo.isActive) {
    return createError(404, "Memo not found");
  }

  // 3. Only owner can delete
  if (memo.userId !== userId) {
    return createError(403, "You are not allowed to delete this memo");
  }
  // 4. Soft delete
  const deletedMemo = await prisma.memo.update({
    where: {
      memoId: Number(memoId),
    },
    data: {
      isActive: false,
      updatedAt: new Date(),
    },
  });

  res.json({ msg: "Delete memo successful..." });
});
