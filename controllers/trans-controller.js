const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");

module.exports.getTrans = tryCatch(async (req, res, next) => {
  const trans = await prisma.Tran.findMany({
    // where: {
    //   userId: req.user.userId,
    // },
    include: {
      paidUser: {
        select: {
          userName: true,
        },
      },
      expenseType: {
        select: {
          expenseName: true,
        },
      },
      user: {
        select: {
          userName: true,
        },
      },
    },
    orderBy: {
      recordDate: "desc", // 'asc' for ascending order or 'desc' for descending order
    },
  });
  res.json({ trans, msg: "Get trans successful..." });
});

module.exports.editTran = tryCatch(async (req, res, next) => {
  const {
    tranId,
    recordDate,
    recordTime,
    paidById,
    typeId,
    totalAmt,
    myPortion,
    myAmt,
    otherAmt,
    remark,
  } = req.body;
  if (
    !(
      tranId &&
      recordDate &&
      recordTime &&
      paidById &&
      typeId &&
      totalAmt &&
      myPortion &&
      myAmt &&
      otherAmt
    )
  ) {
    createError(400, "Lack data!");
  }
  const combinedDateTime = new Date(`${recordDate}T${recordTime}`);
  await prisma.Tran.update({
    where: {
      tranId: Number(tranId),
    },
    data: {
      userId: Number(req.user.userId),
      recordDate: combinedDateTime,
      paidUserId: Number(paidById),
      expenseTypeId: Number(typeId),
      totalAmt: parseFloat(totalAmt),
      myPortion: parseFloat(myPortion),
      myAmt: parseFloat(myAmt),
      otherAmt: parseFloat(otherAmt),
      remark,
    },
  });
  res.json({ body: req.body, msg: "Edit trans successful..." });
});

module.exports.deleteTran = tryCatch(async (req, res, next) => {
  const { tranId } = req.body;
  const tran = await prisma.Tran.findUnique({
    where: {
      tranId,
    },
  });
  if (!tran) {
    createError(400, "Tran not found!");
  }
  await prisma.Tran.delete({
    where: {
      tranId,
    },
  });
  res.json({ body: req.body, msg: "Delete trans successful..." });
});
