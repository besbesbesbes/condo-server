const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");

module.exports.getTagTran = tryCatch(async (req, res, next) => {
  const { startDate, endDate } = req.body;
  const userId = req.user.userId;

  // 1. Get login user + buddy
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      buddyAsUser1: {
        select: {
          user2: {
            select: {
              userId: true,
              isDummy: true,
            },
          },
        },
      },
    },
  });

  const buddy = user.buddyAsUser1[0]?.user2;

  // 2. Build allowed user ids
  const userIds = [user.userId];

  if (buddy && !buddy.isDummy) {
    userIds.push(buddy.userId);
  }

  // 3. Get tag transactions
  const tagTrans = await prisma.tagTran.findMany({
    where: {
      recordDate: {
        gte: new Date(startDate),
        lt: new Date(endDate),
      },
      OR: [
        // Calendar-only tags
        {
          userId: {
            in: userIds,
          },
        },

        // Tags attached to transactions
        {
          tran: {
            OR: [
              {
                userId: {
                  in: userIds,
                },
              },
              {
                paidUserId: {
                  in: userIds,
                },
              },
            ],
          },
        },
      ],
    },
    include: {
      tag: true,
      tran: true,
    },
    orderBy: {
      recordDate: "asc",
    },
  });

  res.json({
    msg: "Get tag tran successful...",
    tagTrans,
  });
});

module.exports.getTag = tryCatch(async (req, res, next) => {
  const tags = await prisma.tag.findMany();

  res.json({
    msg: "Get tag successful...",
    tags,
  });
});

module.exports.editTagTran = tryCatch(async (req, res) => {
  const { date, add = [], delete: deleteArr = [] } = req.body;

  const recordDate = new Date(date);

  await prisma.$transaction(async (tx) => {
    // -------------------
    // DELETE (SAFE)
    // -------------------
    if (deleteArr.length > 0) {
      for (const item of deleteArr) {
        if (!item.tagTranId) continue;

        await tx.tagTran.delete({
          where: {
            tagTranId: item.tagTranId,
          },
        });
      }
    }

    // -------------------
    // ADD
    // -------------------
    for (const item of add) {
      let tagId = item.tagId;

      if (!tagId) {
        const newTag = await tx.tag.create({
          data: { tagTxt: item.tagTxt },
        });

        tagId = newTag.tagId;
      }

      await tx.tagTran.create({
        data: {
          tagId,
          recordDate,
          userId: req.user.userId,
        },
      });
    }
  });

  res.json({ msg: "Edit tag tran successful" });
});

module.exports.getRecentTag = tryCatch(async (req, res, next) => {
  const userId = req.user.userId;

  const tagTrans = await prisma.tagTran.findMany({
    where: {
      tran: {
        userId,
      },
    },
    include: {
      tag: {
        select: {
          tagId: true,
          tagTxt: true,
        },
      },
    },
    orderBy: {
      recordDate: "desc",
    },
  });

  const recentTag = [];
  const seen = new Set();

  for (const item of tagTrans) {
    if (seen.has(item.tag.tagId)) continue;

    seen.add(item.tag.tagId);

    recentTag.push({
      tagId: item.tag.tagId,
      tagTxt: item.tag.tagTxt,
    });

    if (recentTag.length === 6) break;
  }

  res.json({
    msg: "Get recent tag successful...",
    recentTag,
  });
});
