import React, { useState, useEffect } from 'react'
import Layout from '../layout'
import { useLocation } from 'react-router-dom'
import { Box, Button } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgressLoading from '../utils/CircularProgressLoading';
import { AiOutlineFileExcel } from 'react-icons/ai';
import dayjs from "dayjs";
import DataTable from '../utils/dataTable';
import axios from "../services/api";
import FormatCurrency from "../utils/formatCurrency";
import { areaWiseSubTot } from './areaWiseSubTot';
import useToast from '../utils/useToast';
import { excelWithFilters } from '../utils/ExcelWithFilters';
import { getMasterPanel } from "../services/masterPanelService";

const headContainer = {
    background: "#fff", display: "flex", flexDirection: 'column', gap: 2,
    m: 1.5, p: 1.5, borderRadius: '10px', boxShadow:
        "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
    padding: "16px 18px",
    width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
}
const renderCellStyle = { width: "100%", display: "flex", justifyContent: "flex-start" }

const AreaWiseSalesAnalysis = () => {
    const location = useLocation();
    const [progress, setProgress] = useState(null);
    const [year, setYear] = useState(dayjs());
    const [tableData, settableData] = useState([]);
    const [loading, setloading] = useState(false)
    const showAlert = useToast();
    const [showTable, setshowTable] = useState(false);

    const [masterPanel, setMasterPanel] = useState({});

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    const handleDownloadExcel = async () => {
        if (!tableData.length) {
            showAlert.warning("No Data Available To Export");
            return;
        }
        try {
            const excelColumns = columns
                .filter((col) => !col.renderCell || col.field)
                .map((col) => ({ label: col.headerName, id: col.field }));

            const monthFields = [
                "m1_sale", "m2_sale", "m3_sale", "m4_sale", "m5_sale", "m6_sale",
                "m7_sale", "m8_sale", "m9_sale", "m10_sale", "m11_sale", "m12_sale", "total"
            ];

            const excelData = tableData.map((row) => {
                if (row._isGroupHeader) return row; // only skip group headers
                const transformed = { ...row };
                monthFields.forEach((field) => {
                    if (Number(transformed[field]) === 0) {
                        transformed[field] = "-";
                    }
                });
                return transformed;
            });

            const filters = [
                { label: `${masterPanel["AREA"] || "Area"} Wise Primary Sales Review`, bold: false, sz: 11 },
            ];
            let type = 1;
            await excelWithFilters(excelData, excelColumns, `${masterPanel["AREA"] || "Area"} Wise`, filters, setProgress, type);
        } catch (err) {
            console.log(err);
            showAlert.error("failed to download");
        }
    };

    const handleLoad = async () => {
        setshowTable(true)
        try {
            setloading(true)
            let payload = {
                year: year ? dayjs(year).format("YYYY") : null
            }
            const res = await axios.post("/getMonthlyDistrictWiseData", payload);
            const data = Array.isArray(res?.data?.data)
                ? res?.data?.data?.map((row, index) => ({
                    ...row,
                    total: (Number(row.m1_sale) || 0) + (Number(row.m2_sale) || 0) + (Number(row.m3_sale) || 0) +
                        (Number(row.m4_sale) || 0) + (Number(row.m5_sale) || 0) + (Number(row.m6_sale) || 0) +
                        (Number(row.m7_sale) || 0) + (Number(row.m8_sale) || 0) + (Number(row.m9_sale) || 0) +
                        (Number(row.m10_sale) || 0) + (Number(row.m11_sale) || 0) + (Number(row.m12_sale) || 0),
                }))
                : [];
            settableData(areaWiseSubTot(data))
        } catch (error) {
            console.log(error);
            settableData([])
        } finally {
            setloading(false)
        }
    }

    const yy = year ? dayjs(year).format("YY") : "";
    const nextYY = year ? dayjs(year).add(1, "year").format("YY") : "";

    const columns = [
        { field: "area_name", headerName: masterPanel["AREA"] || "Area", filterable: true, },
        {
            field: "m1_sale", headerName: `Apr-${yy}`, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "m2_sale", headerName: `May-${yy}`, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "m3_sale", headerName: `Jun-${yy}`, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "m4_sale", headerName: `Jul-${yy}`, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "m5_sale", headerName: `Aug-${yy}`, width: 100, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return (
                    <span style={{
                        width: "100%",
                        fontWeight: 600,
                        color: "white",
                        display: "block"
                    }}>
                        {params?.value}
                    </span>
                );
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "m6_sale", headerName: `Sep-${yy}`, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "m7_sale", headerName: `Oct-${yy}`, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "m8_sale", headerName: `Nov-${yy}`, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "m9_sale", headerName: `Dec-${yy}`, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "m10_sale", headerName: `Jan-${nextYY}`, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "m11_sale", headerName: `Feb-${nextYY}`, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "m12_sale", headerName: `Mar-${nextYY}`, filterable: true,
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={renderCellStyle}>{params?.value == 0 ? "-" : FormatCurrency(params?.value)}</span>
            }
        },
        {
            field: "total", headerName: "Total", filterable: true, width: 150,
            cellSx: { padding: 0, position: "relative" },
            renderCell: (params) => {
                if (params?.row?._isGroupHeader) return null;
                return <span style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "6px",
                    backgroundColor: !params?.row?._isSubtotal ? "#f1fde7" : null,
                    width: "100%"
                }}>
                    {params?.value == 0 ? "-" : FormatCurrency(params?.value)}
                </span>
            }
        },
    ];

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Dashboard", path: location.pathname },
            { label: `${masterPanel["AREA"] || "Area"} Sales Analysis` },
        ]}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box sx={{ ml: 1.5, mt: 1.5 }}>
                    <h1 className="mainTitle">{masterPanel["AREA"] || "Area"} Sales Analysis</h1>
                </Box>
            </Box>
            <Box sx={headContainer}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="FY-Year"
                            views={["year"]}
                            value={year}
                            onChange={(newValue) => setYear(newValue)}
                            slotProps={{ textField: { size: "small", sx: { maxWidth: 150 } } }}
                        />
                    </LocalizationProvider>
                    <Button variant='contained' onClick={handleLoad}>Load</Button>
                    {progress ? <CircularProgressLoading progress={progress} /> :
                        <span onClick={handleDownloadExcel}>
                            <AiOutlineFileExcel style={{ color: "green", cursor: "pointer", height: "30px", width: "30px" }} />
                        </span>}
                </Box>
            </Box>
            {showTable && (
                <Box p={1.5} mb={8}>
                    <DataTable
                        sx={{
                            background: "#fff",
                            borderRadius: "10px",
                            boxShadow:
                                "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        }}
                        data={tableData}
                        columns={columns}
                        loading={loading}
                        grandTotal={false}
                        pagination={false}
                        showHeader={false}
                        showTableTitle={true}
                        tableTitle={`${masterPanel["AREA"] || "Area"} Wise Primary Sales Review`}
                        rowStyle={(row) => {
                            if (row._isGroupHeader) return {
                                "& td": {
                                    backgroundColor: "#f59e0b !important",
                                    color: "white !important",
                                    fontWeight: "700 !important",
                                }
                            };
                            if (row._isSubtotal) return {
                                "& td": {
                                    backgroundColor: row._grandTotal ? "#3464a7 !important" : "#dddddd !important",
                                    fontWeight: "600 !important",
                                    color: row._grandTotal ? "white" : "inherit"
                                }
                            };
                            return {};
                        }}
                    />
                </Box>
            )}
        </Layout>
    )
}

export default AreaWiseSalesAnalysis