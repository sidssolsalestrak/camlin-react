import { useState, useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip as MuiTooltip,
} from "@mui/material";
import TableChartIcon from "@mui/icons-material/TableChart";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import GaugeMeter from "./Gaugemeter";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PIE_COLORS = ["#3366cc", "#dc3912", "#ff9900"]; // A / B / C — matches PHP's Google Charts default-ish palette
const STACK_COLORS = {
  A: "#3366cc",
  B: "#dc3912",
  C: "#ff9900",
  Missed: "#F56749",
};

const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

export default function ProfileWidgetGraphs({ repProfileData, coveragePatternData = [] }) {
  const [showTable, setShowTable] = useState(false);

  const callAvg = round2(repProfileData?.call_avg);
  const dpStat = round2(repProfileData?.dp_stat);
  const totA = Number(repProfileData?.tot_a || 0);
  const totB = Number(repProfileData?.tot_b || 0);
  const totC = Number(repProfileData?.tot_c || 0);

  const pieData = [
    { name: "A Class", value: totA },
    { name: "B Class", value: totB },
    { name: "C Class", value: totC },
  ];
  const pieTotal = totA + totB + totC;

  // Build month-by-month stacked bar data from coveragePatternData rows
  // (each row: { class_name, m1_class..m12_class }) — mirrors PHP's $monthData construction.
  const { chartData, tableRows, monthTotals } = useMemo(() => {
    const rows = coveragePatternData || [];
    const chart = MONTHS.map((label, i) => {
      const monthNum = i + 1;
      const point = { month: label };
      rows.forEach((row) => {
        const key = `m${monthNum}_class`;
        // class_name is like "A Class", "B Class", "C Class", "Missed"
        const shortKey = row.class_name?.replace(" Class", "");
        point[shortKey] = Number(row[key] || 0);
      });
      return point;
    });

    const totals = MONTHS.map((_, i) => {
      const monthNum = i + 1;
      const key = `m${monthNum}_class`;
      return rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
    });

    return { chartData: chart, tableRows: rows, monthTotals: totals };
  }, [coveragePatternData]);

  const stackKeys = useMemo(() => {
    const names = (coveragePatternData || []).map((r) => r.class_name?.replace(" Class", ""));
    // Preserve a stable, sensible order: A, B, C, Missed, then anything else
    const order = ["A", "B", "C", "Missed"];
    return order.filter((k) => names.includes(k));
  }, [coveragePatternData]);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ border: "3px solid #eee", p: 2 }}>
            <GaugeMeter
              title="CALL AVERAGE"
              value={callAvg}
              max={7}
              valueLabel={callAvg}
              bands={[
                { limit: 2, color: "#F56749", label: "0-2" },
                { limit: 5, color: "orange", label: "2-5" },
                { limit: 7, color: "#49DC00", label: ">5" },
              ]}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ border: "3px solid #eee", p: 2, position: "relative" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1, pl: 1 }}>
              CUSTOMER MIX
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={90}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <Typography sx={{ textAlign: "center", fontWeight: 700, mt: -1 }}>
              {pieTotal}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ border: "3px solid #eee", p: 2 }}>
            <GaugeMeter
              title="PROFILE STATUS"
              value={dpStat}
              max={100}
              valueLabel={`${dpStat}%`}
              bands={[
                { limit: 45, color: "#F56749", label: "0-45" },
                { limit: 80, color: "orange", label: "46-80" },
                { limit: 100, color: "#49DC00", label: "80-100" },
              ]}
            />
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: "3px solid #eee", p: 2, mt: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13 }}>COVERAGE PATTERN</Typography>
          <MuiTooltip title="View as table">
            <IconButton size="small" onClick={() => setShowTable((s) => !s)}>
              <TableChartIcon sx={{ color: "green" }} />
            </IconButton>
          </MuiTooltip>
        </Box>

        {showTable ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#369ee8" }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>#</TableCell>
                  {MONTHS.map((m) => (
                    <TableCell key={m} align="center" sx={{ color: "#fff", fontWeight: 700 }}>
                      {m}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.class_name}</TableCell>
                    {MONTHS.map((_, i) => (
                      <TableCell key={i} align="center">
                        {row[`m${i + 1}_class`]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  {monthTotals.map((t, i) => (
                    <TableCell key={i} align="center" sx={{ fontWeight: 700 }}>
                      {t}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {stackKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="coverage"
                  fill={STACK_COLORS[key] || "#999"}
                  name={key === "Missed" ? "Missed Class" : `${key} Class`}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>
    </Box>
  );
}