import {
    Checkbox, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import React, { useEffect } from 'react';
import api from '../../services/api';

const tableHeader = [
    { id: 1, name: "Brand" },
    { id: 2, name: "Focus" },
    { id: 3, name: "Reminder" },
    { id: 4, name: "Competition" },
];

const CompetitorMappping = ({ brandData = [], setBrandData, onOpenCompModal, cusId = 0, tempId = 0 }) => {

    // ✅ Fetch compCount for all brands on initial load
    useEffect(() => {
        if (!brandData.length || !cusId || cusId == 0) return;

        // Only fetch for brands that have focus or reminder checked
        const brandsToFetch = brandData.filter(b => b.focus === 1 || b.reminder === 1);
        if (brandsToFetch.length === 0) return;

        const fetchAllCounts = async () => {
            const results = await Promise.all(
                brandsToFetch.map(async (brand) => {
                    try {
                        const res = await api.post("/getCompModal", {
                            subcat_id: brand.subCatId,
                            cus_id: cusId,
                            temp_id: tempId,
                        });

                        const prods = res.data.data?.products || [];
                        const grouped = {};
                        prods.forEach((p) => {
                            if (!grouped[p.pid]) grouped[p.pid] = p;
                        });

                        const count = Object.values(grouped).filter(row =>
                            Number(row.comp_id_1) > 0 ||
                            Number(row.comp_id_2) > 0 ||
                            Number(row.comp_id_3) > 0 ||
                            Number(row.prod_qty) > 0 ||
                            Number(row.oth_qty) > 0
                        ).length;

                        return { subCatId: String(brand.subCatId), count };
                    } catch (err) {
                        console.error("count fetch error for", brand.subCatId, err);
                        return { subCatId: String(brand.subCatId), count: 0 };
                    }
                })
            );

            // Update all compCounts in one setBrandData call
            setBrandData(prev => prev.map(b => {
                const found = results.find(r => r.subCatId === String(b.subCatId));
                return found ? { ...b, compCount: found.count } : b;
            }));
        };

        fetchAllCounts();
    }, [cusId, brandData.length]); // ✅ runs when cusId or brands load

    const updateBrand = (subCatId, field, value) => {
        setBrandData((prev) =>
            prev.map((b) => {
                if (String(b.subCatId) !== String(subCatId)) return b;
                if (field === "focus")    return { ...b, focus: value, reminder: value ? 0 : b.reminder };
                if (field === "reminder") return { ...b, reminder: value, focus: value ? 0 : b.focus };
                return { ...b, [field]: value };
            })
        );
    };

    const handleCompClick = async (brand) => {
        try {
            const res = await api.post("/getCompModal", {
                subcat_id: brand.subCatId,
                cus_id: cusId,
                temp_id: tempId,
            });

            const prods = res.data.data?.products || [];
            const grouped = {};
            prods.forEach((p) => {
                if (!grouped[p.pid]) grouped[p.pid] = p;
            });

            const count = Object.values(grouped).filter(row =>
                Number(row.comp_id_1) > 0 ||
                Number(row.comp_id_2) > 0 ||
                Number(row.comp_id_3) > 0 ||
                Number(row.prod_qty) > 0 ||
                Number(row.oth_qty) > 0
            ).length;

            setBrandData(prev => prev.map(b =>
                String(b.subCatId) === String(brand.subCatId)
                    ? { ...b, compCount: count }
                    : b
            ));
        } catch (err) {
            console.error("getCompModal count error", err);
        }

        if (onOpenCompModal) onOpenCompModal(brand);
    };

    const showCompButton = (brand) => brand.focus === 1 || brand.reminder === 1;

    return (
        <div>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ border: "2px solid #ccc", bgcolor: "#2196f3", p: 0.6 }}>
                            {tableHeader.map((item) => (
                                <TableCell key={item.id} sx={{
                                    color: "white", p: 0.6,
                                    borderRight: "2px solid #ccc", fontSize: "12px", fontWeight: 600
                                }}>
                                    {item.name}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {brandData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} sx={{ textAlign: "center", fontSize: "12px", color: "#999", py: 2 }}>
                                </TableCell>
                            </TableRow>
                        ) : (
                            brandData.map((brand) => (
                                <TableRow key={brand.subCatId} sx={{ borderBottom: "1px solid #eee" }}>
                                    <TableCell sx={{ p: 0.6, fontSize: "12px" }}>
                                        {brand.name}
                                    </TableCell>
                                    <TableCell sx={{ p: 0.6 }}>
                                        <Checkbox
                                            size="small"
                                            checked={brand.focus === 1}
                                            onChange={(e) => updateBrand(brand.subCatId, "focus", e.target.checked ? 1 : 0)}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ p: 0.6 }}>
                                        <Checkbox
                                            size="small"
                                            checked={brand.reminder === 1}
                                            onChange={(e) => updateBrand(brand.subCatId, "reminder", e.target.checked ? 1 : 0)}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ p: 0.6, textAlign: "center" }}>
                                        {showCompButton(brand) && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="info"
                                                startIcon={brand.compCount > 0 ? null : <AddIcon />}
                                                onClick={() => handleCompClick(brand)}
                                                sx={{ fontSize: "11px", py: 0.3, px: 1, minWidth: "70px" }}
                                            >
                                                {brand.compCount > 0 ? `${brand.compCount} Nos` : "Add"}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default CompetitorMappping;