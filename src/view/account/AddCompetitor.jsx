import React, { useEffect, useState, useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import {
    Slide, Table, TableHead, TableBody, TableRow,
    TableCell, TableContainer, TextField, Select,
    MenuItem, Box, CircularProgress
} from '@mui/material'
import api from '../../services/api'
import useToast from '../../utils/useToast'

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});

const AddCompetitor = ({ selectedBrand, compModalOpen, setCompModalOpen, onSave, cusId = 0, tempId = 0 }) => {

    const [products, setProducts] = useState([]);
    const [compMas, setCompMas] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // Fetch when modal opens
    useEffect(() => {
        if (!compModalOpen || !selectedBrand?.subCatId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.post("/getCompModal", {
                    subcat_id: selectedBrand.subCatId,
                    cus_id: cusId,
                    temp_id: tempId,
                });

                const { products: prods = [], comp_mas: comps = [] } = res.data.data;
                setProducts(prods);
                setCompMas(comps);

                // Group rows by pid (one row per product)
                const grouped = {};
                prods.forEach((p) => {
                    if (!grouped[p.pid]) {
                        grouped[p.pid] = {
                            pid: p.pid,
                            prod_name: p.prod_name,
                            code: p.code,
                            prod_qty: p.prod_qty || "",
                            comp_id_1: p.comp_id_1 ? String(p.comp_id_1) : "0",   // ← force string
                            comp_id_1_qty: p.comp_id_1_qty || "",
                            comp_id_2: p.comp_id_2 ? String(p.comp_id_2) : "0",   // ← force string
                            comp_id_2_qty: p.comp_id_2_qty || "",
                            comp_id_3: p.comp_id_3 ? String(p.comp_id_3) : "0",   // ← force string
                            comp_id_3_qty: p.comp_id_3_qty || "",
                            other_name: p.other_name || "",
                            oth_qty: p.oth_qty || "",
                        };
                    }
                });

                setRows(Object.values(grouped));
            } catch (err) {
                console.error("getCompModal error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [compModalOpen, selectedBrand, cusId, tempId]);

    // Update a single cell
    const updateRow = useCallback((pid, field, value) => {
        setRows((prev) =>
            prev.map((r) => {
                if (r.pid !== pid) return r;

                const normalizedValue = (field === 'comp_id_1' || field === 'comp_id_2' || field === 'comp_id_3')
                    ? String(value)   // ← always store as string
                    : value;

                const updatedRow = { ...r, [field]: normalizedValue };

                if (field === 'comp_id_1' || field === 'comp_id_2' || field === 'comp_id_3') {
                    const qtyField = field.replace('id', 'id_qty');
                    if (normalizedValue === "0") {
                        updatedRow[qtyField] = "";
                    }
                }

                return updatedRow;
            })
        );
    }, []);
    // Check if competitor is disabled in a specific select
    const isCompetitorDisabled = (row, compId, currentField) => {
        if (compId === "0" || compId === 0) return false;
        const compIdStr = String(compId);
        if (currentField !== 'comp_id_1' && String(row.comp_id_1) === compIdStr) return true;
        if (currentField !== 'comp_id_2' && String(row.comp_id_2) === compIdStr) return true;
        if (currentField !== 'comp_id_3' && String(row.comp_id_3) === compIdStr) return true;
        return false;
    };

    // Get available competitors for a specific select
    const getAvailableCompetitors = (row, currentField) => {
        return compMas.map(c => ({
            ...c,
            disabled: isCompetitorDisabled(row, c.id, currentField)
        }));
    };

    // Check if quantity field should be disabled
    const isQtyDisabled = (row, field) => {
        const compField = field.replace('_qty', '');

        if (field === 'oth_qty') {   // ← fix: check field, not compField
            return !row.other_name || row.other_name.trim() === '';
        }

        const compValue = row[compField];
        return !compValue || compValue === "0" || compValue === 0 || compValue === "";
    };

    // Compute row total
    const getRowTotal = (row) => {
        const vals = [
            row.prod_qty,
            row.comp_id_1_qty,
            row.comp_id_2_qty,
            row.comp_id_3_qty,
            row.oth_qty,
        ];
        return vals.reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    };

    // Grand totals
    const grandTotal = (field) =>
        rows.reduce((sum, r) => sum + (parseFloat(r[field]) || 0), 0);

    // Handle other brand name change
    const handleOtherNameChange = (pid, value) => {
        setRows((prev) =>
            prev.map((r) => {
                if (r.pid !== pid) return r;
                return {
                    ...r,
                    other_name: value,
                    oth_qty: value.trim() === '' ? '' : r.oth_qty
                };
            })
        );
    };

    // Competitor Select component
    const compSelect = (pid, field, value) => {
        const row = rows.find(r => r.pid === pid);
        if (!row) return null;

        const availableComps = getAvailableCompetitors(row, field);

        return (
            <Select
                size="small"
                value={String(value || "0")}
                onChange={(e) => updateRow(pid, field, e.target.value)}
                sx={{ fontSize: "11px", minWidth: 110 }}
            >
                <MenuItem value="0"><em>Select Competitor</em></MenuItem>
                {availableComps.map((c) => (
                    <MenuItem
                        key={c.id}
                        value={String(c.id)}
                        disabled={c.disabled}
                        sx={c.disabled ? { color: '#ccc', fontStyle: 'italic' } : {}}
                    >
                        {c.comp_name}
                    </MenuItem>
                ))}
            </Select>
        );
    };

    // Quantity input
    const qtyInput = (pid, field, value) => {
        const row = rows.find(r => r.pid === pid);
        if (!row) return null;

        const disabled = isQtyDisabled(row, field);

        return (
            <TextField
                size="small"
                type="number"
                value={value}
                disabled={disabled}
                onChange={(e) => updateRow(pid, field, e.target.value)}
                onCopy={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                inputProps={{
                    min: 0,
                    style: {
                        fontSize: "11px",
                        width: 55,
                        padding: "4px 6px",
                        textAlign: "center"
                    }
                }}
                sx={{
                    '& .MuiInputBase-root': {
                        backgroundColor: disabled ? '#f5f5f5' : 'white'
                    }
                }}
            />
        );
    };

    // ✅ Clean handleSave — no duplicate block
    const handleSave = () => {
    // Validate competitor qty
    for (const row of rows) {
        if (String(row.comp_id_1) !== "0" && (!row.comp_id_1_qty || row.comp_id_1_qty === "")) {
            toast.error('Please Enter Qty for Competitor 1');
            return;
        }
        if (String(row.comp_id_2) !== "0" && (!row.comp_id_2_qty || row.comp_id_2_qty === "")) {
            toast.error('Please Enter Qty for Competitor 2');
            return;
        }
        if (String(row.comp_id_3) !== "0" && (!row.comp_id_3_qty || row.comp_id_3_qty === "")) {
            toast.error('Please Enter Qty for Competitor 3');
            return;
        }
        if (row.other_name && row.other_name.trim() !== '' && (!row.oth_qty || row.oth_qty === "")) {
            toast.error('Please Enter Qty for Others');
            return;
        }
    }

    // ✅ ONLY include rows that have actual data
    const rowsWithData = rows.filter(row => {
        return (
            Number(row.prod_qty) > 0 ||
            Number(row.comp_id_1) > 0 ||
            Number(row.comp_id_2) > 0 ||
            Number(row.comp_id_3) > 0 ||
            Number(row.oth_qty) > 0 ||
            (row.other_name && row.other_name.trim() !== '')
        );
    });

    const grandTotalSum = rowsWithData.reduce((sum, r) => sum + getRowTotal(r), 0);

    if (grandTotalSum === 0 && rowsWithData.length === 0) {
        toast.error('Total Qty Must be more than 0 to Proceed!!');
        return;
    }

    const saveData = {
        subcat_id: selectedBrand?.subCatId,
        rows: rowsWithData.map(row => ({
            pid: row.pid,
            prod_qty: row.prod_qty || 0,
            comp_id_1: row.comp_id_1 || "0",
            comp_id_1_qty: row.comp_id_1_qty || 0,
            comp_id_2: row.comp_id_2 || "0",
            comp_id_2_qty: row.comp_id_2_qty || 0,
            comp_id_3: row.comp_id_3 || "0",
            comp_id_3_qty: row.comp_id_3_qty || 0,
            other_name: row.other_name || "",
            oth_qty: row.oth_qty || 0,
            total: getRowTotal(row)
        })),
        totals: {
            prod_qty: rowsWithData.reduce((sum, r) => sum + (parseFloat(r.prod_qty) || 0), 0),
            comp_id_1_qty: rowsWithData.reduce((sum, r) => sum + (parseFloat(r.comp_id_1_qty) || 0), 0),
            comp_id_2_qty: rowsWithData.reduce((sum, r) => sum + (parseFloat(r.comp_id_2_qty) || 0), 0),
            comp_id_3_qty: rowsWithData.reduce((sum, r) => sum + (parseFloat(r.comp_id_3_qty) || 0), 0),
            oth_qty: rowsWithData.reduce((sum, r) => sum + (parseFloat(r.oth_qty) || 0), 0),
            grand_total: grandTotalSum
        }
    };

    if (onSave) onSave(saveData);
    setCompModalOpen(false);
    };
    const headerCell = (label, width) => (
        <TableCell sx={{ bgcolor: "#2196f3", color: "#fff", fontSize: "11px", fontWeight: 600, p: 0.8, width }}>
            {label}
        </TableCell>
    );

    const grandTotalSum = rows.reduce((sum, r) => sum + getRowTotal(r), 0);

    return (
        <Dialog
            open={!!compModalOpen}
            onClose={() => setCompModalOpen(false)}
            slots={{ transition: Transition }}
            keepMounted
            maxWidth="xl"
            fullWidth
            sx={{ "& .MuiDialog-container": { alignItems: "flex-start", marginTop: "20px" } }}
        >
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1 }}>
                <Typography variant="h6" sx={{ fontSize: "15px" }}>
                    POTENTIAL (Pcs/month) — {selectedBrand?.name || ""}
                </Typography>
                <IconButton onClick={() => setCompModalOpen(false)} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 1 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small" sx={{ minWidth: 900 }}>
                            <TableHead>
                                <TableRow>
                                    {headerCell("Product", "12%")}
                                    {headerCell("Product pcs/mth", "7%")}
                                    {headerCell("Competitor 1", "13%")}
                                    {headerCell("pcs/mth", "7%")}
                                    {headerCell("Competitor 2", "13%")}
                                    {headerCell("pcs/mth", "7%")}
                                    {headerCell("Competitor 3", "13%")}
                                    {headerCell("pcs/mth", "7%")}
                                    {headerCell("Any Other Brand", "10%")}
                                    {headerCell("pcs/mth", "7%")}
                                    {headerCell("Total", "5%")}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} sx={{ textAlign: "center", color: "#999", py: 3 }}>
                                            No Competitor List Available
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {rows.map((row) => (
                                            <TableRow key={row.pid} sx={{ "&:hover": { bgcolor: "#f9f9f9" } }}>
                                                <TableCell sx={{ fontSize: "12px", p: 0.6 }}>
                                                    {row.code}-{row.prod_name}
                                                </TableCell>
                                                <TableCell sx={{ p: 0.6 }}>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        value={row.prod_qty}
                                                        onChange={(e) => updateRow(row.pid, "prod_qty", e.target.value)}
                                                        inputProps={{
                                                            min: 0,
                                                            style: { fontSize: "11px", width: 55, padding: "4px 6px", textAlign: "center" }
                                                        }}
                                                        className="numbersonly"
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ p: 0.6 }}>{compSelect(row.pid, "comp_id_1", row.comp_id_1)}</TableCell>
                                                <TableCell sx={{ p: 0.6 }}>{qtyInput(row.pid, "comp_id_1_qty", row.comp_id_1_qty)}</TableCell>
                                                <TableCell sx={{ p: 0.6 }}>{compSelect(row.pid, "comp_id_2", row.comp_id_2)}</TableCell>
                                                <TableCell sx={{ p: 0.6 }}>{qtyInput(row.pid, "comp_id_2_qty", row.comp_id_2_qty)}</TableCell>
                                                <TableCell sx={{ p: 0.6 }}>{compSelect(row.pid, "comp_id_3", row.comp_id_3)}</TableCell>
                                                <TableCell sx={{ p: 0.6 }}>{qtyInput(row.pid, "comp_id_3_qty", row.comp_id_3_qty)}</TableCell>
                                                <TableCell sx={{ p: 0.6 }}>
                                                    <TextField
                                                        size="small"
                                                        value={row.other_name}
                                                        onChange={(e) => handleOtherNameChange(row.pid, e.target.value)}
                                                        inputProps={{ style: { fontSize: "11px", padding: "4px 6px" } }}
                                                        sx={{ minWidth: 100, height: "40px" }}
                                                        multiline
                                                        rows={1}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ p: 0.6 }}>{qtyInput(row.pid, "oth_qty", row.oth_qty)}</TableCell>
                                                <TableCell sx={{ fontSize: "12px", fontWeight: 600, p: 0.6, textAlign: "center" }}>
                                                    {getRowTotal(row) || 0}
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Grand total row */}
                                        <TableRow sx={{ bgcolor: "#dcdcdc" }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6 }}>TOTAL RANGE</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6, textAlign: "center" }}>{grandTotal("prod_qty") || 0}</TableCell>
                                            <TableCell />
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6, textAlign: "center" }}>{grandTotal("comp_id_1_qty") || 0}</TableCell>
                                            <TableCell />
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6, textAlign: "center" }}>{grandTotal("comp_id_2_qty") || 0}</TableCell>
                                            <TableCell />
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6, textAlign: "center" }}>{grandTotal("comp_id_3_qty") || 0}</TableCell>
                                            <TableCell />
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6, textAlign: "center" }}>{grandTotal("oth_qty") || 0}</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 700, fontSize: "12px", p: 0.6, textAlign: "center",
                                                color: grandTotalSum === 0 ? 'red' : 'inherit'
                                            }}>
                                                {grandTotalSum || 0}
                                            </TableCell>
                                        </TableRow>
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>

            <DialogActions>
                <Button variant="contained" color="error" onClick={() => setCompModalOpen(false)}>
                    Close
                </Button>
                <Button variant="contained" color="primary" onClick={handleSave}>
                    Update
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddCompetitor;