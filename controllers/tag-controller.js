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
