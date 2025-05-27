const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const { DateTime } = require("luxon");
const cloudinary = require("../utils/cloudinary");
const getPublicId = require("../utils/getPublicId");
const fs = require("fs/promises");
const path = require("path");

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
  console.log(req.body);
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
    tranId == null ||
    recordDate == null ||
    recordTime == null ||
    paidById == null ||
    typeId == null ||
    totalAmt == null ||
    myPortion == null ||
    Number.isNaN(myPortion) ||
    myAmt == null ||
    Number.isNaN(myAmt) ||
    otherAmt == null ||
    Number.isNaN(otherAmt)
  ) {
    createError(400, "Lack data!");
  }
  const combinedDateTime = DateTime.fromISO(`${recordDate}T${recordTime}`, {
    zone: "Asia/Bangkok",
  })
    .toUTC()
    .toJSDate();
  // cloudinary

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
  // update db tran
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
  // DB create Tran Photo
  for (const rs of uploadResults) {
    await prisma.TranPhoto.create({
      data: {
        tranId: Number(tranId),
        photoUrl: rs,
      },
    });
  }

  res.json({ body: req.body, msg: "Edit trans successful..." });
});

module.exports.deleteTran = tryCatch(async (req, res, next) => {
  const { tranId, photos } = req.body;
  const tran = await prisma.Tran.findUnique({
    where: {
      tranId,
    },
  });
  if (!tran) {
    createError(400, "Tran not found!");
  }
  if (photos) {
    photos.forEach((el) => {
      cloudinary.uploader.destroy(getPublicId(el.photoUrl));
    });
  }
  await prisma.Tran.delete({
    where: {
      tranId,
    },
  });
  res.json({ photos, body: req.body, msg: "Delete trans successful..." });
});

module.exports.deletePhoto = tryCatch(async (req, res, next) => {
  const { selPhotoUrl } = req.body;
  // delete from cloudinary
  cloudinary.uploader.destroy(getPublicId(selPhotoUrl));
  // delete from db
  const tranPhoto = await prisma.tranPhoto.findFirst({
    where: {
      photoUrl: selPhotoUrl,
    },
  });
  await prisma.tranPhoto.delete({
    where: {
      tranPhotoId: tranPhoto.tranPhotoId,
    },
  });
  res.json({ msg: "Delete photo successful..." });
});
