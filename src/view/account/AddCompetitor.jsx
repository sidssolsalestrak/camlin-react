import React, { useEffect, useState } from 'react'
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

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});

const AddCompetitor = ({ selectedBrand, compModalOpen, setCompModalOpen, onSave, cusId = 0, tempId = 0 }) => {

    const [products, setProducts] = useState([]);   // raw rows from API
    const [compMas, setCompMas] = useState([]);      // competitor master list
    const [rows, setRows] = useState([]);            // editable row state
    const [loading, setLoading] = useState(false);

    // ── Fetch when modal opens ──────────────────────────────────────────────
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
                // API may return multiple rows per product (one per competitor option)
                // so we deduplicate by pid and take first occurrence for saved quantities
                const grouped = {};
                prods.forEach((p) => {
                    if (!grouped[p.pid]) {
                        grouped[p.pid] = {
                            pid: p.pid,
                            prod_name: p.prod_name,
                            code: p.code,
                            prod_qty: p.prod_qty || "",
                            comp_id_1: p.comp_id_1 || 0,
                            comp_id_1_qty: p.comp_id_1_qty || "",
                            comp_id_2: p.comp_id_2 || 0,
                            comp_id_2_qty: p.comp_id_2_qty || "",
                            comp_id_3: p.comp_id_3 || 0,
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
    }, [compModalOpen, selectedBrand]);

    // ── Update a single cell ────────────────────────────────────────────────
    const updateRow = (pid, field, value) => {
        setRows((prev) =>
            prev.map((r) => (r.pid === pid ? { ...r, [field]: value } : r))
        );
    };

    // ── Compute row total ───────────────────────────────────────────────────
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

    // ── Grand totals ────────────────────────────────────────────────────────
    const grandTotal = (field) =>
        rows.reduce((sum, r) => sum + (parseFloat(r[field]) || 0), 0);

    const compSelect = (pid, field, value) => (
        <Select
            size="small"
            value={String(value || 0)}
            onChange={(e) => updateRow(pid, field, e.target.value)}
            sx={{ fontSize: "11px", minWidth: 110 }}
        >
            <MenuItem value="0"><em>Select</em></MenuItem>
            {compMas.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.comp_name}</MenuItem>
            ))}
        </Select>
    );

    const qtyInput = (pid, field, value) => (
        <TextField
            size="small"
            type="number"
            value={value}
            onChange={(e) => updateRow(pid, field, e.target.value)}
            inputProps={{ min: 0, style: { fontSize: "11px", width: 55, padding: "4px 6px" } }}
        />
    );

    const headerCell = (label, width) => (
        <TableCell sx={{ bgcolor: "#2196f3", color: "#fff", fontSize: "11px", fontWeight: 600, p: 0.8, width }}>
            {label}
        </TableCell>
    );

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
                                    {headerCell("Any Other Brand", "12%")}
                                    {headerCell("pcs/mth", "7%")}
                                    {headerCell("Total", "5%")}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} sx={{ textAlign: "center", color: "#999", py: 3 }}>
                                            No products found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {rows.map((row) => (
                                            <TableRow key={row.pid} sx={{ "&:hover": { bgcolor: "#f9f9f9" } }}>
                                                {/* Product name */}
                                                <TableCell sx={{ fontSize: "12px", p: 0.6 }}>
                                                    {row.prod_name}
                                                </TableCell>

                                                {/* Product qty */}
                                                <TableCell sx={{ p: 0.6 }}>
                                                    {qtyInput(row.pid, "prod_qty", row.prod_qty)}
                                                </TableCell>

                                                {/* Competitor 1 */}
                                                <TableCell sx={{ p: 0.6 }}>
                                                    {compSelect(row.pid, "comp_id_1", row.comp_id_1)}
                                                </TableCell>
                                                <TableCell sx={{ p: 0.6 }}>
                                                    {qtyInput(row.pid, "comp_id_1_qty", row.comp_id_1_qty)}
                                                </TableCell>

                                                {/* Competitor 2 */}
                                                <TableCell sx={{ p: 0.6 }}>
                                                    {compSelect(row.pid, "comp_id_2", row.comp_id_2)}
                                                </TableCell>
                                                <TableCell sx={{ p: 0.6 }}>
                                                    {qtyInput(row.pid, "comp_id_2_qty", row.comp_id_2_qty)}
                                                </TableCell>

                                                {/* Competitor 3 */}
                                                <TableCell sx={{ p: 0.6 }}>
                                                    {compSelect(row.pid, "comp_id_3", row.comp_id_3)}
                                                </TableCell>
                                                <TableCell sx={{ p: 0.6 }}>
                                                    {qtyInput(row.pid, "comp_id_3_qty", row.comp_id_3_qty)}
                                                </TableCell>

                                                {/* Other brand */}
                                                <TableCell sx={{ p: 0.6 }}>
                                                    <TextField
                                                        size="small"
                                                        value={row.other_name}
                                                        onChange={(e) => updateRow(row.pid, "other_name", e.target.value)}
                                                        inputProps={{ style: { fontSize: "11px", padding: "4px 6px" } }}
                                                        sx={{ minWidth: 100 }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ p: 0.6 }}>
                                                    {qtyInput(row.pid, "oth_qty", row.oth_qty)}
                                                </TableCell>

                                                {/* Row total */}
                                                <TableCell sx={{ fontSize: "12px", fontWeight: 600, p: 0.6, textAlign: "center" }}>
                                                    {getRowTotal(row)}
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Grand total row */}
                                        <TableRow sx={{ bgcolor: "#f0f0f0" }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6 }}>Total</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6 }}>{grandTotal("prod_qty")}</TableCell>
                                            <TableCell />
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6 }}>{grandTotal("comp_id_1_qty")}</TableCell>
                                            <TableCell />
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6 }}>{grandTotal("comp_id_2_qty")}</TableCell>
                                            <TableCell />
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6 }}>{grandTotal("comp_id_3_qty")}</TableCell>
                                            <TableCell />
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6 }}>{grandTotal("oth_qty")}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "12px", p: 0.6, textAlign: "center" }}>
                                                {rows.reduce((sum, r) => sum + getRowTotal(r), 0)}
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
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        if (onSave) onSave(rows);   // pass edited rows back to parent
                        setCompModalOpen(false);
                    }}
                >
                    Update
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddCompetitor;