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
        <div style={{ position: "relative", display: "inline-block" }}>
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
                    border: "1px solid #e0e0e0",
                    marginBottom: 8,
                }}
            >
                <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 2 }}>
                    Day {label}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {entry.name}: {entry.value.toLocaleString("en-US")}
                </div>
            </div>

            {/* Bottom arrow — border (outline) */}
            <div
                style={{
                    position: "absolute",
                    bottom: 1,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "7px solid transparent",
                    borderRight: "7px solid transparent",
                    borderTop: "8px solid #e0e0e0",
                }}
            />
            {/* Bottom arrow — white fill */}
            <div
                style={{
                    position: "absolute",
                    bottom: 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: "7px solid white",
                }}
            />
        </div>
    );
}

const LINE_COLORS = {
    cm_qty: "#0000ff",
    lm_qty: "#f1ca3a",
    lym_qty: "#6f9654",
};

export default function DayWiseSalesChart({
    data,
    selectedMonth = "2024-03-01",
    title = "Day wise Cum. Sales Qty pcs",
    height = 400,
}) {
    const [activeKey, setActiveKey] = useState(null);
    const [thickKeys, setThickKeys] = useState(new Set());
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [tooltipActive, setTooltipActive] = useState(false);

    const cmLabel = "CM";
    const lmLabel = "LM";
    const lyLabel = "LY";

    const tooltipLabels = { cm_qty: cmLabel, lm_qty: lmLabel, lym_qty: lyLabel };
    console.log("graph data ",data)

    const handleLegendClick = (e) => {
        const dataKey = e.dataKey;
        setThickKeys((prev) => {
            const next = new Set(prev);
            if (next.has(dataKey)) {
                next.delete(dataKey);
            } else {
                next.add(dataKey);
            }
            return next;
        });
    };

    const strokeWidth = (key) => (thickKeys.has(key) ? 4 : 2);

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

    // Capture mouse position from chart for tooltip centering
    const handleMouseMove = (e) => {
        if (e && e.activeCoordinate) {
            setTooltipPos({
                x: e.activeCoordinate.x - 60,
                y: e.activeCoordinate.y - 90,
            });
            setTooltipActive(true);
        }
    };

    const handleMouseLeave = () => {
        setActiveKey(null);
        setTooltipActive(false);
    };

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
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
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
                        domain={["auto", "auto"]}
                        tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                        width={90}
                        tickFormatter={(value) => value.toLocaleString("en-US")}
                    />
                    <Tooltip
                        content={<CustomTooltip activeKey={activeKey} />}
                        cursor={false}
                        active={tooltipActive}
                        position={{ x: tooltipPos.x, y: tooltipPos.y }}
                        isAnimationActive={false}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 13, paddingTop: 8, cursor: "pointer" }}
                        formatter={(value) => tooltipLabels[value] ?? value}
                        onClick={handleLegendClick}
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
                        stroke={LINE_COLORS.cm_qty}
                        strokeWidth={strokeWidth("cm_qty")}
                        dot={<NoDot />}
                        connectNulls={false}
                        activeDot={
                            activeKey === "cm_qty"
                                ? { r: 5, fill: LINE_COLORS.cm_qty, stroke: "#fff", strokeWidth: 2 }
                                : false
                        }
                        onMouseEnter={() => setActiveKey("cm_qty")}
                    />

                    <Line
                        type="monotone"
                        dataKey="lm_qty"
                        name={lmLabel}
                        stroke={LINE_COLORS.lm_qty}
                        strokeWidth={strokeWidth("lm_qty")}
                        strokeDasharray="7 7"
                        dot={<NoDot />}
                        connectNulls={false}
                        activeDot={
                            activeKey === "lm_qty"
                                ? { r: 5, fill: LINE_COLORS.lm_qty, stroke: "#fff", strokeWidth: 2 }
                                : false
                        }
                        onMouseEnter={() => setActiveKey("lm_qty")}
                    />

                    <Line
                        type="monotone"
                        dataKey="lym_qty"
                        name={lyLabel}
                        stroke={LINE_COLORS.lym_qty}
                        strokeWidth={strokeWidth("lym_qty")}
                        strokeDasharray="4 4"
                        dot={<NoDot />}
                        connectNulls={false}
                        activeDot={
                            activeKey === "lym_qty"
                                ? { r: 5, fill: LINE_COLORS.lym_qty, stroke: "#fff", strokeWidth: 2 }
                                : false
                        }
                        onMouseEnter={() => setActiveKey("lym_qty")}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}