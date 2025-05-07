const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");

module.exports.getReportInfo = tryCatch(async (req, res, next) => {
  // find all users
  const users = await prisma.User.findMany({
    select: {
      userName: true,
      userId: true,
    },
  });
  // find summary
  const { month, year, userId } = req.body;
  const result = await prisma.$queryRaw`
    SELECT 
        t.expense_type_id AS typeId,
        e.expense_name AS typeName,
        SUM(t.total_amt) AS sumTotalAmt,
        SUM(t.total_amt * t.my_portion) AS sumMyPortionAmt,
        SUM(t.total_amt) - SUM(t.total_amt * t.my_portion) AS sumOtherAmt
    FROM tran t
    JOIN expense_type e ON t.expense_type_id = e.expense_type_id
    WHERE t.user_id = ${userId}
        AND MONTH(t.record_date) = ${month}
        AND YEAR(t.record_date) = ${year}
    GROUP BY t.expense_type_id, e.expense_name
    `;

  // other users' result
  const resultOther = await prisma.$queryRaw`
SELECT 
    SUM(t.total_amt) AS sumTotalAmt,
    SUM(t.total_amt * t.my_portion) AS sumMyPortionAmt,
    SUM(t.total_amt) - SUM(t.total_amt * t.my_portion) AS sumOtherAmt
FROM tran t
WHERE t.user_id != ${userId}
    AND MONTH(t.record_date) = ${month}
    AND YEAR(t.record_date) = ${year}
`;

  // Calculate the totals
  const resultSum = result.reduce(
    (acc, row) => {
      acc.sumTotalAmt += Number(row.sumTotalAmt);
      acc.sumMyPortionAmt += Number(row.sumMyPortionAmt);
      acc.sumOtherAmt += Number(row.sumOtherAmt);
      return acc;
    },
    { sumTotalAmt: 0, sumMyPortionAmt: 0, sumOtherAmt: 0 }
  );

  const resultSumOther = {
    sumTotalAmt: Number(resultOther[0]?.sumTotalAmt || 0),
    sumMyPortionAmt: Number(resultOther[0]?.sumMyPortionAmt || 0),
    sumOtherAmt: Number(resultOther[0]?.sumOtherAmt || 0),
  };

  res.json({
    result,
    resultSum,
    body: req.body,
    users,
    resultOther,
    resultSumOther,
    msg: "Get repot Info successful...",
  });
});
