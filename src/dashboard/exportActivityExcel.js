import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const dash = (v) => (v === null || v === undefined || v === "" || num(v) === 0 ? "-" : v);

function emptyTotals() {
  return {
    call_days: 0,
    oth_call: 0,
    totalnotCall: 0,
    tot_call: 0,
    tot_pc_call: 0,
    tot_cus: 0,
    cus_met: 0,
    tot_miss_a: 0,
    tot_miss_c: 0,
    tot_miss_b: 0,
    tot_miss: 0,
    tot_met: 0,
    tot_ord_val: 0,
  };
}

/**
 * Builds the exact same row set (data rows + region subtotal rows + grand total)
 * that CumulativeDashboard.jsx renders on screen, then exports it as a styled .xlsx.
 *
 * @param {Array} activityData - raw rows from API (res.data.tbldta), same array passed to <CumulativeDashboard>
 * @param {dayjs|string} fromDate
 * @param {dayjs|string} toDate
 */
export async function exportActivityExcel(activityData, fromDate, toDate,psmLabel) {
  const totaldays = fromDate && toDate
    ? Math.abs(dayjs(toDate).diff(dayjs(fromDate), "day")) + 1
    : 0;

  // ---- Replicate CumulativeDashboard's row-building logic ----
  const rows = [];
  let regId = "";
  let regName = "";
  let tot = emptyTotals();
  const gr = emptyTotals();

  activityData.forEach((key, idx) => {
    if (idx > 0 && regId !== key.reg_id) {
      rows.push(buildRegionRow(regName, regId, tot));
      tot = emptyTotals();
    }

    const totalCall = num(key.call_days) + num(key.oth_call);
    const totalnotCall = totaldays - (num(key.tot_call_day) + num(key.oth_call));
    const callAvg = num(key.call_days) ? num(key.tot_call) / num(key.call_days) : 0;
    const prodAvg = num(key.call_days) ? num(key.tot_pc_call) / num(key.call_days) : 0;
    const repeatCall = num(key.tot_met) - num(key.cus_met);
    const perMissed = num(key.tot_cus) ? (num(key.tot_miss) / num(key.tot_cus)) * 100 : 0;

    rows.push({
      _rowType: "data",
      sr_name: key.sr_name,
      call_days: key.call_days,
      oth_call: key.oth_call,
      totalCall,
      totalnotCall,
      tot_call: key.tot_call,
      callAvg: round2(callAvg),
      tot_pc_call: key.tot_pc_call,
      prodAvg: round2(prodAvg),
      tot_cus: key.tot_cus,
      cus_met: key.cus_met,
      repeatCall,
      tot_miss_a: key.tot_miss_a,
      tot_miss_c: key.tot_miss_c,
      tot_miss_b: key.tot_miss_b,
      tot_miss: key.tot_miss,
      perMissed: round2(perMissed),
      tot_ord_val: key.tot_ord_val,
    });

    const acc = {
      call_days: num(key.call_days),
      oth_call: num(key.oth_call),
      totalnotCall,
      tot_call: num(key.tot_call),
      tot_pc_call: num(key.tot_pc_call),
      tot_cus: num(key.tot_cus),
      cus_met: num(key.cus_met),
      tot_miss_a: num(key.tot_miss_a),
      tot_miss_c: num(key.tot_miss_c),
      tot_miss_b: num(key.tot_miss_b),
      tot_miss: num(key.tot_miss),
      tot_met: num(key.tot_met),
      tot_ord_val: num(key.tot_ord_val),
    };
    Object.keys(acc).forEach((k) => {
      tot[k] += acc[k];
      gr[k] += acc[k];
    });

    regId = key.reg_id;
    regName = key.reg_name;
  });

  if (activityData.length > 0) {
    rows.push(buildRegionRow(regName, regId, tot));
    rows.push(buildGrandTotalRow(gr));
  }

  // ---- Build the workbook ----
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Activity Dashboard");

  const columns = [
    { header: `${psmLabel} Name`, key: "name", width: 24 },
    { header: "Field Days", key: "fieldDays", width: 11 },
    { header: "Other Reporting", key: "otherReporting", width: 13 },
    { header: "Total Days Reported", key: "totalReported", width: 15 },
    { header: "Total Days Not Reported", key: "totalNotReported", width: 16 },
    { header: "Total Calls", key: "totalCalls", width: 11 },
    { header: "Call Avg", key: "callAvg", width: 10 },
    { header: "Productive Calls", key: "productiveCalls", width: 13 },
    { header: "Productive %", key: "productivePct", width: 11 },
    { header: "Total Customers in List", key: "totalCustomers", width: 16 },
    { header: "Visited", key: "visited", width: 10 },
    { header: "Repeat Calls", key: "repeatCalls", width: 12 },
    { header: "A Class Missed", key: "aClassMissed", width: 12 },
    { header: "B Class Missed", key: "bClassMissed", width: 12 },
    { header: "C Class Missed", key: "cClassMissed", width: 12 },
    { header: "Total Missed", key: "totalMissed", width: 12 },
    { header: "% Missed", key: "pctMissed", width: 10 },
    { header: "Secondary Sales (In Lakh)", key: "secondarySales", width: 18 },
  ];
  sheet.columns = columns;

  // Group header row inserted above the column header row
  sheet.spliceRows(1, 0, []);
  sheet.mergeCells("B1:E1");
  sheet.mergeCells("F1:M1");
  sheet.getCell("B1").value = "MAN DAYS REPORTED";
  sheet.getCell("F1").value = "CALL SUMMARY";

  const blueFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3464A7" } };
  const greyFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDDDDD" } };
  const subHeadingFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6398C3" } };
  const thinBorder = {
    top: { style: "thin" }, left: { style: "thin" },
    bottom: { style: "thin" }, right: { style: "thin" },
  };

  ["A1", "B1", "F1", "N1", "O1", "P1", "Q1", "R1"].forEach((addr) => {
    sheet.getCell(addr).style = {
      font: { bold: false, color: { argb: "FFFFFFFF" } },
      fill: blueFill,
      alignment: { horizontal: "center", vertical: "middle" },
      border: thinBorder,
    };
  });

  const headerRow = sheet.getRow(2);
  headerRow.eachCell((cell) => {
    cell.style = {
      font: { bold: false, color: { argb: "FFFFFFFF" } },
      fill: blueFill,
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      border: thinBorder,
    };
  });
  headerRow.height = 32;

  // ---- Write data / region-total / grand-total rows ----
  rows.forEach((row) => {
    let name;
    if (row._rowType === "regionTotal") name = `Total ${row.reg_name}`;
    else if (row._rowType === "grandTotal") name = "Grand Total";
    else name = (row.sr_name ?? "-").trim();

    const newRow = sheet.addRow({
      name,
      fieldDays: dash(row.call_days),
      otherReporting: dash(row.oth_call),
      totalReported: dash(row.totalCall),
      totalNotReported: dash(row.totalnotCall),
      totalCalls: dash(row.tot_call),
      callAvg: dash(row.callAvg),
      productiveCalls: dash(row.tot_pc_call),
      productivePct: dash(row.prodAvg),
      totalCustomers: dash(row.tot_cus),
      visited: dash(row.cus_met),
      repeatCalls: dash(row.repeatCall),
      aClassMissed: dash(row.tot_miss_a),
      bClassMissed: dash(row.tot_miss_c),
      cClassMissed: dash(row.tot_miss_b),
      totalMissed: dash(row.tot_miss),
      pctMissed: dash(row.perMissed),
      secondarySales: dash(row.tot_ord_val),
    });

    let fill = null;
    let bold = false;
    if (row._rowType === "regionTotal") { fill = greyFill; bold = false; }
    if (row._rowType === "grandTotal") { fill = subHeadingFill; bold = false; }

    newRow.eachCell((cell) => {
      cell.border = thinBorder;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (bold) cell.font = { bold: false, color: row._rowType === "grandTotal" ? { argb: "FFFFFFFF" } : undefined };
      if (fill) cell.fill = fill;
    });
    newRow.getCell("name").alignment = { horizontal: "left", vertical: "middle" };
  });

  const fileName = `Activity-Details_${dayjs(fromDate).format("DD_MMM_YYYY")}_to_${dayjs(toDate).format("DD_MMM_YYYY")}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
}

function buildRegionRow(regName, regId, t) {
  const totalCall = t.call_days + t.oth_call;
  return {
    _rowType: "regionTotal",
    reg_id: regId,
    reg_name: regName,
    call_days: t.call_days,
    oth_call: t.oth_call,
    totalCall,
    totalnotCall: t.totalnotCall ?? 0,
    tot_call: t.tot_call,
    callAvg: totalCall ? round2(t.tot_call / totalCall) : 0,
    tot_pc_call: t.tot_pc_call,
    prodAvg: t.tot_pc_call ? round2(t.tot_call / t.tot_pc_call) : 0,
    tot_cus: t.tot_cus,
    cus_met: t.cus_met,
    repeatCall: t.tot_call - t.cus_met,
    tot_miss_a: t.tot_miss_a,
    tot_miss_c: t.tot_miss_c,
    tot_miss_b: t.tot_miss_b,
    tot_miss: t.tot_miss,
    perMissed: t.tot_cus ? round2((t.tot_miss / t.tot_cus) * 100) : 0,
    tot_ord_val: t.tot_ord_val,
  };
}

function buildGrandTotalRow(gr) {
  const totalCall = gr.call_days + gr.oth_call;
  return {
    _rowType: "grandTotal",
    call_days: gr.call_days,
    oth_call: gr.oth_call,
    totalCall,
    totalnotCall: gr.totalnotCall ?? 0,
    tot_call: gr.tot_call,
    callAvg: totalCall ? round2(gr.tot_call / totalCall) : 0,
    tot_pc_call: gr.tot_pc_call,
    prodAvg: gr.tot_pc_call ? round2(gr.tot_call / gr.tot_pc_call) : 0,
    tot_cus: gr.tot_cus,
    cus_met: gr.cus_met,
    repeatCall: gr.tot_met - gr.cus_met,
    tot_miss_a: gr.tot_miss_a,
    tot_miss_c: gr.tot_miss_c,
    tot_miss_b: gr.tot_miss_b,
    tot_miss: gr.tot_miss,
    perMissed: gr.tot_cus ? round2((gr.tot_miss / gr.tot_cus) * 100) : 0,
    tot_ord_val: gr.tot_ord_val,
  };
}