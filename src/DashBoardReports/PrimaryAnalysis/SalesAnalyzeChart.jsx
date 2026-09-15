import {
    ComposedChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Box, Typography } from "@mui/material";
import { useState } from "react";


const truncateLabel = (label, maxLength = 15) => {
    if (!label) return "";
    if (!Number.isFinite(maxLength)) return label; // no truncation
    return label.length > maxLength ? `${label.substring(0, maxLength)}...` : label;
};

// Fewer categories → less crowding → labels can sit straight (horizontal)
// instead of angled, which reads more naturally.
const getXAxisLabelRotation = (labelCount) => labelCount <= 6;

// Fewer categories → more horizontal room per label → show it in full.
// Many categories → keep truncating so labels don't overlap.
const getXAxisLabelMaxLength = (labelCount) => {
    if (labelCount <= 4) return Infinity; // show full label
    return 15;
};

const getXAxisInterval = (labelCount) => {
    const maxVisibleLabels = 22;
    if (labelCount <= maxVisibleLabels) return 0;
    return Math.ceil(labelCount / maxVisibleLabels) - 1;
};


const getDynamicBarSize = (labelCount) => {
    if (labelCount <= 1) return 60;   
    if (labelCount <= 3) return 40;
    if (labelCount <= 6) return 28;
    return 18;                        
};

const CustomXAxisTick = ({ x, y, payload, maxLength = 15, straight = false }) => {
    const fullText = payload.value;
    const displayText = truncateLabel(fullText, maxLength);

    if (straight) {
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor="middle"
                    fill="#706E69"
                    fontSize={12}
                >
                    <title>{fullText}</title>
                    {displayText}
                </text>
            </g>
        );
    }

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={8}
                textAnchor="end"
                fill="#706E69"
                fontSize={12}
                transform="rotate(-35)"
            >
                <title>{fullText}</title>
                {displayText}
            </text>
        </g>
    );
};

const CustomTooltip = ({ active, payload, label, activeBarKey }) => {
    if (!active || !payload || !payload.length || !activeBarKey) return null;

    const hoveredEntry = payload.find((p) => p.dataKey === activeBarKey);
    if (!hoveredEntry) return null;

    const isGrowth = hoveredEntry.dataKey === "Growth";
    const displayValue = isGrowth
        ? `${Number(hoveredEntry.value).toFixed(2)}%`
        : Number(hoveredEntry.value).toLocaleString("en-IN");

    return (
        <Box
            sx={{
                position: "relative",
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
                padding: "8px 12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                width: "max-content",
                mb: "10px",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    bottom: "-8px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "7px solid transparent",
                    borderRight: "7px solid transparent",
                    borderTop: "8px solid #e0e0e0",
                },
                "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: "-6px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: "7px solid #fff",
                },
            }}
        >
            <Typography sx={{ fontSize: 11, color: "#706E69", mb: 0.5 }}>{label}</Typography>
            <Box display="flex" alignItems="center">
                <Typography>
                    {hoveredEntry.name}:{" "}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#4a4e55" }}>
                        {displayValue}
                    </span>
                </Typography>
            </Box>
        </Box>
    );
};

const HoverBar = (props) => {
    const { x, y, width, height, fill, index, barKey, activeBarKey, activeBarIndex } = props;
    const isActive = activeBarKey === barKey && activeBarIndex === index;
    const expandBy = 4;
    const barWidth = isActive ? width + expandBy : width;
    const barX = isActive ? x - expandBy / 2 : x;

    return (
        <rect
            x={barX}
            y={y}
            width={barWidth}
            height={height}
            fill={fill}
            style={{ transition: "width 0.15s ease, x 0.15s ease" }}
        />
    );
};

