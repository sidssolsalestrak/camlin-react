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
} from "@mui/material";
import { FaTruck } from "react-icons/fa";
import { FaCartShopping, FaMoneyBill, FaChartBar } from "react-icons/fa6";
import { styled } from "@mui/material/styles";
import { ExpandMore, ExpandLess } from "@mui/icons-material";

import dayjs from "dayjs";
import { Card, CardContent, Divider } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { CircularProgress } from "@mui/material";

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
        title: "Sales Order Ready to Ship",
        icon: (
          <FaTruck
            color="#808080"
            fontSize={52}
            style={{ marginTop: "0.35rem", cursor: "pointer" }}
          />
        ),
      },
      {
        widget_id: 3,
        title: "Sales Order Partially Ready",
        icon: (
          <FaTruck
            color="#808080"
            fontSize={52}
            style={{ marginTop: "0.35rem", cursor: "pointer" }}
          />
        ),
      },
      {
        widget_id: 4,
        title: "Pending Invoices",
        icon: (
          <FaMoneyBill
            color="#808080"
            fontSize={52}
            style={{ marginTop: "0.35rem", cursor: "pointer" }}
          />
        ),
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
      <Box sx={{ padding: "20px" }}>
        {/* ↓ Attach ref here so ResizeObserver watches this container */}
        <Box ref={sliderContainerRef}>
          <Slider {...settings}>
            <div style={{ padding: "10px" }}>
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
                    <StatTitle>Primary Order Booking</StatTitle>
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
            </div>

            <div style={{ padding: "10px" }}>
              <Card
                sx={{
                  width: "97%",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  height: "140px",
                }}
              >
                <CardContent>
                  <StatTitle>Primary Sales Order</StatTitle>
                  <Divider />
                  {!primarySales.loading ? (
                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Box sx={{ textAlign: "center", flex: 1 }}>
                        <Typography variant="caption">
                          MTD (INR Lacs.)
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ color: "rgb(0, 86, 171)" }}
                        >
                          {primarySales.mtd}
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
                          {primarySales.ytd}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <CircularProgress />
                  )}
                </CardContent>
              </Card>
            </div>

            {widgets.map((widget) => (
              <div key={widget.widget_id} style={{ padding: "10px" }}>
                <TopWidget widget={widget} />
              </div>
            ))}
          </Slider>
        </Box>

        <Box sx={{ pt: 0, pr: 0.75, pb: 0.75, pl: 0.75 }}>
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

            <Grid size={{ md: 3, xs: 12 }}>
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
        </Box>
      </Box>
    </Layout>
  );
}
