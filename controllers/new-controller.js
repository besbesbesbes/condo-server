const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const { DateTime } = require("luxon");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs/promises");
const getPublicId = require("../utils/getPublicId");
const path = require("path");

module.exports.newTranInfo = tryCatch(async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: {
      userId: req.user.userId,
    },
    select: {
      userId: true,
      userName: true,
      expenseTypes: {
        where: {
          isDelete: false,
        },
        select: {
          userId: true,
          expenseName: true,
          expenseTypeId: true,
        },
      },
      buddyAsUser1: {
        select: {
          user2: {
            select: {
              userId: true,
              userName: true,
              isDummy: true,
              expenseTypes: {
                where: {
                  isDelete: false,
                },
                select: {
                  userId: true,
                  expenseName: true,
                  expenseTypeId: true,
                },
              },
            },
          },
        },
      },
      buddyAsUser2: {
        select: {
          user1: {
            select: {
              userId: true,
              userName: true,
              isDummy: true,
              expenseTypes: {
                where: {
                  isDelete: false,
                },
                select: {
                  userId: true,
                  expenseName: true,
                  expenseTypeId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const buddy = user.buddyAsUser1[0]?.user2 ?? user.buddyAsUser2[0]?.user1;

  const users = [
    {
      userId: user.userId,
      userName: user.userName,
    },
  ];

  let types = [...user.expenseTypes];

  if (buddy && !buddy.isDummy) {
    users.push({
      userId: buddy.userId,
      userName: buddy.userName,
    });

    types.push(...buddy.expenseTypes);
  }

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
  console.log(req.body.tags);

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
    inst,
    tags, // 👈 NEW
  } = req.body;

  if (
    (!inst || inst.length === 0) &&
    (recordDate == null ||
      recordTime == null ||
      paidById == null ||
      typeId == null ||
      totalAmt == null ||
      myPortion == null ||
      Number.isNaN(myPortion) ||
      myAmt == null ||
      Number.isNaN(myAmt) ||
      otherAmt == null ||
      Number.isNaN(otherAmt))
  ) {
    return next(createError(400, "Lack data!"));
  }

  // -----------------------------
  // Parse tags
  // -----------------------------
  let parsedTags = [];

  try {
    parsedTags =
      typeof tags === "string"
        ? JSON.parse(tags)
        : Array.isArray(tags)
          ? tags
          : [];
  } catch (err) {
    return next(createError(400, "Invalid tags format"));
  }

  // normalize tag text
  parsedTags = parsedTags
    .filter((t) => t && t.tagTxt)
    .map((t) => ({
      tagId: t.tagId,
      tagTxt: t.tagTxt.trim(),
      isNew: t.isNew,
    }));

  // -----------------------------
  // Cloudinary Upload
  // -----------------------------
  const haveFiles = !!req.files;
  let uploadResults = [];

  if (haveFiles) {
    for (const file of req.files) {
      try {
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          overwrite: true,
          public_id: path.parse(file.path).name,
          folder: "Condo",
          width: 2000,
          height: 2000,
          crop: "limit",
        });

        uploadResults.push(uploadResult.secure_url);
        await fs.unlink(file.path);
      } catch (err) {
        return next(createError(500, "Fail to upload image"));
      }
    }
  }

  // -----------------------------
  // Installments
  // -----------------------------
  const parsedInst = typeof inst === "string" ? JSON.parse(inst) : inst;

  const installments =
    Array.isArray(parsedInst) && parsedInst.length > 0
      ? parsedInst
      : [
          {
            date: recordDate,
            amt: totalAmt,
            useTime: true,
          },
        ];

  for (const item of installments) {
    const combinedDateTime = DateTime.fromISO(
      item.useTime ? `${item.date}T${recordTime}` : `${item.date}T00:00:00`,
      { zone: "Asia/Bangkok" },
    )
      .toUTC()
      .toJSDate();

    // -----------------------------
    // CREATE TRAN
    // -----------------------------
    const tran = await prisma.Tran.create({
      data: {
        userId: Number(req.user.userId),
        recordDate: combinedDateTime,
        paidUserId: Number(paidById),
        expenseTypeId: Number(typeId),
        totalAmt: parseFloat(item.amt),
        myPortion:
          parsedInst && parsedInst.length > 0 ? 0 : parseFloat(myPortion),
        myAmt: parsedInst && parsedInst.length > 0 ? 0 : parseFloat(myAmt),
        otherAmt:
          parsedInst && parsedInst.length > 0
            ? parseFloat(item.amt)
            : parseFloat(otherAmt),
        remark,
      },
    });

    // -----------------------------
    // CREATE TAGS + TAG_TRAN
    // -----------------------------
    if (parsedTags.length > 0) {
      for (const tagItem of parsedTags) {
        let tag;

        if (tagItem.isNew) {
          tag = await prisma.Tag.create({
            data: {
              tagTxt: tagItem.tagTxt,
            },
          });
        } else {
          tag = { tagId: tagItem.tagId };
        }

        await prisma.TagTran.create({
          data: {
            tranId: tran.tranId,
            tagId: tag.tagId,
            recordDate: tran.recordDate,
          },
        });
      }
    }

    // -----------------------------
    // Photos
    // -----------------------------
    for (const rs of uploadResults) {
      await prisma.TranPhoto.create({
        data: {
          tranId: tran.tranId,
          photoUrl: rs,
        },
      });
    }
  }

  res.json({ msg: "Add new tran(s) successful..." });
});
