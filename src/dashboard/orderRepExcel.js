import XLSX from 'xlsx-js-style';

/**
 * Export order approval data to Excel with full styling and Main Header
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

        // 1. Define Column Headers (They were missing before!)
        const columnHeaders = [
            'Sl', 'Region', 'PSM/KAM', 'Date', 'Customer', 'Stockist', 
            'Tot qty', 'Tot free', 'Tot Value', 'Tot offer', 'Status', 
            'Disc. Val.', 'Upload Invoice'
        ];

        // 2. Prepare data for Excel (Data Rows)
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
            'Upload Invoice': row.ordInv ? 'Yes' : 'No'
        }));

        // 3. Prepare Total Row
        let totalRowData = null;
        if (grandTotal) {
            totalRowData = {
                'Sl': '',
                'Region': '',
                'PSM/KAM': '',
                'Date': '',
                'Customer': 'Total',
                'Stockist': '',
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

        // -----------------------------------------------------
        // FIX: Build the Matrix MANUALLY to preserve headers
        // -----------------------------------------------------
        const totalColumns = 13; // A to M
        
        // 1. Create Title Row (All empty except first cell)
        const titleRow = Array(totalColumns).fill(''); 
        titleRow[0] = 'Order approval details'; 

        // 2. Build the matrix: [Title Row] + [Column Headers] + [Data Rows]
        const finalMatrix = [
            titleRow, 
            columnHeaders, 
            ...excelData.map(row => Object.values(row))
        ];

        // Create workbook and worksheet from the final matrix
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(finalMatrix);

        // 4. Define column widths
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

        // -----------------------------------------------------
        // APPLY STYLES
        // -----------------------------------------------------
        
        // Get ranges (Title = row 0, Headers = row 1, Data starts at row 2)
        const range = XLSX.utils.decode_range(ws['!ref']);
        const titleRowIndex = 0;
        const headerRowIndex = 1;
        const dataStartIndex = 2;
        const totalRowIndex = excelData.length + 1; // data length + 1 for the header row

        // A. STYLE: MAIN HEADER TITLE
        // Merge cells A1:M1 for the title
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } } // Merge row 0, columns 0 to 12
        ];

        // Style the A1 cell (which represents the whole merged area)
        const titleCell = XLSX.utils.encode_cell({ r: titleRowIndex, c: 0 });
        if (ws[titleCell]) {
            ws[titleCell].s = {
                font: { 
                    bold: true, 
                    sz: 18, 
                    name: 'Calibri',
                    color: { rgb: "1E3A5F" } // Dark blue text
                },
                alignment: { 
                    horizontal: 'center', // Center align
                    vertical: 'center'
                },
                fill: { fgColor: { rgb: "F2F2F2" } } // Light gray background for title
            };
        }

        // B. STYLE: HEADER ROW (Row 1 now)
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
            if (!ws[cellAddress]) continue;
            
            ws[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11, name: 'Calibri' },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } }
                }
            };
        }

        // C. STYLE: DATA ROWS (Rows 2 to Total-Row-1)
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
                    border: {
                        bottom: { style: 'thin', color: { rgb: "D0D0D0" } },
                        left: { style: 'thin', color: { rgb: "D0D0D0" } },
                        right: { style: 'thin', color: { rgb: "D0D0D0" } }
                    }
                };
            }
        }

        // D. STYLE: TOTAL ROW
        if (grandTotal) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: col });
                if (!ws[cellAddress]) continue;

                const isNumeric = col >= 6 && col <= 9;
                const isDiscount = col === 11;
                
                ws[cellAddress].s = {
                    font: { bold: true, sz: 10, name: 'Calibri' },
                    fill: { fgColor: { rgb: "E8E8E8" } },
                    alignment: { 
                        horizontal: col === 4 ? 'left' : (isNumeric || isDiscount ? 'right' : 'center'),
                        vertical: 'center'
                    },
                    numFmt: (isNumeric || isDiscount) ? '#,##0.00' : undefined,
                    border: {
                        top: { style: 'medium', color: { rgb: "000000" } },
                        bottom: { style: 'medium', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } }
                    }
                };
            }
        }

        // Apply freeze pane (Freezing rows 0 & 1, so data starts at row 2)
        ws['!freeze'] = { xSplit: 0, ySplit: 2 };

        // Add the worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'OrderApproval');

        // Generate filename
        const statusLabel = status || 'All';
        const from = fromDate || 'start';
        const to = toDate || 'end';
        const filename = `Order_Approval_${statusLabel}_${from}_to_${to}.xlsx`;

        // Write the file
        const wbout = XLSX.write(wb, { 
            bookType: 'xlsx', 
            type: 'array',
            bookSST: false
        });

        // Create blob and download
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