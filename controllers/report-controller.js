const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");

module.exports.getReportInfo = tryCatch(async (req, res, next) => {
  const currentUserId = req.user.userId;
  const { month, year } = req.body;

  // ========================================
  // Get current user + buddy (if any)
  // ========================================
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { userId: currentUserId },
        {
          buddyAsUser1: {
            some: {
              user2Id: currentUserId,
            },
          },
        },
        {
          buddyAsUser2: {
            some: {
              user1Id: currentUserId,
            },
          },
        },
      ],
    },
    select: {
      userId: true,
      userName: true,
    },
    orderBy: {
      userId: "asc",
    },
  });

  const userIds = users.map((u) => u.userId);

  // ========================================
  // Get all transactions
  // ========================================
  const trans = await prisma.tran.findMany({
    where: {
      userId: {
        in: userIds,
      },
      recordDate: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
    include: {
      expenseType: {
        select: {
          expenseTypeId: true,
          expenseName: true,
        },
      },
    },
    orderBy: [
      {
        expenseTypeId: "asc",
      },
      {
        recordDate: "asc",
      },
    ],
  });

  // ========================================
  // Build report
  // ========================================
  const reportMap = {};

  trans.forEach((tran) => {
    const typeId = tran.expenseTypeId;

    if (!reportMap[typeId]) {
      reportMap[typeId] = {
        expenseTypeId: tran.expenseTypeId,
        expenseTypeName: tran.expenseType.expenseName,
        userAmounts: [],
        totalAmount: 0,
      };

      users.forEach((user) => {
        reportMap[typeId].userAmounts.push({
          userId: user.userId,
          amount: 0,
        });
      });
    }

    // myAmt belongs to paid user
    const paidUser = reportMap[typeId].userAmounts.find(
      (u) => u.userId === tran.paidUserId,
    );

    if (paidUser) {
      paidUser.amount += Number(tran.myAmt);
    }

    // otherAmt belongs to the other user
    const otherUser = reportMap[typeId].userAmounts.find(
      (u) => u.userId !== tran.paidUserId,
    );

    if (otherUser) {
      otherUser.amount += Number(tran.otherAmt);
    }

    reportMap[typeId].totalAmount += Number(tran.totalAmt);
  });

  const report = Object.values(reportMap);

  res.json({
    users,
    report,
    body: req.body,
    msg: "Get report successful.",
  });
});
