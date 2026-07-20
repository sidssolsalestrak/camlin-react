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

const StatTitle = styled(Typography)({
  fontSize: "14px",
  // fontFamily: '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontWeight: 600,
  marginTop: "5px",
  color: "#343A40",
  marginBottom: "8px",
  display: "flex",
  alignItems: "flex-end",
  gap: "8px",
  justifyContent: "center",
});

const GalleryImage = styled("img")({
  width: "100%",
  height: "200px",
  objectFit: "cover",
  cursor: "pointer",
  borderRadius: "4px",
  transition: "transform 0.3s ease",
  "&:hover": {
    transform: "scale(1.02)",
  },
});

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

// ---- PHP-style stat card pieces (colored top border, big value, "as of" date, MTD + Find Out More) ----
const StatValue = styled(Typography)({
  fontSize: "2.75rem",
  fontWeight: 700,
  color: "#1565C0",
  lineHeight: 1,
});

const StatUnit = styled(Typography)({
  fontSize: "1rem",
  fontWeight: 500,
  color: "#495057",
  marginLeft: "8px",
  marginBottom: "6px",
});

const AsOfLabel = styled(Typography)({
  fontSize: "1rem",
  color: "#a9c2e6",
  marginTop: "4px",
  textAlign: "center"
});

const FindOutMore = styled(Box)({
  display: "flex",
  alignItems: "center",
  color: "#000",
  fontWeight: 600,
  fontSize: "12px",
  cursor: "pointer",
  "&:hover": { textDecoration: "underline" },
});

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

