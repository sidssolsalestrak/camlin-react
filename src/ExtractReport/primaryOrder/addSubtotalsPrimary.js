const NUMERIC_FIELDS = ["ord_qty", "ord_val"];

const sumRows = (rows) =>
    NUMERIC_FIELDS.reduce((acc, field) => {
        acc[field] = Math.round(
            rows.reduce((s, r) => s + (Number(r[field]) || 0), 0) * 100
        ) / 100;
        return acc;
    }, {});

export const addSubtotalsPrimary = (data,isTable=true) => {
    if (!data.length) return data;

    const result = [];
    const zoneMap = {};

    data.forEach((row) => {
        const z = row.zone_name || "Unknown";
        const r = row.reg_name || "Unknown";
        if (!zoneMap[z]) zoneMap[z] = {};
        if (!zoneMap[z][r]) zoneMap[z][r] = [];
        zoneMap[z][r].push(row);
    });

    Object.entries(zoneMap).forEach(([zoneName, regions]) => {
        const allZoneRows = [];

        Object.entries(regions).forEach(([regionName, rows]) => {
            result.push(...rows);
            allZoneRows.push(...rows);

            // ── Region subtotal ──
            result.push({
                ...sumRows(rows),
                _isSubtotal: true,
                index: "", ord_id: "", ord_date: "",
                stk_code: "", stk_name: "", distributor: "",
                user_name: isTable?`Total ${regionName}`:`${regionName}`,
            });
        });

        // ── Zone subtotal ──
        !isTable && result.push({
            ...sumRows(allZoneRows),
            _isSubtotal: true,
            _zoneTotal: true,
            index: "", ord_id: "", ord_date: "",
            stk_code: "", stk_name: "", distributor: "",
            user_name: isTable?`Total ${zoneName}`:`${zoneName}`,
        });
    });

    // ── Grand Total ──
    result.push({
        ...sumRows(data),
        _isSubtotal: true,
        _grandTotal: true,
        index: "", ord_id: "", ord_date: "",
        stk_code: "", stk_name: "", distributor: "",
        user_name: "Grand Total",
    });

    return result;
};