const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");

module.exports.newTranInfo = tryCatch(async (req, res, next) => {
  // find all users
  const users = await prisma.User.findMany({
    select: {
      userName: true,
      userId: true,
    },
  });
  // find all expense type
  const types = await prisma.ExpenseType.findMany({
    where: {
      // userId: req.user.userId,
      isDelete: false,
    },
    select: {
      userId: true,
      expenseName: true,
      expenseTypeId: true,
    },
  });
  //   find last expense type
  //   const lastTran = await prisma.tran.findFirst({
  //     where: {
  //       userId: req.user.userId,
  //     },
  //     orderBy: {
  //       createdAt: "desc",
  //     },
  //   });
  //----------------------------
  res.json({
    paidUser: req.user.userName,
    paidUserId: req.user.userId,
    users,
    types,
    msg: "Get new tran info successful...",
  });
});

module.exports.addNewType = tryCatch(async (req, res, next) => {
  const { newType } = req.body;
  if (!newType) {
    createError(400, "New type not found!");
  }
  await prisma.ExpenseType.create({
    data: {
      userId: req.user.userId,
      expenseName: newType,
    },
  });
  res.json({ msg: "Add new type successful..." });
});

module.exports.deleteType = tryCatch(async (req, res, next) => {
  const { expenseTypeId } = req.body.selectedType;
  if (!expenseTypeId) {
    createError(400, "expenseTypeId not found!");
  }
  await prisma.ExpenseType.update({
    data: {
      isDelete: true,
    },
    where: {
      expenseTypeId,
    },
  });
  res.json({ msg: "Delete type successful..." });
});

module.exports.editType = tryCatch(async (req, res, next) => {
  const { expenseTypeId } = req.body.selectedType;
  const { typeTxt } = req.body;
  if (!expenseTypeId) {
    createError(400, "expenseTypeId not found!");
  }
  if (!typeTxt) {
    createError(400, "typeTxt not found!");
  }
  await prisma.ExpenseType.update({
    data: {
      expenseName: typeTxt,
    },
    where: {
      expenseTypeId,
    },
  });
  res.json({ msg: "Edit type successful..." });
});

module.exports.addNewTran = tryCatch(async (req, res, next) => {
  const {
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
  await prisma.Tran.create({
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
  res.json({ msg: "Add new tran successful..." });
});
