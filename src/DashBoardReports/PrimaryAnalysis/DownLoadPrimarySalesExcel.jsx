import ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import Chart from 'chart.js/auto';

// ── Helper functions ──────────────────────────────────────────────────────────
const BLUE_HEADER = 'FF8DB4E3';
const TAN_HEADER = 'FFDDD9C3';
const GREY_TOTAL = 'FFA9A9A9';
const WHITE = 'FFFFFFFF';

function applyHeaderStyle(cell, bgColor = BLUE_HEADER) {
  cell.font = { name: 'Arial', size: 10, bold: true };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: bgColor }
  };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };
}

function applyDataStyle(cell, options = {}) {
  cell.font = {
    name: 'Arial',
    size: 10,
    bold: options.bold || false,
    color: options.fontColor ? { argb: options.fontColor } : undefined
  };

  if (options.bgColor) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.bgColor }
    };
  }

  cell.alignment = {
    horizontal: options.align || 'center',
    vertical: 'middle'
  };

  cell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };
}

// ── Generate chart as image using Chart.js ────────────────────────────────────
async function generateChartImage(graphData, selMonth) {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 550;

  const ctx = canvas.getContext('2d');

  const days = graphData.map(row => row.sale_day);
  const cmData = graphData.map(row => Number(row.cm_qty) || 0);
  const lmData = graphData.map(row => Number(row.lm_qty) || 0);
  const lyData = graphData.map(row => Number(row.lym_qty) || 0);

  const customCanvasBackgroundColor = {
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart) => {
      const ctx = chart.canvas.getContext('2d');
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    }
  };

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [
        {
          label: 'CM',
          data: cmData,
          borderColor: '#4F81BD',
          backgroundColor: '#4F81BD',
          borderWidth: 2,
          tension: 0,
          pointStyle: 'rectRot',
          pointRadius: 4,
          pointHoverRadius: 5,
          fill: false
        },
        {
          label: 'LM',
          data: lmData,
          borderColor: '#C0504D',
          backgroundColor: '#C0504D',
          borderWidth: 1,
          tension: 0,
          pointStyle: 'rect',
          pointRadius: 3,
          fill: false
        },
        {
          label: 'LY',
          data: lyData,
          borderColor: '#9BBB59',
          backgroundColor: '#9BBB59',
          borderWidth: 2,
          tension: 0,
          pointStyle: 'triangle',
          pointRadius: 4,
          fill: false
        }
      ]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      layout: { padding: 20 },
      plugins: {
        title: {
          display: true,
          text: 'Day wise Cum. Sales Qty pcs',
          color: '#000000',
          font: { size: 22, weight: 'normal', family: 'Arial' },
          padding: { bottom: 20 }
        },
        legend: {
          position: 'right',
          labels: {
            color: '#000000',
            font: { size: 12, family: 'Arial' },
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: { enabled: true }
      },
      scales: {
        x: {
          grid: { color: '#A6A6A6', lineWidth: 1 },
          ticks: { color: '#000000', font: { family: 'Arial', size: 10 } },
          border: { color: '#7F7F7F' }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#A6A6A6', lineWidth: 1 },
          ticks: {
            color: '#000000',
            font: { family: 'Arial', size: 10 },
            callback: function (value) {
              return value.toLocaleString();
            }
          },
          border: { color: '#7F7F7F' }
        }
      },
      elements: { line: { cubicInterpolationMode: 'default' } }
    },
    plugins: [customCanvasBackgroundColor]
  });

  await new Promise(resolve => setTimeout(resolve, 300));

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}

