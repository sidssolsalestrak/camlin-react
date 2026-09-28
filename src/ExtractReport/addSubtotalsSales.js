const NUMERIC_FIELDS = [
    "open_qty", "open_val", "pur_qty", "pur_val",
    "tot_qty", "sec_qty", "sec_val", "physical_qty", "cls_val"
];

const sumRows = (rows) =>
    NUMERIC_FIELDS.reduce((acc, field) => {
        acc[field] = Math.round(
            rows.reduce((s, r) => s + (Number(r[field]) || 0), 0) * 100
        ) / 100;
        return acc;
    }, {});

export const addSubtotalsSales = (data) => {
    if (!data.length) return data;

    const result = [];

    // Group: zone → region → rows
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

            // ── Region subtotal row ──
            result.push({
                ...sumRows(rows),
                _subtotal: true,
                stk_name: "",   // shown in "Distributor Name" column
                zone_name: "", reg_name: "", stk_code: "",
                city_name: "", state_name: "", cat_name: "",
                sub_name: "", code: "", prod_name: "",
                prod_price: `Total ${regionName}`, create_dt: null,
            });
        });

        // ── Zone subtotal row ──
        result.push({
            ...sumRows(allZoneRows),
            _subtotal: true,
            _zoneTotal: true,
            stk_name: "",
            zone_name: "", reg_name: "", stk_code: "",
            city_name: "", state_name: "", cat_name: "",
            sub_name: "", code: "", prod_name: "",
            prod_price: `Total ${zoneName}`, create_dt: null,
        });
    });

    result.push({
        ...sumRows(data),
        _subtotal: true,
        _grandTotal: true,
        stk_name: "",
        zone_name: "", reg_name: "", stk_code: "",
        city_name: "", state_name: "", cat_name: "",
        sub_name: "", code: "", prod_name: "",
        prod_price: "Grand Total", create_dt: null,
    });

    return result;
};