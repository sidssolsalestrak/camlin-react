
export function processSalesData(rows, allSKUs, type, years) {
    const { secondLastYear, lastYear, currentYear } = years;
    const regionsMap = {};

    for (const row of rows) {
        if (!regionsMap[row.reg_id]) {
            regionsMap[row.reg_id] = {
                reg_id:   row.reg_id,
                regName:  row.reg_name,
                items:    {},
            };
        }

        // key differs by type
        const itemKey = type == 3 ? row.prod_id : type == 2 ? row.subcatId : row.mth;
        const label   = type == 3 ? row.prod_name : type == 2 ? row.sub_name : row.mthName;

        const growth =
            row.fy_sale2 > 0 && row.fy_sale3 > 0
                ? +((( row.fy_sale3 / row.fy_sale2) * 100) - 100).toFixed(2)
                : 0;

        regionsMap[row.reg_id].items[itemKey] = {
            label,
            fy1: row.fy_sale1,
            fy2: row.fy_sale2,
            fy3: row.fy_sale3,
            growth,
        };
    }

    // Gap-fill: every region must have every SKU/brand (zero if missing)
    if (allSKUs.length > 0) {
        for (const region of Object.values(regionsMap)) {
            for (const sku of allSKUs) {
                const key = type == 3 ? sku.id : sku.id; // same for brand(type2)/sku(type3)
                if (!region.items[key]) {
                    region.items[key] = {
                        label:  type == 3 ? sku.prod_name : sku.sub_name,
                        fy1: 0, fy2: 0, fy3: 0, growth: 0,
                    };
                }
            }
        }
    }

    // Convert to array + compute region totals
    return Object.values(regionsMap).map((region) => {
        const rows = Object.values(region.items);
        const total = rows.reduce(
            (acc, r) => ({
                fy1: acc.fy1 + Number(r.fy1),
                fy2: acc.fy2 + Number(r.fy2),
                fy3: acc.fy3 + Number(r.fy3),
                growth: acc.growth + Number(r.growth),
            }),
            { fy1: 0, fy2: 0, fy3: 0, growth: 0 }
        );
        total.growth = +total.growth.toFixed(2);

        // graph data for Google Charts / Recharts etc.
        const graphData = [
            ['SKU', secondLastYear, lastYear, currentYear],
            ...rows.map((r) => [r.label, r.fy1, r.fy2, r.fy3]),
        ];

        return { ...region, rows, total, graphData };
    });
}