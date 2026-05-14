import {
    ComposedChart, Bar, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Box, Typography } from "@mui/material";

function SalesAnalysisCharts({ regions, tableData, years }) {

    if (!regions?.length || !tableData?.length || !years?.currentYear) return null;

    const fyLabel1 = `FY${String(years.secondLastYear).slice(2)}-${String(years.lastYear).slice(2)}`;
    const fyLabel2 = `FY${String(years.lastYear).slice(2)}-${String(years.currentYear).slice(2)}`;
    const fyLabel3 = `FY${String(years.currentYear).slice(2)}-${String(years.nextYear).slice(2)}`;

    // Calculate total data for all regions combined
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
                Growth: growthSum / regions.length, // Average growth
            };
        });

    return (
        <Box display="flex" flexDirection="column" gap={3}>
            {/* All Regions Combined Chart */}
            <Box
                sx={{
                    backgroundColor: "#fff",
                    borderRadius: "10px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                    p: 2,
                }}
            >
                <Typography
                    sx={{ fontSize: "13px", fontWeight: 600, color: "#4a4e55", mb: 2 }}
                >
                    ALL Pri. SALES ANALYSIS
                </Typography>

                <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart
                        data={allRegionsChartData}
                        margin={{ top: 10, right: 100, left: 80, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "#706E69" }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                        />

                        {/* Left Y — sales values (full numbers) */}
                        <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 11, fill: "#706E69" }}
                            tickFormatter={(v) => v.toLocaleString("en-IN")}
                        />

                        <Tooltip
                            contentStyle={{ fontSize: 12 }}
                            formatter={(value, name) =>
                                name === "Growth"
                                    ? [`${value.toFixed(2)}%`, name]
                                    : [value.toLocaleString("en-IN"), name]
                            }
                        />

                        <Legend 
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            wrapperStyle={{ fontSize: 11, paddingLeft: 10 }} 
                        />

                        <Bar yAxisId="left" dataKey={fyLabel1} fill="#cccccc" barSize={18} />
                        <Bar yAxisId="left" dataKey={fyLabel2} fill="#FFAF4C" barSize={18} />
                        <Bar yAxisId="left" dataKey={fyLabel3} fill="#73E4F7" barSize={18} />
                    </ComposedChart>
                </ResponsiveContainer>
            </Box>

            {/* Individual Region Charts */}
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
                    <Box
                        key={region.reg_id}
                        sx={{
                            backgroundColor: "#fff",
                            borderRadius: "10px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                            p: 2,
                        }}
                    >
                        <Typography
                            sx={{ fontSize: "13px", fontWeight: 600, color: "#4a4e55", mb: 2 }}
                        >
                            {region.regName} — Pri. Sales Analysis
                        </Typography>

                        <ResponsiveContainer width="100%" height={320}>
                            <ComposedChart
                                data={chartData}
                                margin={{ top: 10, right: 120, left: 60, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: "#706E69" }}
                                    angle={-35}
                                    textAnchor="end"
                                    interval={0}
                                />

                                {/* Left Y — sales values (full numbers) */}
                                <YAxis
                                    yAxisId="left"
                                    tick={{ fontSize: 11, fill: "#706E69" }}
                                    tickFormatter={(v) => v.toLocaleString("en-IN")}
                                />

                                <Tooltip
                                    contentStyle={{ fontSize: 12 }}
                                    formatter={(value, name) =>
                                        name === "Growth"
                                            ? [`${value}%`, name]
                                            : [value.toLocaleString("en-IN"), name]
                                    }
                                />

                                <Legend 
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    wrapperStyle={{ fontSize: 11, paddingLeft: 10 }} 
                                />

                                <Bar yAxisId="left" dataKey={fyLabel1} fill="#cccccc" barSize={18} />
                                <Bar yAxisId="left" dataKey={fyLabel2} fill="#FFAF4C" barSize={18} />
                                <Bar yAxisId="left" dataKey={fyLabel3} fill="#73E4F7" barSize={18} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Box>
                );
            })}
        </Box>
    );
}

export default SalesAnalysisCharts;