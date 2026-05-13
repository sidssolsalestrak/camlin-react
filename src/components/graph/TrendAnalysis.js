import React, { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, CircularProgress } from '@mui/material';

const TrendAnalysis = ({ tableData, loading }) => {
    const data = (tableData || []).map(d => ({
        name: d.sale_month,
        primary: Number(d.pur_val) || 0,
        secondary: Number(d.sec_val) || 0,
        closing: Number(d.cls_val) || 0,
    }));
    // Compute max and generate ticks every 10
    const maxVal = Math.ceil(Math.max(...data.map(d => Math.max(d.primary, d.secondary, d.closing))) / 10) * 10;
    const ticks = Array.from({ length: (maxVal / 10) + 1 }, (_, i) => i * 10);

    const [hoveredBar, setHoveredBar] = useState(null);
    const [hiddenBars, setHiddenBars] = useState(new Set());
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

    return (
        <Box sx={{ width: '100%', height: 220 }}>
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 180 }}>
                    <CircularProgress enableTrackSlot size={30} />
                </Box>
            ) : (
                data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: -5 }}>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray=""
                                stroke="#e0e0e0"
                            />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} ticks={ticks} interval={0} />
                            <Tooltip />
                            <Legend
                                iconType="circle"
                                onClick={handleLegendClick}
                                onMouseEnter={handleLegendMouseEnter}
                                onMouseLeave={handleLegendMouseLeave}
                                wrapperStyle={{ cursor: 'pointer' }} />
                            <Area type="monotone" dataKey="primary" name="Primary" stackId="stack" stroke="#8B8B8B" fill="#8B8B8B" fillOpacity={0.5} strokeWidth={3.5} opacity={getOpacity('primary')} />
                            <Area type="monotone" dataKey="secondary" name="Secondary" stackId="stack" stroke="#E8824A" fill="#E8824A" fillOpacity={0.5} strokeWidth={3.5} opacity={getOpacity('secondary')} />
                            <Area type="monotone" dataKey="closing" name="Closing" stackId="stack" stroke="#1565C0" fill="#1565C0" fillOpacity={0.5} strokeWidth={3.5} opacity={getOpacity('closing')} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <Box sx={{ textAlign: "center", mt: 4 }}>No data available for the selected filters</Box>
                )
            )}
        </Box>
    );
};
export default TrendAnalysis;
