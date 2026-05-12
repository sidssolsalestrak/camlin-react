import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
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

    const totalTarget = data.reduce((sum, d) => sum + parseFloat(d.tgt_val), 0).toFixed(2);
    const totalAch = data.reduce((sum, d) => sum + parseFloat(d.ach_val), 0).toFixed(2);

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
                label: dayjs(d.call_date).add(1, 'day').format("DD MMM"), // +1 day offset for IST
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
                    <Typography style={subFont}>Target : {totalTarget}</Typography>
                    <Typography style={subFont}>Achievement : {totalAch}</Typography>
                </Box>
            </Box>
            <Box sx={{ width: '100%', height: 200 }}>
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
                            <BarChart
                                style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
                                responsive
                                data={data}
                                margin={{
                                    top: 5,
                                    right: 15,
                                    left: 5,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray=""
                                    stroke="#e0e0e0"
                                />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} width="auto" axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="tgt_val" name="Target" fill="#8B8B8B" radius={[5, 5, 0, 0]} />
                                <Bar dataKey="ach_val" name="Achievement" fill="#E8824A" radius={[5, 5, 0, 0]} />
                                <RechartsDevtools />
                            </BarChart>
                        ) : (
                            <Box sx={{ textAlign: "center", mt: 4 }}>No data available for the selected filters</Box>
                        )
                )}
            </Box>
        </Box>
    )
}

export default DailyReportSub
