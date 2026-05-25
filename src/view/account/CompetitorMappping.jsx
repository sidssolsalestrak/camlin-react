import {
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import React from 'react';

const tableHeader = [
    { id: 1, name: "Brand" },
    { id: 2, name: "Focus" },
    { id: 3, name: "Reminder" },
    { id: 4, name: "Competition" },
];

const CompetitorMappping = ({ brandData = [], setBrandData, onOpenCompModal }) => {

    const updateBrand = (subCatId, field, value) => {
        setBrandData((prev) =>
            prev.map((b) => {
                if (b.subCatId !== subCatId) return b;
                if (field === "focus")    return { ...b, focus: value, reminder: value ? 0 : b.reminder };
                if (field === "reminder") return { ...b, reminder: value, focus: value ? 0 : b.focus };
                return { ...b, [field]: value };
            })
        );
    };

    // Button is only visible when focus OR reminder is checked (matches PHP: $hideAdd)
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

                                    {/* Competition column — Add/Update button, visible only when focus or reminder is checked */}
                                    <TableCell sx={{ p: 0.6, textAlign: "center" }}>
                                        {showCompButton(brand) && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="info"
                                                startIcon={brand.compCount > 0 ? null : <AddIcon />}
                                                onClick={() => onOpenCompModal && onOpenCompModal(brand)}
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