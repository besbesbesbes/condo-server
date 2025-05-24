const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const { DateTime } = require("luxon");

module.exports.getTrans = tryCatch(async (req, res, next) => {
  const yearInput = req.body.yearInput;
  const startDate = new Date(`${yearInput}-01-01`);
  const endDate = new Date(`${+yearInput + 1}-01-01`);

  const trans = await prisma.Tran.findMany({
    where: {
      recordDate: {
        gte: startDate,
        lt: endDate,
      },
    },
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
      photos: {
        select: {
          photoUrl: true,
          tranPhotoId: true,
        },
      },
    },
    orderBy: {
      recordDate: "desc",
    },
  });
  const transWithFlag = trans.map((tran) => ({
    ...tran,
    isHavePhoto: tran.photos.length > 0,
  }));

  res.json({ trans: transWithFlag, msg: "Get trans successful..." });
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
  const combinedDateTime = DateTime.fromISO(`${recordDate}T${recordTime}`, {
    zone: "Asia/Bangkok",
  })
    .toUTC()
    .toJSDate();
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
