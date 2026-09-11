import dayjs from "dayjs";

// Mirrors the legacy PHP export exactly: an HTML <table> dumped with a
// .xls extension (Excel/LibreOffice happily render HTML given that MIME
// type). Same header blue (#3464a7 / #fff / 600 weight), same #eee profile
// row with the 16px bold name, same border="1", same 15px base font-size.
const zeroTonull = (v) => {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || Number.isNaN(n) || n === 0) return "-";
  return v;
};

const esc = (v) => (v === null || v === undefined ? "" : String(v));

export function exportCallSummaryExcel(profile, activitySummary = [], fileName = "Activity_Reporting_Details") {
  const headerCells = [
    { label: "Sl", width: "3%", align: "left" },
    { label: "Date", width: "9%", align: "center" },
    { label: "Customer Name |<br/> Class", width: "17%", align: "center" },
    { label: "Call time", width: "8%", align: "center" },
    { label: "Detailing", width: "8%", align: "center" },
    { label: "Joint Work", width: "10%", align: "center" },
    { label: "Market Input", width: "5%", align: "center" },
    { label: "Orders", width: "5%", align: "center" },
    { label: "Free", width: "5%", align: "center" },
    { label: "Samples", width: "5%", align: "center" },
    { label: "Remarks", width: "10%", align: "center" },
    { label: "Display", width: "5%", align: "center" },
  ];

  const theadHtml = `
    <thead>
      <tr style="background-color:#3464a7;color:#fff;font-weight: 600;">
        ${headerCells
          .map(
            (c, i) =>
              `<td width="${c.width}"${i === 0 ? ' class="noborderLeft"' : ""} align="${c.align}">${c.label}</td>`
          )
          .join("")}
      </tr>
    </thead>`;

  const profileRowHtml = `
      <tr style="background-color:#eee;color:#000;font-weight: 600;">
        <td class="noborderLeft noborderRight" colspan="13">
          <span style="width:40%" class="pull-left">
            <span style="font-size:16px;"><b>${esc(profile?.sr_name)}</b></span><br>
          </span>
        </td>
      </tr>`;

  const bodyRowsHtml = activitySummary.length
    ? activitySummary
        .map((key, idx) => {
          const dotColor = Number(key.cus_type_id) === 1 ? "green" : "red";
          const callTime =
            key.call_time && dayjs(key.call_time).isValid()
              ? dayjs(key.call_time).format("h:mm a")
              : esc(key.call_time);
          const cusName = key.cus_name ? key.cus_name.charAt(0).toUpperCase() + key.cus_name.slice(1) : "";

          return `<tr>
            <td>${idx + 1}</td>
            <td>${dayjs(key.call_date).format("DD MMM YYYY")}</td>
            <td>
              <span><i class="fa fa-circle" aria-hidden="true" style="color:${dotColor};font-size:10px;"></i></span>
              <b>${esc(cusName)}</b> | ${esc(key.doc_class)}, ${esc(key.practice_type)}
              <br>
              ${esc(key.beat_name)}
            </td>
            <td><span class="pull-left">${esc(callTime)}</span></td>
            <td style="word-wrap:break-word;">${esc(key.clm_secs)}</td>
            <td>${esc(key.jnt_user)}</td>
            <td style="text-align:center;">${esc(key.market_ip_qty)}</td>
            <td style="text-align:center;">${zeroTonull(key.ord_qty)}</td>
            <td style="text-align:center;">${zeroTonull(key.free_qty)}</td>
            <td style="text-align:center;">${zeroTonull(key.samp_qty)}</td>
            <td class="noborderRight">${esc(key.call_rem)}</td>
            <td style="text-align:center;">${esc(key.display_count)}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="12" align="center">No Data</td></tr>`;

  const html = `
    <div class="panel-heading">
      Activity Reporting Details
    </div>
    <div class="col-lg-12">
      <table border="1" width="100%" style="font-size:15px;">
        ${theadHtml}
        <tbody>
          ${profileRowHtml}
          ${bodyRowsHtml}
        </tbody>
      </table>
    </div>`;

  const blob = new Blob(
    [
      "\ufeff", // BOM so Excel picks up UTF-8 correctly
      html,
    ],
    { type: "application/vnd.ms-excel" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}