import { Box, CircularProgress, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import axios from "../../services/api";
import dayjs from "dayjs";

const fontStyle = { color: "#026CB6", fontSize: "14px" }
const subFont = { fontSize: "12px", fontWeight: "bold" }
const subHeader = { display: "flex", justifyContent: "space-between", p: 1 }

const PrimarySales = ({ month, formData }) => {
    const [loading, setloading] = useState(false);
    const [data, setData] = useState([]);

    let totalSales = data.reduce((sum, d) => sum + parseFloat(d.sale_val), 0).toFixed(2)

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
            const res = await axios.post("/loadGraph1", payload);
            const apiData = Array.isArray(res?.data?.data) ? res?.data?.data : [];

            // Map actual data by day for lookup
            const dataByDay = {};
            apiData.forEach(d => {
                const label = dayjs(d.sale_month).format("DD");
                dataByDay[label] = parseFloat(d.sale_val) || 0;
            });

            // Generate continuous 01 → today (or end of month if past month)
            const selectedMonth = dayjs(month);
            const isCurrentMonth = selectedMonth.isSame(dayjs(), 'month');
            const totalDays = isCurrentMonth ? dayjs().date() - 1 : selectedMonth.daysInMonth();
            const formatted = Array.from({ length: totalDays }, (_, i) => {
                const label = String(i + 1).padStart(2, '0');
                return {
                    label,
                    sale_val: dataByDay[label] || 0,
                };
            });

            setData(formatted);
        } catch (error) {
            console.error(error);
            setData([])
        } finally {
            setloading(false)
        }
    }
    useEffect(() => {
        fetchGraph4Data();
    }, [month, formData.zone, formData.region, formData.area, formData.State])

    return (
        <Box>
            <Box sx={subHeader}>
                <Typography sx={fontStyle}>Primary Sales</Typography>
                <Typography style={subFont}>Total Sales : <span style={{ fontWeight: "lighter" }}>{totalSales}</span></Typography>
            </Box>

            <Box sx={{ width: '100%', height: 230 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
                        <CircularProgress enableTrackSlot size={30} />
                    </Box>
                ) : (
                    data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{
                                top: 10,
                                right: 15,
                                left: 15,
                                bottom: -10,
                            }}>
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray=""
                                    stroke="#e0e0e0"
                                />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 8 }}   
                                    interval={0}            
                                    textAnchor="end"       
                                    height={30}             
                                />
                                <YAxis hide />
                                <Tooltip />
                                <Area type="linear" dataKey="sale_val" stroke="#8B8B8B" strokeWidth={3.5} fill="#8B8B8B" fillOpacity={0.08} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <Box sx={{ textAlign: "center", mt: 4 }}>No data available for the selected filters</Box>
                    )

                )}
            </Box>
        </Box>
    );
};

export default PrimarySales;