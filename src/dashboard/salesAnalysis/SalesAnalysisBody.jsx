import { Box, Grid } from '@mui/material'
import React, { useEffect, useState } from 'react'
import DataTable from "../../utils/dataTable";
import DailyReportSub from '../../components/graph/DailyReportSub';
import dayjs from "dayjs";
import axios from "../../services/api";
import TrendAnalysis from '../../components/graph/TrendAnalysis';
import ClosingSub from '../../components/graph/ClosingSub';
import PrimarySales from '../../components/graph/PrimarySales';

const headContainer = {
    display: "flex", flexDirection: 'column', gap: 1,
    m: 1.5, width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' },
}

const subContainer = {
    background: "#fff", display: "flex", flexDirection: 'column', gap: 1, borderRadius: '10px', boxShadow:
        "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
    width: { lg: '100%', md: '100%', sm: '100%', xs: '100%' }, minHeight: 310,
}

const subHeader = { display: "flex", justifyContent: "space-between", p: 1 }
const fontStyle = { color: "#026CB6", fontSize: "14px" }
const subFont = { fontSize: "12px", fontWeight: "bold" }

const SalesAnalysisBody = ({ formData, month }) => {
    const [tableData, setTableData] = useState([])
    const [loading, setloading] = useState(false);

    const primary = tableData.reduce((sum, d) => sum + parseFloat(d.pur_val), 0).toFixed(2);
    const secondary = tableData.reduce((sum, d) => sum + parseFloat(d.sec_val), 0).toFixed(2);
    const closing = tableData.reduce((sum, d) => sum + parseFloat(d.cls_val), 0).toFixed(2);

    const fetchGraph4Data = async () => {
        try {
            setloading(true)
            let payload = {
                month: month ? dayjs(month).format("YYYY-MM-DD") : null,
                zone_id: formData.zone,
                reg_id: formData.region,
                area_id: formData.area,
                state_id: formData.State
            }
            const res = await axios.post("/loadGraph4", payload);
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : [];
            setTableData(data)
        } catch (error) {
            console.error(error);
            setTableData([])
        } finally {
            setloading(false)
        }
    }
    useEffect(() => {
        fetchGraph4Data();
    }, [month, formData.zone, formData.region, formData.area, formData.State])

    const zeroToNull = (val) =>
        Number(val) === 0 || val === null || val === undefined ? "-" : val;

    const columns = [
        {
            field: "sale_month",
            headerName: "Month",
        },
        {
            field: "pur_val",
            headerName: "Primary",
            showTotal: true,
            type: "number",
            renderCell: (params) => {
                const row = params?.row ?? params;
                return zeroToNull(row.pur_val);
            },
        },
        {
            field: "sec_val",
            headerName: "Secondary",
            showTotal: true,
            type: "number",
            renderCell: (params) => {
                const row = params?.row ?? params;
                return zeroToNull(row.sec_val);
            },
        },
        {
            field: "cls_val",
            headerName: "Closing",
            showTotal: true,
            type: "number",
            renderCell: (params) => {
                const row = params?.row ?? params;
                return zeroToNull(row.cls_val);
            },
        }
    ]
    return (
        <Box sx={headContainer}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 12, md: 4.7, lg: 4.7 }}>
                    <Box sx={subContainer}>
                        <Box>
                            <PrimarySales month={month} formData={formData} />
                        </Box>
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 12, md: 2.6, lg: 2.6 }}>
                    <Box sx={subContainer}>
                        <Box>
                            <ClosingSub
                                month={month || dayjs()}
                                zone_id={formData.zone || 0}
                                reg_id={formData.region || 0}
                                area_id={formData.area || 0}
                                state_id={formData.State || 0} />
                        </Box>
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 12, md: 4.7, lg: 4.7 }}>
                    <Box sx={subContainer}>
                        <Box>
                            <DailyReportSub
                                month={month || dayjs()}
                                zone_id={formData.zone || 0}
                                reg_id={formData.region || 0}
                                area_id={formData.area || 0}
                                state_id={formData.State || 0} />
                        </Box>
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                    <Box sx={subContainer}>
                        <Box sx={subHeader}>
                            <span style={fontStyle}>Trend Analysis</span>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <span style={subFont}>Primary : <span style={{ fontWeight: "lighter" }}>{primary}</span></span>
                                <span style={subFont}>Secondary : <span style={{ fontWeight: "lighter" }}>{secondary}</span></span>
                                <span style={subFont}>Closing : <span style={{ fontWeight: "lighter" }}>{closing}</span></span>
                            </Box>
                        </Box>
                        <Box sx={{ p: 2 }}>
                            <TrendAnalysis tableData={tableData} loading={loading} />
                        </Box>
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                    <Box sx={subContainer}>
                        <Box p={1}>
                            <DataTable loading={loading} data={tableData} columns={columns} pagination={false} showHeader={false} />
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
}

export default SalesAnalysisBody