// ── Sheet 1: Graph with embedded chart image ──────────────────────────────────
async function buildGraphSheetWithChart(worksheet, graphData, selectedMonthStr, selMonth, workbook) {
  const isCurrent = dayjs(selectedMonthStr, 'YYYY-MM').format('MMYYYY') === dayjs().format('MMYYYY');
  const todayDay = dayjs().date();

  const chartImageBlob = await generateChartImage(graphData, selMonth);
  const imageId = workbook.addImage({
    buffer: await chartImageBlob.arrayBuffer(),
    extension: 'png'
  });

  worksheet.addImage(imageId, {
    tl: { col: 6, row: 1 },
    br: { col: 20, row: 20 }
  });

  const headerRow = worksheet.getRow(1);
  headerRow.getCell(1).value = 'Day';
  headerRow.getCell(2).value = 'CM';
  headerRow.getCell(3).value = 'LM';
  headerRow.getCell(4).value = 'LY';

  [1, 2, 3, 4].forEach(col => {
    applyHeaderStyle(headerRow.getCell(col));
  });

  let rowNum = 2;
  graphData.forEach(row => {
    let cm = Number(row.cm_qty) || 0;
    if (isCurrent && row.sale_day > todayDay) cm = null;

    const dataRow = worksheet.getRow(rowNum);
    dataRow.getCell(1).value = row.sale_day;
    dataRow.getCell(2).value = cm;
    dataRow.getCell(3).value = parseFloat(row.lm_qty || 0);
    dataRow.getCell(4).value = parseFloat(row.lym_qty || 0);

    [1, 2, 3, 4].forEach(col => {
      const cell = dataRow.getCell(col);
      applyDataStyle(cell, { align: col === 1 ? 'center' : 'right' });

      if (col > 1 && cell.value !== null && cell.value !== undefined) {
        if (cell.value === 0) {
          cell.value = '-';
        } else {
          cell.numFmt = '#,##0';
        }
      }
    });

    rowNum++;
  });

  worksheet.getColumn(1).width = 8;
  worksheet.getColumn(2).width = 15;
  worksheet.getColumn(3).width = 15;
  worksheet.getColumn(4).width = 15;

  const totalRow = worksheet.getRow(rowNum);
  totalRow.getCell(1).value = 'Total';
  totalRow.getCell(1).font = { bold: true };

  const cmTotal = graphData.reduce((sum, row) => {
    let val = Number(row.cm_qty) || 0;
    if (isCurrent && row.sale_day > todayDay) val = 0;
    return sum + val;
  }, 0);

  const lmTotal = graphData.reduce((sum, row) => sum + (Number(row.lm_qty) || 0), 0);
  const lyTotal = graphData.reduce((sum, row) => sum + (Number(row.lym_qty) || 0), 0);

  totalRow.getCell(2).value = cmTotal || '-';
  totalRow.getCell(3).value = lmTotal || '-';
  totalRow.getCell(4).value = lyTotal || '-';

  [2, 3, 4].forEach(col => {
    const cell = totalRow.getCell(col);
    if (cell.value !== '-') {
      cell.numFmt = '#,##0';
    }
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    };
  });
}

