const NUMERIC_FIELDS = ["totQty", "totFree", "totVal", "totOffer", "ordDiscVal"];
const sumRows = (rows) =>
  NUMERIC_FIELDS.reduce((acc, field) => {
    acc[field] =
      Math.round(rows.reduce((s, r) => s + (Number(r[field]) || 0), 0) * 100) /
      100;
    return acc;
  }, {});

export const addSubtotalsOrderApproval = (rows) => {
  if (!rows.length) return rows;

  const result = [];
  const regionMap = {};

  rows.forEach((row) => {
    const regKey = row.regId ?? "Unknown";
    const repKey = row.psmName ?? "Unknown";
    if (!regionMap[regKey]) regionMap[regKey] = { regName: row.regName, reps: {} };
    if (!regionMap[regKey].reps[repKey]) regionMap[regKey].reps[repKey] = [];
    regionMap[regKey].reps[repKey].push(row);
  });

  Object.entries(regionMap).forEach(([regId, { regName, reps }]) => {
    result.push({ _isRegionHeader: true, regName, id: `reg-${regId}` });

    const allRegionRows = [];
    Object.entries(reps).forEach(([repName, repRows]) => {
      result.push({ _isRepHeader: true, psmName: repName, id: `rep-${regId}-${repName}` });
      repRows.forEach((r, i) =>
        result.push({ ...r, id: r.id || `row-${r.ordNo}-${regId}-${repName}-${i}` })
      );
      allRegionRows.push(...repRows);

      // ── Rep subtotal ──
      result.push({
        ...sumRows(repRows),
        _isSubtotal: true,
        _repTotal: true,
        id: `reptotal-${regId}-${repName}`,
        statusname: `Total ${repName}`,
      });
    });

    // ── Region subtotal ──
    result.push({
      ...sumRows(allRegionRows),
      _isSubtotal: true,
      _regionTotal: true,
      id: `regtotal-${regId}`,
      statusname: `Total ${regName}`,
    });
  });

  // ── Grand Total (last row in table) ──
  const flatRows = rows;
  result.push({
    ...sumRows(flatRows),
    _isSubtotal: true,
    _grandTotal: true,
    id: "grandtotal",
    statusname: "Total",
  });

  return result;
};