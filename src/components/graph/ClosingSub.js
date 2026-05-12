import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, CircularProgress, Typography } from '@mui/material';
import dayjs from "dayjs";
import axios from "../../services/api";

const fontStyle = { color: "#026CB6", fontSize: "14px" }
const subFont = { fontSize: "12px", fontWeight: "bold" }

const ClosingSub = ({ month, zone_id, reg_id, area_id, state_id }) => {
    const [summary, setSummary] = useState({ total: 0, received: 0, rateScore: 0 });
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const payload = {
                month: month ? dayjs(month).format("YYYY-MM-DD") : null,
                zone_id,
                reg_id,
                area_id,
                state_id
            };
            const res = await axios.post("/loadGraph2", payload);
            const result = Array.isArray(res?.data?.data) ? res.data.data[0] : null;

            const totStk = Number(result.tot_stk) || 0;
            const totRecv = Number(result.tot_recv) || 0;
            const rawScore = Number(result.rate_score) || 0;

            setSummary({
                total: totStk,
                received: totRecv,
                rateScore: totRecv > 0 ? Math.round(rawScore / totRecv) : 0,
            });
        } catch (error) {
            console.error(error);
            setSummary({
                total: 0, received: 0, rateScore: 0
            })
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, zone_id, reg_id, area_id, state_id]); //re-fetch when filters change

    const { total, received, rateScore } = summary;
    const percentage = total > 0 ? Math.round((received / total) * 100) : 0;
    const remaining = total - received;
    const notReceived = total > 0 ? total * 0.01 : 0;

    const chartData = total > 0 ? [
        { name: 'Received', value: received, color: '#1565C0' },
        { name: 'Not Received', value: notReceived, color: '#b71c1c' },
        { name: 'Remaining', value: total - received - notReceived, color: '#ECECEC' },
    ] : [
        { name: 'Empty', value: 1, color: '#ECECEC' }
    ];
    const lastMonthEnd = dayjs(month).subtract(1, "month").endOf("month");

    return (
        <Box sx={{
            background: '#fff',
            borderRadius: '12px',
            p: 1,
            width: '100%',
        }}>
            <Typography sx={fontStyle}>
                Closing Submission - {lastMonthEnd.format("MMM YYYY")}
            </Typography>

            <Box sx={{ mb: 1 }}>
                <Typography sx={subFont}><b>Total:</b> {total}</Typography>
                <Typography sx={subFont}><b>Received :</b> {received}</Typography>
                <Typography sx={subFont}><b>Rate Score :</b> {rateScore}%</Typography>
            </Box>

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
                <Box sx={{ width: '100%', height: 200, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                                stroke="none"
                                labelLine={false}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        style={{}}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none',
                    }}>
                        <Typography sx={{ fontSize: '26px', fontWeight: 'bold', color: '#9e9e9e' }}>
                            {percentage}%
                        </Typography>
                    </Box>
                </Box>
            )}
            {!loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: -1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#1565C0' }} />
                    <Typography sx={{ fontSize: '13px' }}>Received</Typography>
                </Box>
            )}
        </Box>
    );
};

export default ClosingSub;