// ── Sheet 2: Primary Sales Data Table ────────────────────────────────────────
function buildDataSheet(worksheet, primaryData, nameField, selTypeName, selMonth,dateLabel) {
  const prevYear = dayjs(selMonth).subtract(1, 'year').format('MMM YYYY');
  const fyPrevYear = `FY ${dayjs(selMonth).subtract(1, 'year').format('YYYY')}`;

  // ── Row 1: Title ──
  const titleRow = worksheet.getRow(1);
  titleRow.getCell(1).value = `Primary Sales Dashboard for the Month: ${
    selMonth ? dayjs(selMonth).format('MMM YYYY') : ''
  }`;
  titleRow.getCell(1).font = { name: 'Arial', size: 12, bold: true };
  titleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  titleRow.height = 25;
  worksheet.mergeCells('A1:M1');

  // ── Row 2: *Qty note header (TAN, full width) ──
  const noteRow = worksheet.getRow(2);
  noteRow.getCell(1).value = `*Qty in pcs${dateLabel}`;
  noteRow.height = 18;
  worksheet.mergeCells('A2:M2');
  applyHeaderStyle(noteRow.getCell(1), TAN_HEADER);

  // ── Row 3: Group headers (selTypeName | MONTH TO DATE | YEAR TO DATE) ──
  const groupHeaderRow = worksheet.getRow(3);
  groupHeaderRow.getCell(2).value = 'MONTH TO DATE';
  groupHeaderRow.getCell(8).value = 'YEAR TO DATE';
  groupHeaderRow.height = 18;

  worksheet.mergeCells('B3:G3');
  worksheet.mergeCells('H3:M3');

  applyHeaderStyle(groupHeaderRow.getCell(1),BLUE_HEADER );
  for (let col = 2; col <= 13; col++) {
    applyHeaderStyle(groupHeaderRow.getCell(col), BLUE_HEADER);
  }

  // ── Row 4: Sub-column headers ──
  const subHeaderRow = worksheet.getRow(4);
  const headers = [
    `${selTypeName} Name`,
    'Sales', 'Free', 'Total', prevYear, 'Growth Qty', '%age',
    'Sales', 'Free', 'Total', fyPrevYear, 'Growth Qty', '%age'
  ];

  headers.forEach((header, idx) => {
    subHeaderRow.getCell(idx + 1).value = header;
    applyHeaderStyle(subHeaderRow.getCell(idx + 1), BLUE_HEADER);
  });

  // ── Data rows start at row 5 ──
  let rowNum = 5;
  primaryData.forEach(dataRow => {
    const excelRow = worksheet.getRow(rowNum);
    const isTotal = dataRow.isTotal;

    excelRow.getCell(1).value = dataRow[nameField] || '';
    excelRow.getCell(2).value = dataRow.sale_qty || 0;
    excelRow.getCell(3).value = dataRow.free_qty || 0;
    excelRow.getCell(4).value = dataRow.totalqty || 0;
    excelRow.getCell(5).value = dataRow.lym_sale_qty || 0;
    excelRow.getCell(6).value = dataRow.growthqty || 0;
    excelRow.getCell(7).value = dataRow.percentage || 0;
    excelRow.getCell(8).value = dataRow.fy_sale_qty || 0;
    excelRow.getCell(9).value = dataRow.fy_free_qty || 0;
    excelRow.getCell(10).value = dataRow.fytotalqty || 0;
    excelRow.getCell(11).value = dataRow.ly_sale_qty || 0;
    excelRow.getCell(12).value = dataRow.fyGrowthqty || 0;
    excelRow.getCell(13).value = dataRow.fypercentage || 0;

    for (let col = 1; col <= 13; col++) {
      const cell = excelRow.getCell(col);
      const isNameCol = col === 1;
      const isTotalCol = col === 4 || col === 10;
      const isNegative = typeof cell.value === 'number' && cell.value < 0;

      applyDataStyle(cell, {
        bgColor: isTotal ? GREY_TOTAL : WHITE,
        bold: isTotal || isTotalCol,
        fontColor: isNegative ? 'FFFF0000' : undefined,
        align: isNameCol ? 'left' : 'right'
      });

      if (!isNameCol && cell.value !== null && cell.value !== undefined && cell.value !== '') {
        if (cell.value === 0) {
          cell.value = '-';
        } else if (col === 7 || col === 13) {
          cell.numFmt = '0.00';
        } else {
          cell.numFmt = '#,##0';
        }
      } else if (!isNameCol && cell.value === 0) {
        cell.value = '-';
      }
    }

    rowNum++;
  });

  // ── Column widths ──
  worksheet.getColumn(1).width = 30;
  [2, 3, 4, 8, 9, 10].forEach(col => worksheet.getColumn(col).width = 10);
  [5, 11].forEach(col => worksheet.getColumn(col).width = 14);
  [6, 12].forEach(col => worksheet.getColumn(col).width = 12);
  [7, 13].forEach(col => worksheet.getColumn(col).width = 8);
}

// ── Main export function ──────────────────────────────────────────────────────
export async function downloadPrimarySalesExcelWithChart({
  graphData = [],
  primaryData = [],
  nameField = 'cat_name',
  selTypeName = 'Category Wise',
  selMonth = dayjs(),
  selectedMonthStr,
  dateLabel
}) {
  const monthStr = selectedMonthStr || dayjs(selMonth).format('YYYY-MM');

  const workbook = new ExcelJS.Workbook();

  const wsGraph = workbook.addWorksheet('Dashboard');
  await buildGraphSheetWithChart(wsGraph, graphData, monthStr, selMonth, workbook);

  const wsData = workbook.addWorksheet('Sales Data');
  buildDataSheet(wsData, primaryData, nameField, selTypeName, selMonth,  dateLabel);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Primary_Sales_Report.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}