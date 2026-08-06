import XLSX from 'xlsx-js-style';

/**
 * Export order approval data to Excel with styling matching the
 * original PHP-generated "Order approval details" export.
 */
export const exportOrderApprovalToExcel = (data, options = {}) => {
    const {
        fromDate = '',
        toDate = '',
        status = '',
        grandTotal = null,
        onSuccess = () => {},
        onError = () => {}
    } = options;

    try {
        if (!data || data.length === 0) {
            onError('No data to export');
            return;
        }

        const columnHeaders = [
            'Sl', 'Region', 'PSM/KAM', 'Date', 'Customer', 'Stockist',
            'Tot qty', 'Tot free', 'Tot Value', 'Tot offer', 'Status',
            'Disc. Val.', 'Upload Invoice'
        ];

        let excelData = data.map((row, index) => ({
            'Sl': index + 1,
            'Region': row.regName || '',
            'PSM/KAM': row.psmName || '',
            'Date': row.ordDt || '',
            'Customer': row.cusProd || '',
            'Stockist': row.stk || '',
            'Tot qty': Number(row.totQty) || 0,
            'Tot free': Number(row.totFree) || 0,
            'Tot Value': Number(row.totVal) || 0,
            'Tot offer': Number(row.totOffer) || 0,
            'Status': row.statusname || '',
            'Disc. Val.': Number(row.discount) || 0,
            'Upload Invoice': '' // always blank, matches reference export
        }));

        // Total row — "Total" label sits right-aligned under Customer (col index 4),
        // same position as the reference file
        let totalRowData = null;
        if (grandTotal) {
            totalRowData = {
                'Sl': '',
                'Region': '',
                'PSM/KAM': '',
                'Date': '',
                'Customer': '',
                'Stockist': 'Total',
                'Tot qty': Number(grandTotal.qty) || 0,
                'Tot free': Number(grandTotal.free) || 0,
                'Tot Value': Number(grandTotal.val) || 0,
                'Tot offer': Number(grandTotal.offer) || 0,
                'Status': '',
                'Disc. Val.': Number(grandTotal.discVal) || 0,
                'Upload Invoice': ''
            };
            excelData.push(totalRowData);
        }

        const totalColumns = 13; // A to M

        const titleRow = Array(totalColumns).fill('');
        titleRow[0] = 'Order approval details';

        const finalMatrix = [
            titleRow,
            columnHeaders,
            ...excelData.map(row => Object.values(row))
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(finalMatrix);

        ws['!cols'] = [
            { wch: 5 },   // Sl
            { wch: 12 },  // Region
            { wch: 18 },  // PSM/KAM
            { wch: 14 },  // Date
            { wch: 30 },  // Customer
            { wch: 25 },  // Stockist
            { wch: 10 },  // Tot qty
            { wch: 10 },  // Tot free
            { wch: 12 },  // Tot Value
            { wch: 12 },  // Tot offer
            { wch: 12 },  // Status
            { wch: 12 },  // Disc. Val.
            { wch: 15 }   // Upload Invoice
        ];

        const range = XLSX.utils.decode_range(ws['!ref']);
        const titleRowIndex = 0;
        const headerRowIndex = 1;
        const dataStartIndex = 2;
        const totalRowIndex = excelData.length + 1;

        const thinBorder = {
            top: { style: 'thin', color: { rgb: "666666" } },
            bottom: { style: 'thin', color: { rgb: "666666" } },
            left: { style: 'thin', color: { rgb: "666666" } },
            right: { style: 'thin', color: { rgb: "666666" } }
        };

        // A. TITLE — plain centered heading, matches <h2> in reference (no fill)
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }
        ];
        const titleCell = XLSX.utils.encode_cell({ r: titleRowIndex, c: 0 });
        if (ws[titleCell]) {
            ws[titleCell].s = {
                font: {
                    bold: true,
                    sz: 16,
                    name: 'Calibri',
                    color: { rgb: "000000" }
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center'
                }
            };
        }

        // B. HEADER ROW — bg #3464a7, white bold text, thin #666 borders (matches reference)
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
            if (!ws[cellAddress]) continue;

            ws[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11, name: 'Calibri' },
                fill: { fgColor: { rgb: "3464A7" } },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                border: thinBorder
            };
        }

        // C. DATA ROWS — thin #666 borders on every cell, matches reference table styling
        for (let row = dataStartIndex; row < totalRowIndex; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (!ws[cellAddress]) continue;

                const isNumeric = col >= 6 && col <= 9;
                const isDiscount = col === 11;

                ws[cellAddress].s = {
                    font: { sz: 10, name: 'Calibri' },
                    alignment: {
                        horizontal: isNumeric || isDiscount ? 'right' : 'left',
                        vertical: 'center'
                    },
                    numFmt: (isNumeric || isDiscount) ? '#,##0.00' : undefined,
                    border: thinBorder
                };
            }
        }

        // D. TOTAL ROW — bold, "Total" right-aligned under Customer col, same border style
        if (grandTotal) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: col });
                if (!ws[cellAddress]) continue;

                const isLabelCol = col === 5;                 // "Total" label (Stockist col)
                const isSumCol = (col >= 6 && col <= 9) || col === 11; // Tot qty/free/Value/offer + Disc. Val.

                ws[cellAddress].s = {
                    font: { bold: true, sz: 10, name: 'Calibri' },
                    alignment: {
                        horizontal: isLabelCol || isSumCol ? 'right' : 'left',
                        vertical: 'center'
                    },
                    numFmt: isSumCol ? '#,##0.00' : undefined,
                    border: thinBorder
                };
            }
        }

        ws['!freeze'] = { xSplit: 0, ySplit: 2 };

        XLSX.utils.book_append_sheet(wb, ws, 'OrderApproval');

        const statusLabel = status || 'All';
        const from = fromDate || 'start';
        const to = toDate || 'end';
        const filename = `Order_Approval_${statusLabel}_${from}_to_${to}.xlsx`;

        const wbout = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array',
            bookSST: false
        });

        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        onSuccess('Export completed successfully');
    } catch (error) {
        console.error('Export error:', error);
        onError('Failed to export data: ' + error.message);
    }
};