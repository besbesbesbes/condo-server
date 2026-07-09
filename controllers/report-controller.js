const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");

module.exports.getReportInfo = tryCatch(async (req, res, next) => {
  const currentUserId = req.user.userId;
  const { month, year } = req.body;

  // ========================================
  // Get current user + buddy
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
  // Get transactions
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
        totalAmt: 0,
        expense: {},
        paid: {},
      };

      // initialize every user
      users.forEach((user) => {
        reportMap[typeId].expense[user.userId] = 0;
        reportMap[typeId].paid[user.userId] = 0;
      });
    }

    // -------------------------
    // Total amount
    // -------------------------
    reportMap[typeId].totalAmt += Number(tran.totalAmt);

    // -------------------------
    // Paid amount
    // -------------------------
    reportMap[typeId].paid[tran.paidUserId] += Number(tran.totalAmt);

    // -------------------------
    // Expense amount
    // -------------------------
    reportMap[typeId].expense[tran.paidUserId] += Number(tran.myAmt);

    const otherUser = users.find((u) => u.userId !== tran.paidUserId);

    if (otherUser) {
      reportMap[typeId].expense[otherUser.userId] += Number(tran.otherAmt);
    }
  });

  const report = Object.values(reportMap);

  res.json({
    users,
    report,
    msg: "Get report successful.",
  });
});
