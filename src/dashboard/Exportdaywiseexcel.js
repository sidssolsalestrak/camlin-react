/**
 * exportDayWiseExcel.js
 *
 * Byte-for-byte structural replica of the PHP-generated day-wise export
 * (Activity-Details__4_.xls — really an HTML table saved with a .xls
 * extension / application/vnd.ms-excel mime type, which is why it opens
 * fine in Excel and keeps its colors/borders).
 *
 * Field names below match the REAL day-wise row shape used in
 * DayWiseDashboard.jsx (sale.u_name, sale.desig_name, sale.report_type,
 * sale.start_call, sale.dist_kms, sale.hcp_call, etc.) — not guesses.
 *
 * Verified against the reference file cell-by-cell:
 *  - Name/Designation/Area/AppStatus/AppVersion cells: raw pass-through,
 *    width="30%" (yes — the data cells use 30% even though the header
 *    cells above them use 18%; this mismatch exists in the original PHP
 *    output too, so it's preserved here rather than "fixed").
 *  - Stat: single-letter report_type code (e.g. "P") when reported,
 *    else a single space " " — plain text, no icon (unlike the on-screen
 *    check/close icon).
 *  - Start / Last Call: formatted "h:mm a"; "-" when not reported.
 *  - Beat Planned / Beat Working: raw pass-through, blank " " fallback.
 *  - Distance: raw pass-through (NOT zeroTonull'd — 0 stays "0", blank
 *    stays " ", unlike the on-screen table which turns 0 into "-").
 *  - Total Calls: raw hcp_call | ret_call, bold, NOT zeroTonull'd.
 *  - Productive %: the "%" <span> is ALWAYS rendered even when the
 *    percentage itself is blank (0 calls) — confirmed from the reference
 *    file's first row. This differs from the on-screen table's logic,
 *    which hides the "%" entirely when calls are 0. Replicated exactly
 *    as the reference file shows it.
 *  - Events / Samples / Joint Work / Qty / Values(Lacs) / Survey: run
 *    through zeroTonull (0/blank -> "-").
 *  - B'days: raw pass-through — literal "0" stays "0", NOT converted to
 *    "-" (confirmed from reference: every row shows "0", never "-").
 *  - No title row, no totals row — the reference file has neither.
 */

import dayjs from "dayjs";

// ── Helpers ─────────────────────────────────────────────────────────────

const escapeHtml = (val) => {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

// PHP zeroTonullVal(): 0/empty/null -> '-'  (same as DayWiseDashboard.jsx)
const zeroTonull = (v) => {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || Number.isNaN(n) || n === 0) return "-";
  return v;
};

// Raw pass-through with a fallback for empty/null/undefined (used where
// the reference file does NOT apply zeroTonull, e.g. distance, beat
// planned/working, b'days).
const raw = (v, fallback = " ") => {
  if (v === null || v === undefined || v === "") return fallback;
  return v;
};

function formatCallTime(t) {
  if (!t || t === "00:00:00" || t === " ") return "-";
  const isBareTime = /^\d{2}:\d{2}:\d{2}$/.test(t);
  const parsed = isBareTime ? dayjs(`2000-01-01 ${t}`) : dayjs(t);
  return parsed.isValid() ? parsed.format("h:mm a") : "-";
}

const buildRowCells = (sale) => {
  const reported = Number(sale.report_type_id) > 0 && sale.report_type_id !== "";
  const statText = reported ? escapeHtml(sale.report_type || "") : " ";

  const appStatusText = Number(sale.app_stat) === 1 ? "Logged In" : "Logged Out";

  const isSpecialReportType = [2, 3, 4, 5].includes(Number(sale.report_type_id));
  const startCallText = isSpecialReportType ? "-" : formatCallTime(sale.start_call);
  const lastCallText = isSpecialReportType ? "-" : formatCallTime(sale.last_call);

  // % is ALWAYS rendered (confirmed from reference file), number is blank when calls are 0
  const hcpProdPct = Number(sale.hcp_prod_call) > 0
    ? Math.round((sale.hcp_prod_call / sale.hcp_call) * 100)
    : "";
  const retProdPct = Number(sale.ret_prod_call) > 0
    ? Math.round((sale.ret_prod_call / sale.ret_call) * 100)
    : "";

  return `<tr>` +
    `<td style="text-align:left;" width="30%">${escapeHtml(sale.u_name)}</td>` +
    `<td style="text-align:left;" width="30%">${escapeHtml(raw(sale.desig_name, "-"))}</td>` +
    `<td style="text-align:left;" width="30%">${escapeHtml(raw(sale.area_name, "-"))}</td>` +
    `<td style="text-align:left;" width="30%">${escapeHtml(appStatusText)}</td>` +
    `<td style="text-align:left;" width="30%">${escapeHtml(raw(sale.app_version, "-"))}</td>` +
    `<td class="">${statText}</td>` +
    `<td width="5%">${startCallText}</td>` +
    `<td style="color:#0a52b5;font-weight: 600;" width="10%">${lastCallText}</td>` +
    `<td style="word-wrap:break-word;" width="10%">${escapeHtml(raw(sale.beat_plan))}</td>` +
    `<td align="left" width="10%">${escapeHtml(raw(sale.beat_work))}</td>` +
    `<td width="5%">${escapeHtml(raw(sale.dist_kms))}</td>` +
    `<td width=10%><b>${escapeHtml(raw(sale.hcp_call, "0"))}</b> | <b>${escapeHtml(raw(sale.ret_call, "0"))}</b></td>` +
    `<td width=10%><b>${hcpProdPct}<span style="font-size:10px;">%</span></b> | <b>${retProdPct}<span style="font-size:10px;">%</span></b></td>` +
    `<td class="" width="5%">${zeroTonull(sale.tot_event)}</td>` +
    `<td class="marker activitySrSummarySamp" width="5%">${zeroTonull(sale.tot_samp)}</td>` +
    `<td width="5%">${zeroTonull(sale.tot_jnt)}</td>` +
    `<td width="5%">${escapeHtml(raw(sale.tot_dob_anniv, "0"))}</td>` +
    `<td class="marker activitySrSummaryDet" width="5%">${zeroTonull(sale.tot_ord)}</td>` +
    `<td class="marker activitySrSummaryDet" width="5%">${zeroTonull(sale.tot_ord_val)}</td>` +
    `<td class="" width="5%">${zeroTonull(sale.tot_cs)}</td>` +
    `</tr>`;
};

