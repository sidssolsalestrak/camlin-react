import { useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";

const NoDot = () => null;

function CustomTooltip({ active, payload, label, activeKey }) {
    if (!active || !payload?.length || !activeKey) return null;

    const entry = payload.find((p) => p.dataKey === activeKey);
    if (!entry || entry.value == null) return null;

    return (
        <div style={{ position: "relative", display: "inline-block", }}>
            {/* Tooltip Box */}
            <div
                style={{
                    background: "white",
                    borderRadius: 4,
                    padding: "6px 10px",
                    fontSize: 12,
                    color: "black",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    lineHeight: 1.5,
                    
                }}
            >
                <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 2 }}>
                    Day {label}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {entry.name}: {entry.value.toLocaleString("en-US")}
                </div>
            </div>

            {/* MUI-style bottom arrow */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: `6px solid ${entry.stroke}`,
                }}
            />
        </div>
    );
}

export default function DayWiseSalesChart({
    data,
    selectedMonth = "2024-03-01",
    title = "Day wise Cum. Sales Qty pcs",
    height = 400,
}) {
    const [activeKey, setActiveKey] = useState(null);

    const cmLabel = "CM";
    const lmLabel = "LM";
    const lyLabel = "LY";

    const tooltipLabels = { cm_qty: cmLabel, lm_qty: lmLabel, lym_qty: lyLabel };

    const todayDay = useMemo(() => {
        const now = new Date();
        const sel = new Date(selectedMonth);
        if (
            now.getFullYear() === sel.getFullYear() &&
            now.getMonth() === sel.getMonth()
        ) {
            return now.getDate();
        }
        return null;
    }, [selectedMonth]);

    return (
        <div style={{ fontFamily: "var(--font-sans)", padding: "16px 0" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                    }}
                >
                    {title}
                </h2>
            </div>

            <ResponsiveContainer width="100%" height={height}>
                <LineChart
                    data={data}
                    margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
                    onMouseLeave={() => setActiveKey(null)}
                >
                    <CartesianGrid
                        stroke="#e0e0e0"
                        strokeWidth={1}
                        vertical={false}
                        horizontal={true}
                    />
                    <XAxis
                        dataKey="sale_day"
                        padding={{ left: 25, right: 25 }}
                        tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                        label={{
                            value: "Day",
                            position: "insideBottomRight",
                            offset: -8,
                            fontSize: 12,
                            fill: "var(--color-text-secondary)",
                        }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        type="number"
                        tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                        width={90}
                        tickFormatter={(value) => value.toLocaleString("en-US")}
                        allowDataOverflow={true}
                    />
                    <Tooltip
                        content={<CustomTooltip activeKey={activeKey} />}
                        cursor={false}
                        isAnimationActive={false}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
                        formatter={(value) => tooltipLabels[value] ?? value}
                    />

                    {todayDay && (
                        <ReferenceLine
                            x={todayDay}
                            stroke="var(--color-text-tertiary)"
                            strokeDasharray="4 4"
                            label={{
                                value: "Today",
                                position: "top",
                                fontSize: 11,
                                fill: "var(--color-text-tertiary)",
                            }}
                        />
                    )}

                    <Line
                        type="monotone"
                        dataKey="cm_qty"
                        name={cmLabel}
                        stroke="#0000ff"
                        strokeWidth={2}
                        dot={<NoDot />}
                        activeDot={false}
                        connectNulls={false}
                        onMouseEnter={() => setActiveKey("cm_qty")}
                    />

                    <Line
                        type="monotone"
                        dataKey="lm_qty"
                        name={lmLabel}
                        stroke="#f1ca3a"
                        strokeWidth={2}
                        strokeDasharray="7 7"
                        dot={<NoDot />}
                        activeDot={false}
                        onMouseEnter={() => setActiveKey("lm_qty")}
                    />

                    <Line
                        type="monotone"
                        dataKey="lym_qty"
                        name={lyLabel}
                        stroke="#6f9654"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={<NoDot />}
                        activeDot={false}
                        onMouseEnter={() => setActiveKey("lym_qty")}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}