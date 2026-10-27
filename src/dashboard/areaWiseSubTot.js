const NUMERIC_FIELDS = [
    "m1_sale", "m2_sale", "m3_sale", "m4_sale",
    "m5_sale", "m6_sale", "m7_sale", "m8_sale",
    "m9_sale", "m10_sale", "m11_sale", "m12_sale",
    "total"
];

const sumRows = (rows) =>
    NUMERIC_FIELDS.reduce((acc, field) => {
        acc[field] = Math.round(
            rows.reduce((s, r) => s + (Number(r[field]) || 0), 0) * 100
        ) / 100;
        return acc;
    }, {});

export const areaWiseSubTot = (data) => {
    if (!data.length) return data;

    const result = [];
    let currentRegName = null;
    let currentGroupRows = [];

    data.forEach((row) => {
        const regName = row.reg_name || "Unknown";

        if (regName !== currentRegName) {
            // Flush previous group subtotal
            if (currentGroupRows.length > 0) {
                result.push({
                    ...sumRows(currentGroupRows),
                    _isSubtotal: true,
                    area_name: `Total ${currentRegName}`,
                });
            }

            // New group header
            currentRegName = regName;
            currentGroupRows = [];

            result.push({
                _isGroupHeader: true,
                area_name: "",
                m5_sale: regName,
            });
        }

        currentGroupRows.push(row);
        result.push(row);
    });

    // Flush last group
    if (currentGroupRows.length > 0) {
        result.push({
            ...sumRows(currentGroupRows),
            _isSubtotal: true,
            area_name: `Total ${currentRegName}`,
        });
    }

    // Grand Total
    result.push({
        ...sumRows(data),
        _isSubtotal: true,
        _grandTotal: true,
        area_name: "Grand Total",
    });

    return result;
};