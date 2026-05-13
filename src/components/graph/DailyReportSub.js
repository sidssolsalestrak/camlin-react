import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';
import axios from "../../services/api";
import dayjs from "dayjs";
import { Box, CircularProgress, Typography } from '@mui/material';

const fontStyle = { color: "#026CB6", fontSize: "14px" }
const subFont = { fontSize: "12px", fontWeight: "bold" }
const subHeader = { display: "flex", justifyContent: "space-between", p: 1 }

const DailyReportSub = ({ month, zone_id, reg_id, area_id, state_id }) => {
    const [data, setData] = useState([]);
    const [loading, setloading] = useState(false);
    const [hoveredBar, setHoveredBar] = useState(null);
    const [hiddenBars, setHiddenBars] = useState(new Set());

    const totalTarget = data.reduce((sum, d) => sum + parseFloat(d.tgt_val), 0).toFixed(2);
    const totalAch = data.reduce((sum, d) => sum + parseFloat(d.ach_val), 0).toFixed(2);

    const getOpacity = (key) => {
        if (hiddenBars.has(key)) return 0;           // hidden → invisible
        if (hoveredBar && hoveredBar !== key) return 0.2; // hover dims others
        return 1;
    };

    const handleLegendClick = (entry) => {
        setHiddenBars(prev => {
            const next = new Set(prev);
            next.has(entry.dataKey) ? next.delete(entry.dataKey) : next.add(entry.dataKey);
            return next;
        });
    };

    const handleLegendMouseEnter = (entry) => {
        if (!hiddenBars.has(entry.dataKey)) setHoveredBar(entry.dataKey);
    };

    const handleLegendMouseLeave = () => {
        setHoveredBar(null);
    };

    const fetchData = async () => {
        try {
            setloading(true)
            let payload = {
                month: month ? dayjs(month).format("YYYY-MM-DD") : null,
                zone_id,
                reg_id,
                area_id,
                state_id
            }
            const res = await axios.post("/loadGraph3", payload);
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : [];
            const formatted = data.map(d => ({
                ...d,
                label: dayjs(d.call_date).format("DD MMM"), // +1 day offset for IST
                tgt_val: parseFloat(d.tgt_val),
                ach_val: parseFloat(d.ach_val),
            }));
            setData(formatted);
        } catch (error) {
            console.error(error);
            setData([])
        } finally {
            setloading(false)
        }
    }
    useEffect(() => {
        fetchData();
    }, [month, zone_id, reg_id, area_id, state_id])
    return (
        <Box>
            <Box sx={subHeader}>
                <Typography sx={fontStyle}>
                    Daily Report Submission
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                    <Typography style={subFont}>Target : <span style={{ fontWeight: "lighter" }}>{totalTarget}</span></Typography>
                    <Typography style={subFont}>Achievement : <span style={{ fontWeight: "lighter" }}>{totalAch}</span></Typography>
                </Box>
            </Box>
            <Box sx={{ width: '100%', height: 220 }}>
                {loading ? (
                    <Box sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 180,
                    }}>
                        <CircularProgress enableTrackSlot size={30} />
                    </Box>
                ) : (
                    data.length > 0 ?
                        (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    margin={{
                                        top: 5,
                                        right: 15,
                                        left: 15,
                                        bottom: -5,
                                    }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray=""
                                        stroke="#e0e0e0"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 10 }}
                                        interval={0}
                                        angle={data.length > 5 ? -45 : 0}
                                        textAnchor="end"
                                        height={45} />
                                    <YAxis tick={{ fontSize: 10 }} width="auto" axisLine={false} tickLine={false} interval={0} />
                                    <Tooltip />
                                    <Legend
                                        onClick={handleLegendClick}
                                        onMouseEnter={handleLegendMouseEnter}
                                        onMouseLeave={handleLegendMouseLeave}
                                        wrapperStyle={{ cursor: 'pointer' }}
                                    />
                                    <Bar dataKey="tgt_val" name="Target" fill="#8B8B8B" radius={[0, 0, 0, 0]} opacity={getOpacity('tgt_val')} />
                                    <Bar dataKey="ach_val" name="Achievement" fill="#E8824A" radius={[0, 0, 0, 0]} opacity={getOpacity('ach_val')} />
                                    <RechartsDevtools />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ textAlign: "center", mt: 4 }}>No data available for the selected filters</Box>
                        )
                )}
            </Box>
        </Box>
    )
}

export default DailyReportSub
