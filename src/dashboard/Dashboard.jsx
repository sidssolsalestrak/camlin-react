import { useEffect, useState, useCallback, useRef } from "react";
import Slider from "react-slick";
import TopWidget from "../widgets/TopWidget";
import api from "../services/api";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Layout from "../layout";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Stack,
  Typography,
  Grid,
  IconButton,
  Table,
  TableContainer,
  Collapse,
  TableBody,
  TableRow,
  TableCell,
  Button,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  Switch,
} from "@mui/material";
import { FaFileExcel, FaTruck } from "react-icons/fa";
import { FaCartShopping, FaMoneyBill, FaChartBar } from "react-icons/fa6";
import { styled } from "@mui/material/styles";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CumulativeDashboard from "./CumulativeDashboard";

import dayjs from "dayjs";
import { Card, CardContent, Divider } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { CircularProgress } from "@mui/material";
import { TfiMenuAlt } from "react-icons/tfi";
import { exportActivityExcel } from "./exportActivityExcel";

const headContainer = {
  background: "#fff", display: "flex", flexDirection: 'column', gap: 2,
  m: 1.5, borderRadius: '6px', boxShadow:
    "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
  padding: "16px 18px",
  width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
}

const menuStyle = {
  PaperProps: {
    style: {
      maxHeight: 200
    }
  }
}

const SampleNextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "block",
        marginRight: "6px",
        filter: "brightness(0.8)",
      }}
      onClick={onClick}
    />
  );
};

const SamplePrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "block",
        marginLeft: "6px",
        zIndex: "10",
        opacity: 10,
        filter: "brightness(0.8)",
      }}
      onClick={onClick}
    />
  );
};

const getSlidesToShow = (width) => {
  if (width < 440) return 1;
  if (width < 730) return 2;
  if (width < 984) return 3;
  return 4;
};

