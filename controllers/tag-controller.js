const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");

module.exports.getTagTran = tryCatch(async (req, res, next) => {
  const { startDate, endDate } = req.body;

  const tagTrans = await prisma.tagTran.findMany({
    where: {
      recordDate: {
        gte: new Date(startDate),
        lt: new Date(endDate),
      },
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
        },
      });
    }
  });

  res.json({ msg: "Edit tag tran successful" });
});