const SalesChart = ({ data, title, height = 320, fyLabel1, fyLabel2, fyLabel3 }) => {
    const [activeBarKey, setActiveBarKey] = useState(null);
    const [activeBarIndex, setActiveBarIndex] = useState(null);
    const [tooltipActive, setTooltipActive] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const barSize = getDynamicBarSize(data.length);
    const xAxisLabelMaxLength = getXAxisLabelMaxLength(data.length);
    const xAxisStraight = getXAxisLabelRotation(data.length);
    const xAxisHeight = xAxisStraight ? 40 : 90;

    const makeMouseHandlers = (barKey) => ({
        onMouseEnter: (d, index) => {
            setActiveBarKey(barKey);
            setActiveBarIndex(index);
            setTooltipActive(true);
            setTooltipPos({ x: d.x + d.width / 2, y: d.y });
        },
        onMouseLeave: () => {
            setActiveBarKey(null);
            setActiveBarIndex(null);
            setTooltipActive(false);
        },
    });

    return (
        <Box
            sx={{
                backgroundColor: "#fff",
                borderRadius: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                p: 2,
            }}
        >
            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#4a4e55", mb: 2 }}>
                {title}
            </Typography>

            <ResponsiveContainer width="100%" height={height}>
                <ComposedChart
                    data={data}
                    margin={{ top: 10, right: 20, left: 0, bottom: xAxisStraight ? 20 : 60 }}
                >
                    <CartesianGrid
                        horizontal={true}
                        vertical={false}
                        stroke="#d9d9d9"
                        strokeWidth={1}
                        strokeDasharray=""
                    />

                    <XAxis
                        dataKey="name"
                        axisLine={{ stroke: "#b3b3b3", strokeWidth: 1 }}
                        tickLine={false}
                        tick={<CustomXAxisTick maxLength={xAxisLabelMaxLength} straight={xAxisStraight} />}
                        interval={getXAxisInterval(data.length)}
                        height={xAxisHeight}
                    />

                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        domain={[0, "auto"]}
                        allowDecimals={false}
                        tickFormatter={(value) =>
                            Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })
                        }
                        tick={{ fontSize: 12, fill: "#706E69" }}
                    />

                    <Tooltip
                        cursor={false}
                        active={tooltipActive}
                        position={{ x: tooltipPos.x, y: tooltipPos.y - 80 }}
                        content={(props) => (
                            <Box sx={{ transform: "translateX(-50%)" }}>
                                <CustomTooltip {...props} activeBarKey={activeBarKey} />
                            </Box>
                        )}
                    />

                    <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="top"
                        wrapperStyle={{ fontSize: 11, paddingLeft: 30 }}
                    />

                    <Bar
                        dataKey={fyLabel1}
                        fill="#cccccc"
                        barSize={barSize}
                        shape={(props) => (
                            <HoverBar
                                {...props}
                                fill="#cccccc"
                                barKey={fyLabel1}
                                activeBarKey={activeBarKey}
                                activeBarIndex={activeBarIndex}
                            />
                        )}
                        {...makeMouseHandlers(fyLabel1)}
                    />
                    <Bar
                        dataKey={fyLabel2}
                        fill="#FFAF4C"
                        barSize={barSize}
                        shape={(props) => (
                            <HoverBar
                                {...props}
                                fill="#FFAF4C"
                                barKey={fyLabel2}
                                activeBarKey={activeBarKey}
                                activeBarIndex={activeBarIndex}
                            />
                        )}
                        {...makeMouseHandlers(fyLabel2)}
                    />
                    <Bar
                        dataKey={fyLabel3}
                        fill="#73E4F7"
                        barSize={barSize}
                        shape={(props) => (
                            <HoverBar
                                {...props}
                                fill="#73E4F7"
                                barKey={fyLabel3}
                                activeBarKey={activeBarKey}
                                activeBarIndex={activeBarIndex}
                            />
                        )}
                        {...makeMouseHandlers(fyLabel3)}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </Box>
    );
};

// ────────────────────────────────────────────────────────────────────────
// Parent component: only computes data shapes and renders SalesChart.
// Because SalesChart is now a module-level constant, React can update its
// props in place across re-renders instead of unmounting/remounting it.
// ────────────────────────────────────────────────────────────────────────

function SalesAnalysisCharts({ regions, tableData, years }) {

    if (!regions?.length || !tableData?.length || !years?.currentYear) return null;

    const fyLabel1 = `${String(years.secondLastYear)}`;
    const fyLabel2 = `${String(years.lastYear)}`;
    const fyLabel3 = `${String(years.currentYear)}`;

    const allRegionsChartData = tableData
        .filter((row) => !row.isTotal)
        .map((row) => {
            let fy1Total = 0, fy2Total = 0, fy3Total = 0, growthSum = 0;
            regions.forEach((region) => {
                const key = `r${region.reg_id}`;
                fy1Total += Number(row[`${key}_fy1`]) || 0;
                fy2Total += Number(row[`${key}_fy2`]) || 0;
                fy3Total += Number(row[`${key}_fy3`]) || 0;
                growthSum += Number(row[`${key}_growth`]) || 0;
            });
            return {
                name: row.label,
                [fyLabel1]: fy1Total,
                [fyLabel2]: fy2Total,
                [fyLabel3]: fy3Total,
                Growth: growthSum / regions.length,
            };
        });

    return (
        <Box display="flex" flexDirection="column" gap={3}>
            <SalesChart
                data={allRegionsChartData}
                title="ALL Pri. SALES ANALYSIS"
                height={400}
                fyLabel1={fyLabel1}
                fyLabel2={fyLabel2}
                fyLabel3={fyLabel3}
            />

            {regions.map((region) => {
                const key = `r${region.reg_id}`;
                const chartData = tableData
                    .filter((row) => !row.isTotal)
                    .map((row) => ({
                        name: row.label,
                        [fyLabel1]: row[`${key}_fy1`] || 0,
                        [fyLabel2]: row[`${key}_fy2`] || 0,
                        [fyLabel3]: row[`${key}_fy3`] || 0,
                        Growth: row[`${key}_growth`] || 0,
                    }));

                return (
                    <SalesChart
                        key={region.reg_id}
                        data={chartData}
                        title={`${region.regName} — Pri. Sales Analysis`}
                        height={320}
                        fyLabel1={fyLabel1}
                        fyLabel2={fyLabel2}
                        fyLabel3={fyLabel3}
                    />
                );
            })}
        </Box>
    );
}

export default SalesAnalysisCharts;