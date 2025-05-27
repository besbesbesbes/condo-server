const prisma = require("../models");
const tryCatch = require("../utils/try-catch");
const createError = require("../utils/create-error");
const ExcelJS = require("exceljs");

module.exports.exportReport = tryCatch(async (req, res, next) => {
  const data = await prisma.tran.findMany();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("DATA");
  worksheet.columns = [
    { header: "TRAN_ID", key: "tranId" },
    { header: "CREATED_AT", key: "createdAt" },
    { header: "UPDATED_AT", key: "updatedAt" },
    { header: "PAID_USER_ID", key: "paidUserId" },
    { header: "EXPENSE_TYPE_ID", key: "expenseTypeId" },
    { header: "TOTAL_AMT", key: "totalAmt" },
    { header: "MY_PORTION", key: "myPortion" },
    { header: "MY_AMT", key: "myAmt" },
    { header: "OTHER_AMT", key: "otherAmt" },
    { header: "USER_ID", key: "userId" },
    { header: "REMARK", key: "remark" },
  ];
  worksheet.addRows(data);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=data.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});
