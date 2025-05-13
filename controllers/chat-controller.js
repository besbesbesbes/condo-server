const prisma = require("../models/index");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");

module.exports.getChatInfo = tryCatch(async (req, res, next) => {
  const msgs = await prisma.chat.findMany({
    orderBy: { createdAt: "asc" },
  });
  res.json({ msgs, user: req.user, msg: "Get Chat Info successful..." });
});

module.exports.addNewMsg = tryCatch(async (req, res, next) => {
  const { txt, userId } = req.body;

  if (userId !== req.user.userId) {
    return next(
      createError(403, "You do not have permission to add a new message.")
    );
  }

  await prisma.chat.create({
    data: {
      userId,
      txt,
    },
  });

  res.json({ msg: "Add new message successful." });
});
