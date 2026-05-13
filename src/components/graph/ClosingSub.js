import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { Box, CircularProgress, Typography } from '@mui/material';
import dayjs from "dayjs";
import axios from "../../services/api";

const fontStyle = { color: "#026CB6", fontSize: "14px" }
const subFont = { fontSize: "12px" }


const CustomPieShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, name } = props;

    if (name === 'Received') {
        const cornerRadius = 5; // must match cornerRadius on <Pie>
        const toRad = (angle) => (angle * Math.PI) / 180;
        const midRadius = (innerRadius + outerRadius) / 2;

        // Offset angle to account for cornerRadius visual shift
        const angleOffset = Math.asin(cornerRadius / midRadius) * (180 / Math.PI);
        const adjustedEndAngle = endAngle + angleOffset;

        const endRad = toRad(adjustedEndAngle);
        const dotX = cx + midRadius * Math.cos(endRad);
        const dotY = cy - midRadius * Math.sin(endRad);
        const dotRadius = (outerRadius - innerRadius) / 2;

        return (
            <g>
                <Sector {...props} />
                <circle cx={dotX} cy={dotY} r={dotRadius} fill="#D32F2F" />
            </g>
        );
    }
    return <Sector {...props} />;
};

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

    const chartData = total > 0 ? [
        { name: 'Received', value: received, color: '#1565C0' },
        { name: 'Remaining', value: total - received, color: '#fafafa' },
    ] : [
        { name: 'Empty', value: 1, color: '#ECECEC' }
    ];
    const lastMonthEnd = dayjs(month).subtract(1, "month").endOf("month");

    const INNER_RADIUS = 55;
    const OUTER_RADIUS = 65;

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

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", mt: 0.5 }}>
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

                    {/*Outer ring shadow — behind chart */}
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: OUTER_RADIUS * 2 + 2,        // outerRadius * 2 + 2
                        height: OUTER_RADIUS * 2 + 2,
                        borderRadius: '50%',
                        boxShadow: '4px 4px 10px rgba(0, 0, 0, 0.43)',
                        zIndex: 0,
                        pointerEvents: 'none',
                    }} />

                    {/* Chart */}
                    <ResponsiveContainer width="100%" height="100%" style={{ position: 'relative', zIndex: 1 }}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={INNER_RADIUS}
                                outerRadius={OUTER_RADIUS}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                                stroke="none"
                                shape={CustomPieShape}
                                cornerRadius={6}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Inner hole shadow — in front of chart */}
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: INNER_RADIUS * 2,        // innerRadius * 2
                        height: INNER_RADIUS * 2,
                        borderRadius: '50%',
                        boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.42)',
                        zIndex: 2,
                        pointerEvents: 'none',
                    }} />

                    {/* Percentage text */}
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none',
                        zIndex: 3,
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