/**
 * Build the exact HTML document (same tag structure/classes/ids as the
 * reference PHP export) and trigger a browser download as .xls.
 *
 * @param {Array} activityData  Day-wise rows (dayWiseData state from Dashboard.jsx)
 * @param {string} dateLabel    Formatted date, used only for the filename, e.g. "31-Aug-2026"
 */
export function exportDayWiseExcel(activityData = [], dateLabel = "") {
  const rowsHtml = activityData.length
    ? activityData.map(buildRowCells).join("")
    : `<tr><td colspan="20" align="center">No data found</td></tr>`;

  const html =
    `<style type="text/css">` +
    `\t#SellOutQTYUSD tr,td{ border:1px solid; }` +
    `\t.theads{ background-color:#3464a7;color:#fff;font-weight:600;text-align: center; }` +
    `\t.totTr{ background-color:#ddd;font-weight:600; }` +
    `\t.subHeading { background-color:#6398c3;color:white;font-weight:600;font-size:16px; }` +
    `\t.noborder {` +
    `\t\tborder: 1px solid #fff !important;` +
    `    \tborder-right: 1px solid #ddd !important;` +
    `    }` +
    `    th` +
    `    {` +
    `    \ttext-transform: none !important;` +
    `    }` +
    `</style>` +
    `<table class="table _table_centerAlign_ table-bordered" id="SellOutQTYUSD">` +
    `<thead>` +
    `<tr class="theads">` +
    `<th align="center" class=""></th>` +
    `<th align="center" colspan="9" class=""></th>` +
    `<th align="center" colspan="2" class="theads">Calls</th>` +
    `<th align="center" colspan="4" class=""></th>` +
    `<th align="center" colspan="2"  class="theads">Total Orders</th>` +
    `<th></th>` +
    `</tr>` +
    `<tr style="background-color: #8EAADC " >` +
    `<th class="" style="text-align:left;" width="18%">Name</th>` +
    `<th class="" style="text-align:left;" width="18%">Designation</th>` +
    `<th class="" style="text-align:left;" width="18%">Area</th>` +
    `<th class="" style="text-align:left;" width="18%">App Status</th>` +
    `<th class="" style="text-align:left;" width="18%">App Version</th>` +
    `<th width="5%" align="center" class="">Stat</th>` +
    `<th class="">Start</th>` +
    `<th class="">Last Call</th>` +
    `<th class="" align="">Beat Planned</th>` +
    `<th class="" align="">Beat Working</th>` +
    `<th class="" align="center">Distance (Kms)</th>` +
    `<th class="" align="center">Total Calls</th>` +
    `<th class="" align="center">Productive</th>` +
    `<th class="" align="center">Events</th>` +
    `<th class="" align="center">Samples</th>` +
    `<th class="" align="">Joint Work</th>` +
    `<th class="" align="center">B'days</th>` +
    `<th class="" align="center">Qty</th>` +
    `<th class="" align="center">Values(Lacs)</th>` +
    `<td class="theads" align="center">Survey</td>` +
    `</tr>` +
    `</thead>` +
    `<tbody id=activityDashboardTBody>` +
    rowsHtml +
    `</tbody>` +
    `</table>`;

  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Activity-Details${dateLabel ? `-${dateLabel}` : ""}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default exportDayWiseExcel;