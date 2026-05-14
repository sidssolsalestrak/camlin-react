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
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // Prepare data for Chart.js
  const days = graphData.map(row => row.sale_day);
  const cmData = graphData.map(row => Number(row.cm_qty) || 0);
  const lmData = graphData.map(row => Number(row.lm_qty) || 0);
  const lyData = graphData.map(row => Number(row.lym_qty) || 0);
  
  // Create chart using Chart.js
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [
        {
          label: 'CM (Current Month)',
          data: cmData,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(54, 162, 235)'
        },
        {
          label: 'LM (Last Month)',
          data: lmData,
          borderColor: 'rgb(255, 206, 86)',
          backgroundColor: 'rgba(255, 206, 86, 0.1)',
          borderWidth: 2,
          tension: 0.1,
          borderDash: [5, 5],
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(255, 206, 86)'
        },
        {
          label: 'LY (Last Year)',
          data: lyData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          borderWidth: 2,
          tension: 0.1,
          borderDash: [5, 5],
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(75, 192, 192)'
        }
      ]
    },
    options: {
      responsive: false,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: `Day wise Cumulative Sales Quantity (pcs) - ${dayjs(selMonth).format('MMMM YYYY')}`,
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Day of Month',
            font: {
              size: 11,
              weight: 'bold'
            }
          },
          ticks: {
            stepSize: 2
          }
        },
        y: {
          title: {
            display: true,
            text: 'Cumulative Quantity (pcs)',
            font: {
              size: 11,
              weight: 'bold'
            }
          },
          ticks: {
            callback: function(value) {
              return value.toLocaleString();
            }
          }
        }
      }
    }
  });
  
  // Wait for chart to render
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Convert canvas to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