// Helper: compute slidesToShow based on container width
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

  const fetchActivityData = async () => {
    if (!fromDateValue || !toDateValue) return;
    setActivityLoading(true);
    try {
      const res = await api.post("/activity_dashboard", {
        from_date: fromDateValue.format("YYYY-MM-DD"),
        to_date: toDateValue.format("YYYY-MM-DD"),
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
  }, [filterType, fromDateValue, toDateValue]);

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

  const fetchSalesOrderBooking = async (status, year) => {
    setSoBooking((prev) => ({ ...prev, loading: true }));
    try {
      const res = await api.post("/primary_ord_boooking", {
        status: String(status),
        year: String(year),
      });
      const data = res.data?.tbldta || [];
      if (data.length > 0) {
        setSoBooking({
          mtd: data[0].mtd_val,
          ytd: data[0].ytd_val,
          regions: [],
          loading: false,
        });
      }
    } catch (err) {
      console.error(err);
      setSoBooking((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchPrimarySales = async () => {
    setPrimarySales((prev) => ({ ...prev, loading: true }));
    try {
      const res = await api.post("/primary_sales");
      const data = res.data?.tbldta || [];
      if (data.length > 0) {
        setPrimarySales({
          mtd: data[0].mtd_val,
          ytd: data[0].ytd_val,
          loading: false,
        });
      }
    } catch (err) {
      console.error(err);
      setPrimarySales((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchSalesOrderBooking(isFlipped ? 1 : 0, bookingYear);
    fetchPrimarySales();
  }, [isFlipped, bookingYear]);

  return (
    <Layout>
      <Box sx={{ padding: "20px 20px 0px 20px" }}>
        {/* ↓ Attach ref here so ResizeObserver watches this container */}
        <Box ref={sliderContainerRef}>
          <Slider {...settings}>
            {/* <div style={{ padding: "10px" ,display:"none"}}>
              <Card
                sx={{
                  width: "97%",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  height: "140px",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <StatTitle>Primary Order</StatTitle>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: "0.9rem",
                        color: "text.secondary",
                        fontWeight: 400,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Break-up
                    </Typography>
                  </Box>

                  <Divider />

                  {!soBooking.loading ? (
                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Box sx={{ textAlign: "center", flex: 1 }}>
                        <Typography variant="caption">
                          MTD (INR Lacs.)
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ color: "rgb(0, 86, 171)" }}
                        >
                          {soBooking.mtd}
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />
                      <Box sx={{ textAlign: "center", flex: 1 }}>
                        <Typography variant="caption">
                          YTD (INR Lacs.)
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ color: "rgb(0, 86, 171)" }}
                        >
                          {soBooking.ytd}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <CircularProgress />
                  )}
                </CardContent>
              </Card>
            </div> */}

            <div style={{ padding: "10px" }}>
              <Card
                sx={{
                  width: "97%",
                  borderRadius: "10px",
                  borderTop: "4px solid #F57C00",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  height: "180px",
                  "&:hover": {
                    bgcolor: "#e2e2e2",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography
                    sx={{ fontSize: "1.15rem", fontWeight: 700, color: "#212529" }}
                  >
                    Secondary Orders
                  </Typography>
                  <Divider sx={{ my: 1.25 }} />
                  {!primarySales.loading ? (
                    <>
                      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                        <StatValue>{primarySales.ytd || 0}</StatValue>
                        <StatUnit>Pcs</StatUnit>
                      </Box>
                      <AsOfLabel >as of {dayjs().format("DD MMM YYYY")}</AsOfLabel>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mt: 2.5,
                        }}
                      >
                        <Typography sx={{ fontSize: "1rem", color: "#a9c2e6" }}>
                          MTD :{" "}
                          <Box
                            component="span"
                            sx={{ fontWeight: 500, color: "#a9c2e6" }}
                          >
                            {primarySales.mtd || 0} Pcs
                          </Box>
                        </Typography>
                        <FindOutMore>
                          Find Out More <ChevronRightIcon fontSize="small" />
                        </FindOutMore>
                      </Box>
                    </>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 90,
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </div>

            {widgets.map((widget) => (
              <div key={widget.widget_id} style={{ padding: "10px" }}>
                <TopWidget
                  widget={widget}
                  salesBooking={
                    widget.widget_id === 3
                      ? primarySales
                      : widget.type === "display"
                        ? { images: 0, avgRating: "0.00", unrated: 0, reports: 0, loading: false }
                        : widget.type === "campaign"
                          ? { status: "active", loading: false }
                          : { mtd: 0, ytd: 0, loading: false }
                  }
                />
              </div>
            ))}
          </Slider>
        </Box>

        {/* <Box sx={{ pt: 0, pr: 0.75, pb: 0.75, pl: 0.75 }} >
          <Grid container spacing={0.75}>
            <Grid size={{ md: 9, xs: 12 }}>
              <Paper
                elevation={3}
                sx={{ borderRadius: 2, overflow: "hidden", mb: 1 }}
              >
                <Tabs
                  value={tabIndex}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{
                    height: 12,
                    backgroundColor: "#f5f5f5",
                    "& .MuiTabs-indicator": {
                      height: 2,
                      borderRadius: "2px",
                      backgroundColor: "#1976d2",
                      transition: "all 0.3s ease-in-out",
                    },
                    "& .MuiTab-root": {
                      fontWeight: "bold",
                      pb: 4,
                      textTransform: "none",
                      transition: "all 0.2s ease-in-out",
                      color: "#666",
                      "&:hover": {
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                      },
                      "&.Mui-selected": {
                        color: "#1976d2",
                        backgroundColor: "#e3f2fd",
                      },
                    },
                  }}
                >
                  <Tab
                    sx={{ fontSize: "1rem" }}
                    label="Performance Reports"
                    iconPosition="end"
                    icon={<FaChartBar />}
                  />
                  <Tab
                    sx={{ fontSize: "1rem" }}
                    label="Outstandings"
                    iconPosition="end"
                    icon={<FaMoneyBill fontSize={15} />}
                  />
                </Tabs>
              </Paper>
              <Box sx={{ mt: 0.75 }}></Box>
            </Grid>

            <Grid size={{ md: 3, xs: 12, }} >
              <Paper sx={{ p: 0.75, boxShadow: 3 }}>
                <StatTitle sx={{ justifyContent: "flex-start" }}>
                  Gallery
                </StatTitle>
                <GalleryImage
                  src="https://salestrak-schuco.s3.ap-south-1.amazonaws.com/test/others/gallery_20240909110613.jpg"
                  alt="Gallery"
                />
              </Paper>
              <Paper sx={{ p: 0.75, boxShadow: 3, mt: 1 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  onClick={toggleLogs}
                  sx={{ cursor: "pointer" }}
                >
                  <StatTitle sx={{ justifyContent: "flex-start", m: 0 }}>
                    Customer Logs
                  </StatTitle>
                  <IconButton size="small">
                    {showLogs ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box> */}
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
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
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
                  <Select id="Usertype" label="User Type" MenuProps={menuStyle} labelId="Usertype" variant="outlined">
                    <MenuItem style={{ fontSize: "11px" }} value="0">SR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {filterType === "0" ? (
                // ---- Day Wise: Show All / Reported toggle ----
                <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Show All</Typography>
                    <Switch color="primary" />
                    <Typography variant="body2" color="text.secondary">Reported</Typography>
                  </Box>
                </Grid>
              ) : (
                // ---- Cumulative: Cus.Type / Emp Type ----
                <>
                  <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="custype">Cus.Type</InputLabel>
                      <Select id="custype" label="Cus.Type" MenuProps={menuStyle} labelId="custype" variant="outlined">
                        <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                        <MenuItem style={{ fontSize: "11px" }} value="1">Retailer</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="emptype">Emp Type</InputLabel>
                      <Select id="emptype" label="Emp Type" MenuProps={menuStyle} labelId="emptype" variant="outlined">
                        <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                        <MenuItem style={{ fontSize: "11px" }} value="1">Office & Scholastic</MenuItem>
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
              startIcon={<FaFileExcel />}
            >
              Export
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
          />
        )}
      </Box>
    </Layout>
  );
}