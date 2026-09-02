export const zeroTonullVal = (value) => {
    const num = Number(value);
    return num === 0 || value === '' || value == null ? '-' : num;
};

export const ZeroToRound = (value) => {
    if (value === '' || value == null || isNaN(value)) return '';
    return Number(value).toFixed(2);
};

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const buildMonthNames = (yr) => {
    const yy = String(yr).slice(-2);
    const names = {};
    for (let i = 1; i <= 12; i++) names[i] = `${MONTH_ABBR[i - 1]}-${yy}`;
    return names;
};

const emptyMonths = () => {
    const m = {};
    for (let i = 1; i <= 12; i++) m[i] = '';
    return m;
};

const emptyTally = () => {
    const t = {};
    for (let i = 1; i <= 12; i++) t[i] = 0;
    return t;
};

export const groupBeatCoverageRows = (rawRows) => {
    const report = {};

    rawRows.forEach((row) => {
        const key = `${row.area_name}_${row.sr_id}_${row.beat_id}`;
        if (!report[key]) {
            report[key] = {
                sr_id: row.sr_id,
                sr_name: row.sr_name,
                hq_name: row.hq_name,
                zone_name: row.zone_name,
                zone_id: row.zone_id,
                area_name: row.area_name,
                reg_name: row.reg_name,
                beat_name: row.beat_name,
                months: emptyMonths(),
            };
        }
        report[key].months[row.mth_no] = row.call_avg;
    });

    return Object.values(report);
};

// ── NOTE ──
// PHP does NOT reorder or group rows by zone before rendering — it walks rows
// in their natural incoming order and prints a subtotal every time zone_name
// actually changes from the previous row. If the same zone name appears again
// later, non-contiguously, it gets its OWN separate subtotal block (not merged
// with the earlier one) — this is why PHP can show "Total West" and later
// "Total west" as two distinct rows. So we must NOT reorder/group rows here —
// just use them in the order groupBeatCoverageRows/Object.values already gives.

export const buildDisplayRows = (groupedRows) => {
    const displayRows = [];

    let prevArea = ''; // holds zone_name exactly as-is, compared with strict equality — matches PHP's `!=` behavior
    let prevSr = '';
    let counter = 1;

    let areaTotal = emptyTally();
    let areaCount = emptyTally();
    const grandTotal = emptyTally();
    const grandCount = emptyTally();

    const pushAreaTotalRow = (label) => {
        const totals = {};
        for (let i = 1; i <= 12; i++) {
            totals[i] = areaCount[i] > 0 ? ZeroToRound(areaTotal[i] / areaCount[i]) : '';
        }
        displayRows.push({ type: 'groupTotal', label, totals });
        areaTotal = emptyTally();
        areaCount = emptyTally();
    };

    groupedRows.forEach((row) => {
        if (prevArea !== '' && prevArea !== row.zone_name) {
            pushAreaTotalRow(prevArea);
            prevSr = '';
        }

        const isNewSr = prevSr !== row.sr_id;

        const dataRow = {
            type: 'data',
            si: isNewSr ? counter : null,
            sr_name: isNewSr ? row.sr_name : null,
            hq_name: isNewSr ? row.hq_name : null,
            area_name: isNewSr ? row.area_name : null,
            beat_name: row.beat_name,
            months: {},
        };

        for (let i = 1; i <= 12; i++) {
            const raw = row.months[i] !== '' && row.months[i] != null ? row.months[i] : 0;
            const num = Number(raw) || 0;

            dataRow.months[i] = zeroTonullVal(num);

            areaTotal[i] += num;
            grandTotal[i] += num;
            if (num !== 0) {
                areaCount[i]++;
                grandCount[i]++;
            }
        }

        displayRows.push(dataRow);

        if (isNewSr) counter++;
        prevSr = row.sr_id;
        prevArea = row.zone_name;
    });

    if (prevArea !== '') {
        pushAreaTotalRow(prevArea);
    }

    const grandTotals = {};
    for (let i = 1; i <= 12; i++) {
        grandTotals[i] = grandCount[i] > 0 ? ZeroToRound(grandTotal[i] / grandCount[i]) : '';
    }

    return { displayRows, grandTotals };
};

export const buildExportRows = (rawData, yr) => {
    const monthNames = buildMonthNames(yr);
    const grouped = groupBeatCoverageRows(rawData || []);

    return grouped.map((row) => {
        const exportRow = {
            sr_name: row.sr_name,
            hq_name: row.hq_name,
            area_name: row.area_name,
            beat_name: row.beat_name,
        };
        Object.entries(monthNames).forEach(([mthNo, label]) => {
            const raw = row.months[mthNo] !== '' && row.months[mthNo] != null ? row.months[mthNo] : 0;
            exportRow[label] = zeroTonullVal(Number(raw) || 0);
        });
        return exportRow;
    });
};

export const buildGrandTotalRow = (rawData, yr) => {
    const monthNames = buildMonthNames(yr);
    const grouped = groupBeatCoverageRows(rawData || []);

    const grandTotal = emptyTally();
    const grandCount = emptyTally();

    grouped.forEach((row) => {
        for (let i = 1; i <= 12; i++) {
            const raw = row.months[i] !== '' && row.months[i] != null ? row.months[i] : 0;
            const num = Number(raw) || 0;
            grandTotal[i] += num;
            if (num !== 0) grandCount[i]++;
        }
    });

    const totalsRow = {
        sr_name: 'Grand Total',
        hq_name: '',
        area_name: '',
        beat_name: '',
    };
    Object.entries(monthNames).forEach(([mthNo, label]) => {
        totalsRow[label] = grandCount[mthNo] > 0
            ? ZeroToRound(grandTotal[mthNo] / grandCount[mthNo])
            : '';
    });
    return totalsRow;
};