// ── Sheet 1: Graph with embedded chart image ──────────────────────────────────
async function buildGraphSheetWithChart(worksheet, graphData, selectedMonthStr, selMonth, workbook) {
  const isCurrent = dayjs(selectedMonthStr, 'YYYY-MM').format('MMYYYY') === dayjs().format('MMYYYY');
  const todayDay = dayjs().date();

  // Generate chart image
  const chartImageBlob = await generateChartImage(graphData, selMonth);
  const imageId = workbook.addImage({
    buffer: await chartImageBlob.arrayBuffer(),
    extension: 'png'
  });
  
  // Add chart image to worksheet (positioned at top right)
  worksheet.addImage(imageId, {
    tl: { col: 6, row: 1 },
    br: { col: 20, row: 20 }
  });

  // Add title
  const titleRow = worksheet.getRow(1);
  titleRow.getCell(1).value = 'Day wise Cumulative Sales Quantity (pcs)';
  titleRow.getCell(1).font = { name: 'Arial', size: 12, bold: true };
  titleRow.height = 20;

  // Add subtitle
  const subtitleRow = worksheet.getRow(2);
  subtitleRow.getCell(1).value = 'Data Table (Chart displayed to the right)';
  subtitleRow.getCell(1).font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF666666' } };

  // Add headers (starting at row 4 to leave space for chart)
  const headerRow = worksheet.getRow(4);
  headerRow.getCell(1).value = 'Day';
  headerRow.getCell(2).value = 'CM';
  headerRow.getCell(3).value = 'LM';
  headerRow.getCell(4).value = 'LY';

  // Apply header styles
  [1, 2, 3, 4].forEach(col => {
    applyHeaderStyle(headerRow.getCell(col));
  });

  // Add data rows
  let rowNum = 5;
  graphData.forEach(row => {
    let cm = Number(row.cm_qty) || 0;
    if (isCurrent && row.sale_day > todayDay) cm = null;

    const dataRow = worksheet.getRow(rowNum);
    dataRow.getCell(1).value = row.sale_day;
    dataRow.getCell(2).value = cm;
    dataRow.getCell(3).value = parseFloat(row.lm_qty || 0);
    dataRow.getCell(4).value = parseFloat(row.lym_qty || 0);

    // Apply data styles
    [1, 2, 3, 4].forEach(col => {
      const cell = dataRow.getCell(col);
      applyDataStyle(cell, { align: col === 1 ? 'center' : 'right' });
      
      // Format numbers
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

  // Set column widths
  worksheet.getColumn(1).width = 8;
  worksheet.getColumn(2).width = 15;
  worksheet.getColumn(3).width = 15;
  worksheet.getColumn(4).width = 15;
  
  // Add total row
  const totalRow = worksheet.getRow(rowNum);
  totalRow.getCell(1).value = 'Total';
  totalRow.getCell(1).font = { bold: true };
  
  // Calculate totals for visible data
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

// ── Sheet 2: Primary Sales Data Table ───────────────────────────────────────
function buildDataSheet(worksheet, primaryData, nameField, selTypeName, selMonth) {
  const prevYear = dayjs(selMonth).subtract(1, 'year').format('MMM YYYY');
  const fyPrevYear = `FY ${dayjs(selMonth).subtract(1, 'year').format('YYYY')}`;

  // Row 1: Group headers
  const headerRow1 = worksheet.getRow(1);
  headerRow1.getCell(1).value = `${selTypeName} Sales`;
  headerRow1.getCell(2).value = 'MONTH TO DATE';
  headerRow1.getCell(8).value = 'YEAR TO DATE';

  // Merge cells for group headers
  worksheet.mergeCells('B1:G1');
  worksheet.mergeCells('H1:M1');

  // Style first header row
  applyHeaderStyle(headerRow1.getCell(1), TAN_HEADER);
  for (let col = 2; col <= 13; col++) {
    applyHeaderStyle(headerRow1.getCell(col), BLUE_HEADER);
  }

  // Row 2: Sub-column headers
  const headerRow2 = worksheet.getRow(2);
  const headers = [
    `${selTypeName} Name`,
    'Sales', 'Free', 'Total', prevYear, 'Growth Qty', '%age',
    'Sales', 'Free', 'Total', fyPrevYear, 'Growth Qty', '%age'
  ];
  
  headers.forEach((header, idx) => {
    headerRow2.getCell(idx + 1).value = header;
    applyHeaderStyle(headerRow2.getCell(idx + 1), BLUE_HEADER);
  });

  // Add data rows
  let rowNum = 3;
  primaryData.forEach(dataRow => {
    const excelRow = worksheet.getRow(rowNum);
    const isTotal = dataRow.isTotal;

    // Set values
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

    // Apply styles
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

      // Format numbers
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

  // Set column widths
  worksheet.getColumn(1).width = 30;
  [2, 3, 4, 8, 9, 10].forEach(col => worksheet.getColumn(col).width = 10);
  [5, 11].forEach(col => worksheet.getColumn(col).width = 14);
  [6, 12].forEach(col => worksheet.getColumn(col).width = 12);
  [7, 13].forEach(col => worksheet.getColumn(col).width = 8);
}

// ── Sheet 3: Day Wise Data ───────────────────────────────────────────────────
function buildDayWiseDataSheet(worksheet, graphData, selMonth, selectedMonthStr) {
  const isCurrent = dayjs(selectedMonthStr, 'YYYY-MM').format('MMYYYY') === dayjs().format('MMYYYY');
  const todayDay = dayjs().date();

  const cmLabel = `Current Month (${dayjs(selMonth).format('MMM YYYY')})`;
  const lmLabel = `Last Month (${dayjs(selMonth).subtract(1, 'month').format('MMM YYYY')})`;
  const lyLabel = `Last Year (${dayjs(selMonth).subtract(1, 'year').format('YYYY')})`;

  // Headers
  const headerRow = worksheet.getRow(1);
  headerRow.getCell(1).value = 'Day';
  headerRow.getCell(2).value = cmLabel;
  headerRow.getCell(3).value = lmLabel;
  headerRow.getCell(4).value = lyLabel;

  // Header colors matching chart lines
  const headerColors = ['FF555555', 'FF3A86FF', 'FFFFB703', 'FF38B000'];
  [1, 2, 3, 4].forEach((col, idx) => {
    const cell = headerRow.getCell(col);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerColors[idx] }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thick', color: { argb: 'FF000000' } },
      left: { style: 'thick', color: { argb: 'FF000000' } },
      bottom: { style: 'thick', color: { argb: 'FF000000' } },
      right: { style: 'thick', color: { argb: 'FF000000' } }
    };
  });

  // Data rows
  let rowNum = 2;
  graphData.forEach(row => {
    let cm = Number(row.cm_qty) || 0;
    if (isCurrent && row.sale_day > todayDay) cm = null;

    const excelRow = worksheet.getRow(rowNum);
    const isToday = isCurrent && row.sale_day === todayDay;
    const isFuture = isCurrent && row.sale_day > todayDay;
    const bgColor = isToday ? 'FFFFF2CC' : isFuture ? 'FFF5F5F5' : WHITE;

    excelRow.getCell(1).value = row.sale_day;
    excelRow.getCell(2).value = cm !== null ? Math.round(cm) : null;
    excelRow.getCell(3).value = Math.round(Number(row.lm_qty) || 0);
    excelRow.getCell(4).value = Math.round(Number(row.lym_qty) || 0);

    // Apply styles
    [1, 2, 3, 4].forEach(col => {
      const cell = excelRow.getCell(col);
      const val = cell.value;

      if ((val === null || val === undefined || val === 0) && col !== 1) {
        cell.value = '-';
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF888888' } };
      } else {
        cell.font = {
          name: 'Arial',
          size: 10,
          bold: isToday,
          color: { argb: 'FF000000' }
        };
      }

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      cell.alignment = {
        horizontal: col === 1 ? 'center' : 'right',
        vertical: 'middle'
      };

      if (isToday) {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thick', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      }
    });

    rowNum++;
  });

  // Add total row
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
  
  totalRow.getCell(2).value = Math.round(cmTotal) || '-';
  totalRow.getCell(3).value = Math.round(lmTotal) || '-';
  totalRow.getCell(4).value = Math.round(lyTotal) || '-';
  
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

  // Column widths
  worksheet.getColumn(1).width = 8;
  worksheet.getColumn(2).width = 25;
  worksheet.getColumn(3).width = 25;
  worksheet.getColumn(4).width = 22;
}

// ── Main export function ──────────────────────────────────────────────────────
export async function downloadPrimarySalesExcelWithChart({
  graphData = [],
  primaryData = [],
  nameField = 'cat_name',
  selTypeName = 'Category Wise',
  selMonth = dayjs(),
  selectedMonthStr,
}) {
  const monthStr = selectedMonthStr || dayjs(selMonth).format('YYYY-MM');

  const workbook = new ExcelJS.Workbook();

  // Sheet 1 - Graph data with embedded chart image
  const wsGraph = workbook.addWorksheet('Dashboard');
  await buildGraphSheetWithChart(wsGraph, graphData, monthStr, selMonth, workbook);

  // Sheet 2 - Primary sales table
  const wsData = workbook.addWorksheet('Sales Data');
  buildDataSheet(wsData, primaryData, nameField, selTypeName, selMonth);

  // Sheet 3 - Day-wise data
  const wsDayWise = workbook.addWorksheet('Day Wise Data');
  buildDayWiseDataSheet(wsDayWise, graphData, selMonth, monthStr);

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Primary_Sales_Report_${dayjs(selMonth).format('MMM_YYYY')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}