import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { Box, Typography } from "@mui/material";
import { decode } from "../../utils/common";
import api from "../../services/api";
import DataTable from "../../../src/utils/dataTable";
import usePageTitle from "../../services/usePageTitle";

const fmt2 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function MobileFieldReport() {
  const params = useParams();

  const decodedParams = useMemo(
    () => ({
      from_dt: decode(params.from_dt),
      to_dt: decode(params.to_dt),
      user_id: decode(params.user_id),
      rep_type: decode(params.rep_type),
      login_id: decode(params.login_id),
    }),
    [params],
  );

  const title = `Daily Field Reporting Summary - ${dayjs(decodedParams.from_dt).format("DD MMM YYYY")} to ${dayjs(decodedParams.to_dt).format("DD MMM YYYY")}`;
  usePageTitle("Daily Field Reporting Summary");

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateToken = async () => {
      if (!decodedParams.login_id) return;

      const existingToken = localStorage.getItem("session-token");
      if (existingToken) return;

      try {
        const res = await api.post("/generateTokenFromLoginId", {
          login_id: decodedParams.login_id,
        });

        if (res.data.success && res.data.token) {
          localStorage.setItem("session-token", res.data.token);
          window.location.reload();
        }
      } catch (err) {
        console.error("Token generation failed", err);
      }
    };

    generateToken();
  }, [decodedParams.login_id]);

  useEffect(() => {
    const loadData = async () => {
      if (!localStorage.getItem("session-token")) return;

      try {
        setLoading(true);
        const res = await api.post("/getDailyactivityReportSummary", {
          frmDt: decodedParams.from_dt,
          toDt: decodedParams.to_dt,
          user_id: decodedParams.user_id,
          rep_type: decodedParams.rep_type,
        });
        setTableData(res.data.data || []);
      } catch (err) {
        console.error(err);
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [decodedParams]);

  const rows = useMemo(() => {
    const out = [];
    let zoneId = "";
    let zoneName = "";
    let i = 0;
    let tb = 0;
    let tbr = 0;
    let td = 0;
    let tdr = 0;
    let tc = 0;
    let tpc = 0;
    let tt = 0;
    let ta = 0;

    for (let idx = 0; idx <= tableData.length; idx++) {
      const key = tableData[idx];
      const isEnd = idx === tableData.length;

      if (isEnd && tableData.length === 0) break;

      if (isEnd || (key.zone_id != zoneId && i > 0)) {
        const per1Num = tb > 0 ? (tbr / tb) * 100 : 0;
        const per2Num = tdr > 0 ? (td / tdr) * 100 : 0;
        const per3Num = tpc > 0 ? (tc / tpc) * 100 : 0;
        const per4Num = tt > 0 ? (ta / tt) * 100 : 0;

        out.push({
          id: `total-${out.length}`,
          type: "total",
          zoneName,
          tb,
          tbr,
          td,
          tdr,
          tc,
          tpc,
          tt: Number(tt.toPrecision(14)),
          ta: Number(ta.toPrecision(14)),
          per1: tb > 0 ? fmt2.format(per1Num) : 0,
          per2: tdr > 0 ? fmt2.format(per2Num) : 0,
          per3: tpc > 0 ? fmt2.format(per3Num) : 0,
          per4: tt > 0 ? fmt2.format(per4Num) : 0,
          red1: per1Num < 100,
          red2: per2Num < 100,
          red3: per3Num < 100,
          red4: per3Num < 100,
        });

        tb = 0;
        tbr = 0;
        td = 0;
        tdr = 0;
        tc = 0;
        tpc = 0;
        tt = 0;
        ta = 0;
      }

      if (isEnd) break;

      out.push({ ...key, id: `row-${out.length}`, type: "row" });
      i++;
      zoneId = key.zone_id;
      zoneName = key.zone_name;
      tb += Number(key.tot_beat);
      tbr += Number(key.tot_beat_rep);
      td += Number(key.tot_days);
      tdr += Number(key.tot_rep);
      tc += Number(key.tot_call);
      tpc += Number(key.prod_call);
      tt += Number(key.sec_tgt_val);
      ta += Number(key.sec_ach_val);
    }

    return out.map((item, index) => ({ ...item, sl: index + 1 }));
  }, [tableData]);

  const columns = [
    {
      field: "person",
      headerName: "SALES PERSON",
      renderCell: ({ row }) => {
        if (row.type === "total") {
          return <div style={{ fontWeight: 700 }}>Total {row.zoneName}</div>;
        }
        return (
          <div>
            <div style={{ color: "#6d6deb", fontWeight: 700 }}>{row.u_name}</div>
            <div style={{ fontSize: "12px" }}>
              {row.desig_name} | {row.u_hq_name}
            </div>
            <div style={{ fontSize: "10px" }}>{row.area_name}</div>
          </div>
        );
      },
      width: 180,
    },
    {
      field: "beats",
      headerName: "BEATS",
      type:'alignright',
      renderCell: ({ row }) => {
        if (row.type === "total") {
          return (
            <div style={{ fontWeight: 700 }}>
              <div>Tot: {row.tb}</div>
              <div>Rep: {row.tbr}</div>
              <div style={{ color: row.red1 ? "red" : undefined }}>{row.per1}</div>
            </div>
          );
        }
        return (
          <div>
            <div>
              <span style={{ fontWeight: 700 }}>Tot:</span> {row.tot_beat}
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>Rep:</span> {row.tot_beat_rep}
            </div>
            <div style={{ color: row.call_per < 100 ? "red" : undefined }}>
              {fmt2.format(row.tot_beat_per)}
            </div>
          </div>
        );
      },
      width: 110,
    },
    {
      field: "days",
      headerName: "DAYS",
      type:'alignright',
      renderCell: ({ row }) => {
        if (row.type === "total") {
          return (
            <div style={{ fontWeight: 700 }}>
              <div>Tot: {row.td}</div>
              <div>Rep: {row.tdr}</div>
              <div style={{ color: row.red2 ? "red" : undefined }}>{row.per2}</div>
            </div>
          );
        }
        return (
          <div>
            <div>
              <span style={{ fontWeight: 700 }}>Tot:</span> {row.tot_days}
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>Rep:</span> {row.tot_rep}
            </div>
            <div style={{ color: row.tot_rep_per < 100 ? "red" : undefined }}>
              {fmt2.format(row.tot_rep_per)}
            </div>
          </div>
        );
      },
      width: 110,
    },
    {
      field: "calls",
      headerName: "TOT. CALLS",
      type:'alignright',
      renderCell: ({ row }) => {
        if (row.type === "total") {
          return (
            <div style={{ fontWeight: 700 }}>
              <div>Tot: {row.tc}</div>
              <div>Rep: {row.tpc}</div>
              <div style={{ color: row.red3 ? "red" : undefined }}>{row.per3}</div>
            </div>
          );
        }
        return (
          <div>
            <div>
              <span style={{ fontWeight: 700 }}>Tot:</span> {row.tot_call}
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>Rep:</span> {row.prod_call}
            </div>
            <div style={{ color: row.call_per < 100 ? "red" : undefined }}>
              {fmt2.format(row.call_per)}
            </div>
          </div>
        );
      },
      width: 110,
    },
    {
      field: "sales",
      headerName: "SEC. SALES LACS",
      type:'alignright',
      renderCell: ({ row }) => {
        if (row.type === "total") {
          return (
            <div style={{ fontWeight: 700 }}>
              <div>Tgt: {row.tt}</div>
              <div>Ach: {row.ta}</div>
              <div style={{ color: row.red4 ? "red" : undefined }}>{row.per4}</div>
            </div>
          );
        }
        return (
          <div>
            <div>
              <span style={{ fontWeight: 700 }}>Tgt:</span> {row.sec_tgt_val}
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>Ach:</span> {row.sec_ach_val}
            </div>
            <div style={{ color: row.ach_per < 100 ? "red" : undefined }}>
              {fmt2.format(row.ach_per)}
            </div>
          </div>
        );
      },
      width: 130,
    },
  ];

  return (
    <Box p={2} display="flex" flexDirection="column" gap={2}>
      <Typography variant="h6" sx={{textAlign:'center',fontWeight:600}}>{title}</Typography>

      <Box
        sx={{
          backgroundColor: "#fff",
          borderRadius: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.10), 0 6px 18px rgba(0,0,0,0.07)",
        }}
      >
        <DataTable
          data={rows}
          columns={columns}
          loading={loading}
          title="Daily Field Reporting Summary"
        />
      </Box>
    </Box>
  );
}

export default MobileFieldReport;