export default function Dashboard() {
  const [widgets, setWidgets] = useState([]);
  const [tabIndex, setTabIndex] = useState(1);
  const [showLogs, setShowLogs] = useState(false);
  const [soBooking, setSoBooking] = useState({
    mtd: "",
    ytd: "",
    regions: [],
    loading: false,
  });

  const [primarySales, setPrimarySales] = useState({
    mtd: "",
    ytd: "",
    loading: false,
  });

  const [bookingYear, setBookingYear] = useState(dayjs().year());
  const [isFlipped, setIsFlipped] = useState(false);

  // ResizeObserver to track actual container width
  const sliderContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const [filterType, setFilterType] = useState("1");
  const [fromDateValue, setFromDateValue] = useState(dayjs().startOf("month"));
  const [toDateValue, setToDateValue] = useState(dayjs());
  const [activityData, setActivityData] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const [userTypeOptions, setUserTypeOptions] = useState([]); // from backend, mirrors $user_type_mas
  const [empTypeOptions, setEmpTypeOptions] = useState([]);   // from backend, mirrors $bumas
  const [activityBreakUp, setActivityBreakUp] = useState("2"); // default '2' per PHP ng-init
  const [cusType, setCusType] = useState("");                  // '' = All, '2' = Retailer
  const [empType, setEmpType] = useState("0");                 // '0' = All
  const [showAllReported, setShowAllReported] = useState(true); // toggleCheckbox4 default checked

  const [secondaryOrders, setSecondaryOrders] = useState({ pcs: 0, cum: 0, loading: true });
  const [primaryOrders, setPrimaryOrders] = useState({ pcs: 0, cum: 0, loading: true });
  const [primarySalesWidget, setPrimarySalesWidget] = useState({ pcs: 0, cum: 0, loading: true });
  const [display, setDisplay] = useState({ totalreport: 0, totalimages: 0, avgrating: 0, unrateimages: 0, loading: true });
  const [exporting, setExporting] = useState(false);
  const BIO_URL = process.env.REACT_APP_API_URL;

  const fetchUserTypeOptions = async () => {
    try {
      const res = await api.post("/dashboard/getUserTypeMas");
      setUserTypeOptions(res.data.options || []);
    } catch (err) {
      console.error(err);
      setUserTypeOptions([]);
    }
  };

  const fetchEmpTypeOptions = async () => {
    try {
      const res = await api.post("/dashboard/getBuMas");
      setEmpTypeOptions(res.data.bumas || []);
    } catch (err) {
      console.error(err);
      setEmpTypeOptions([]);
    }
  };

  const fetchSecondaryOrders = async () => {
    try {
      const res = await api.post("/dashboard/getOrders");
      setSecondaryOrders({ pcs: res.data.pcs, cum: res.data.cum, loading: false });
    } catch (err) {
      console.error(err);
      setSecondaryOrders((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchPrimaryOrders = async () => {
    try {
      const res = await api.post("/dashboard/getPrimaryOrders");
      setPrimaryOrders({ pcs: res.data.pcs, cum: res.data.cum, loading: false });
    } catch (err) {
      console.error(err);
      setPrimaryOrders((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchPrimarySalesWidget = async () => {
    try {
      const res = await api.post("/dashboard/getPrimarySalesWidget");
      setPrimarySalesWidget({ pcs: res.data.pcs, cum: res.data.cum, loading: false });
    } catch (err) {
      console.error(err);
      setPrimarySalesWidget((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchDisplay = async () => {
    try {
      const res = await api.post("/dashboard/getDisplay");
      setDisplay({
        totalreport: res.data.totalreport,
        totalimages: res.data.totalimages,
        avgrating: res.data.avgrating,
        unrateimages: res.data.unrateimages,
        loading: false,
      });
    } catch (err) {
      console.error(err);
      setDisplay((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchSecondaryOrders();
    fetchPrimaryOrders();
    fetchPrimarySalesWidget();
    fetchDisplay();
    fetchUserTypeOptions();
    fetchEmpTypeOptions();
  }, []);

  const fetchActivityData = async () => {
    if (!fromDateValue || !toDateValue) return;
    setActivityLoading(true);
    try {
      const res = await api.post("/activity_dashboard", {
        from_date: fromDateValue.format("YYYY-MM-DD"),
        to_date: toDateValue.format("YYYY-MM-DD"),
        activity_type: 2, // or however your backend flags cumulative
        activity_break_up: activityBreakUp, // '1' ASM/KAM vs '2' PSM etc.
        cus_type: cusType,
        emp_type: empType,
      });
      setActivityData(res.data?.tbldta || []);
    } catch (err) {
      console.error(err);
      setActivityData([]);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (filterType === "1") fetchActivityData();
  }, [filterType, fromDateValue, toDateValue, activityBreakUp, cusType, empType]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    if (sliderContainerRef.current) {
      observer.observe(sliderContainerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setWidgets([
      {
        widget_id: 2,
        title: "Primary Orders",
        unit: "Pcs",
        color: "#1976D2",
        type: "stat",
      },
      {
        widget_id: 3,
        title: "Primary Sales",
        unit: "Pcs",
        color: "#2E7D32",
        type: "stat",
      },
      {
        widget_id: 4,
        title: "Display",
        color: "#9E9D24",
        type: "display",
      },
      {
        widget_id: 5,
        title: "Campaigns",
        color: "#1B5E20",
        type: "campaign",
      },
    ]);
  }, []);

  useEffect(() => {
    let testbackend = async () => {
      try {
        let response = await api.get("/testres");
        console.log("camlin backend res", response);
      } catch (err) {
        console.log(err);
      }
    };
    testbackend();
  }, []);

  const toggleLogs = useCallback(() => {
    setShowLogs((prev) => !prev);
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setTabIndex(newValue);
  }, []);

  // Settings with responsive removed — handled manually via containerWidth
  const settings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: getSlidesToShow(containerWidth), // ← driven by container width
    slidesToScroll: 1,
    draggable: false,
    swipe: false,
    touchMove: false,
    arrows: true,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    autoplay: false,
  };

  return (
    <Layout>
      <Box sx={{ padding: "20px 20px 0px 20px" }}>
        {/* ↓ Attach ref here so ResizeObserver watches this container */}
        <Box ref={sliderContainerRef}>
          <Slider {...settings}>
            <div style={{ padding: "10px" }} onClick={() => window.location.href = `${BIO_URL}orderApproval/orders/`}>
              <TopWidget
                widget={{ widget_id: 1, title: "Secondary Orders", unit: "Pcs", color: "#F57C00" }}
                salesBooking={{ mtd: secondaryOrders.cum, ytd: secondaryOrders.pcs, loading: secondaryOrders.loading }}
              />
            </div>

            <div style={{ padding: "10px" }} onClick={() => {
              const currentMonth = dayjs().format("MMM YYYY");
              window.location.href = `${BIO_URL}mobile/Orders/${btoa(0)}/${btoa(0)}/${btoa(currentMonth)}/${btoa(0)}/${btoa(0)}/${btoa(0)}`;
            }}>
              <TopWidget
                widget={{ widget_id: 2, title: "Primary Orders", unit: "Pcs", color: "#1976D2" }}
                salesBooking={{ mtd: primaryOrders.cum, ytd: primaryOrders.pcs, loading: primaryOrders.loading }}
              />
            </div>

            <div style={{ padding: "10px" }} onClick={() => window.location.href = `${BIO_URL}dashboard/primarysalesview/${btoa(1)}`}>
              <TopWidget
                widget={{ widget_id: 3, title: "Primary Sales", unit: "Pcs", color: "#2E7D32" }}
                salesBooking={{ mtd: primarySalesWidget.cum, ytd: primarySalesWidget.pcs, loading: primarySalesWidget.loading }}
                asOfLabel={`on ${dayjs().subtract(1, "day").format("DD MMM YYYY")}`}
              />
            </div>

            <div style={{ padding: "10px" }} onClick={() => { /* opens Display breakup, see note below */ }}>
              <TopWidget
                widget={{ widget_id: 4, title: "Display", color: "#9E9D24", type: "display" }}
                salesBooking={{
                  reports: display.totalreport,
                  images: display.totalimages,
                  avgRating: display.avgrating,
                  unrated: display.unrateimages,
                  loading: display.loading,
                }}
              />
            </div>

            <div style={{ padding: "10px" }}>
              <TopWidget
                widget={{ widget_id: 5, title: "Campaigns", color: "#1B5E20", type: "campaign" }}
                salesBooking={{ status: "active", loading: false }}
              />
            </div>
          </Slider>
        </Box>
      </Box>

      <Box sx={headContainer}>
        <Box>
          <Button
            onClick={() => {/* handle click */ }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 1,
              textTransform: "none",
              padding: 0,
              color: "#000",
              "&:hover": { background: "none", opacity: 0.75 },
            }}
          >
            <TfiMenuAlt size={16} />
            <Typography sx={{ fontSize: "1.2rem", fontWeight: 500, color: "#000" }}>
              Activity Dashboard
            </Typography>
          </Button>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Grid container spacing={1} alignItems="center">
              {filterType === "0" ? (
                // ---- Day Wise: single Date field ----
                <Grid size={{ xs: 12, sm: 6, md: 1.5, lg: 1.5 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date"
                      format="DD MMM YYYY"
                      slotProps={{ textField: { size: "small", fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
              ) : (
                // ---- Cumulative: From / To range ----
                <>
                  <Grid size={{ xs: 12, sm: 6, md: 1.5, lg: 1.5 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="From"
                        format="DD MMM YYYY"
                        value={fromDateValue}
                        onChange={(newVal) => setFromDateValue(newVal)}
                        slotProps={{ textField: { size: "small", fullWidth: true } }}
                        maxDate={toDateValue ? toDateValue : null}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 1.5, lg: 1.5 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="To"
                        format="DD MMM YYYY"
                        value={toDateValue}
                        onChange={(newVal) => setToDateValue(newVal)}
                        slotProps={{ textField: { size: "small", fullWidth: true } }}
                        minDate={fromDateValue ? fromDateValue : null}
                      />
                    </LocalizationProvider>
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="type">Type</InputLabel>
                  <Select
                    id="type"
                    label="Type"
                    MenuProps={menuStyle}
                    labelId="type"
                    variant="outlined"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem style={{ fontSize: "11px" }} value="0">Day Wise</MenuItem>
                    <MenuItem style={{ fontSize: "11px" }} value="1">Cumulative</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="Usertype">User Type</InputLabel>
                  <Select
                    id="Usertype"
                    label="User Type"
                    MenuProps={menuStyle}
                    labelId="Usertype"
                    variant="outlined"
                    value={activityBreakUp}
                    onChange={(e) => setActivityBreakUp(e.target.value)}
                  >
                    {userTypeOptions.map((opt) => (
                      <MenuItem key={opt.value} style={{ fontSize: "11px" }} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {filterType === "0" ? (
                <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Show All</Typography>
                    <Switch
                      color="primary"
                      checked={showAllReported}
                      onChange={(e) => setShowAllReported(e.target.checked)}
                    />
                    <Typography variant="body2" color="text.secondary">Reported</Typography>
                  </Box>
                </Grid>
              ) : (
                <>
                  <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="custype">Cus.Type</InputLabel>
                      <Select
                        id="custype" label="Cus.Type" MenuProps={menuStyle} labelId="custype" variant="outlined"
                        value={cusType}
                        onChange={(e) => setCusType(e.target.value)}
                      >
                        <MenuItem style={{ fontSize: "11px" }} value="">All</MenuItem>
                        <MenuItem style={{ fontSize: "11px" }} value="2">Retailer</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="emptype">Emp Type</InputLabel>
                      <Select
                        id="emptype" label="Emp Type" MenuProps={menuStyle} labelId="emptype" variant="outlined"
                        value={empType}
                        onChange={(e) => setEmpType(e.target.value)}
                      >
                        <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                        {empTypeOptions.map((bu) => (
                          <MenuItem key={bu.id} style={{ fontSize: "11px" }} value={String(bu.id)}>
                            {bu.bu_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="warning"
              disabled={exporting}
              startIcon={<FaFileExcel />}
              onClick={async () => {
                setExporting(true);
                try {
                  await exportActivityExcel(
                    activityData,
                    fromDateValue.format("DD MMM YYYY"),
                    toDateValue.format("DD MMM YYYY")
                  );
                } catch (err) {
                  console.error("Export failed:", err);
                } finally {
                  setExporting(false);
                }
              }}
            >
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </Box>
        </Box>
        {filterType === "1" && (
          <CumulativeDashboard
            activityData={activityData}      // your fetched array, same shape as PHP $activityData
            fromDate={fromDateValue}         // 'YYYY-MM-DD'
            toDate={toDateValue}
            onSalePersonClick={(srId, regId, name) => { /* open callSummaryDetails */ }}
            onFieldDetailClick={(cusCat, row) => { /* open FieldDetail modal */ }}
            onCumCusDetailClick={(cusCat, row) => { /* open cumCusDetail modal */ }}
            onEventClick={(id, row) => { /* open EventCellDetail modal */ }}
            activityLoading={activityLoading}
          />
        )}
      </Box>
    </Layout>
  );
}