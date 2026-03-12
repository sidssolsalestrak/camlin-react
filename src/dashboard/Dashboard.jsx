import { useEffect, useState, useCallback } from "react";
import Slider from "react-slick";
import TopWidget from "../widgets/TopWidget";
import api from "../services/api";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Layout from "../layout";
// Line 8 - change your import:
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
  fontFamily: '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
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

  const [bookingYear, setBookingYear] = useState(dayjs().year());
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setWidgets([
      // {
      //   widget_id: "sales_booking",
      //   title: "Sales Order Booking",
      //   icon: (
      //     <FaCartShopping
      //       color="#808080"
      //       fontSize={52}
      //       style={{ marginTop: "0.35rem" }}
      //     />
      //   ),
      // },
      {
        widget_id: 1,
        title: "Open Sales Order",
        icon: (
          <FaCartShopping
            color="#808080"
            fontSize={52}
            style={{ marginTop: "0.35rem", cursor: "pointer" }}
          />
        ),
      },
      {
        widget_id: 2,
        title: "Ready To Ship",
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
        title: "Invoice MTD",
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

  const handleTabChange = useCallback((event, newValue) => {
    setTabIndex(newValue);
  }, []);

  const settings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: 4,
    slidesToScroll: 1,
    draggable: false,
    swipe: false,
    touchMove: false,
    arrows: true,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    autoplay: false, // no auto sliding
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1 },
      },
    ],
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

  useEffect(() => {
    fetchSalesOrderBooking(isFlipped ? 1 : 0, bookingYear);
  }, [isFlipped, bookingYear]);

  return (
    <Layout>
      <Box sx={{ padding: "20px" }}>
        <Slider {...settings}>
          <div style={{ padding: "10px" }}>
            <Card
              sx={{
                width: "97%",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
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
                  <StatTitle>Sales Order Booking</StatTitle>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    {bookingYear}
                    <CalendarMonthIcon sx={{ fontSize: 16, ml: 0.5 }} />

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        views={["year"]}
                        value={dayjs().year(bookingYear)}
                        onChange={(val) => val && setBookingYear(val.year())}
                        slotProps={{
                          textField: { sx: { display: "none" } },
                        }}
                      />
                    </LocalizationProvider>
                  </Box>
                </Box>

                <Divider />

                {!soBooking.loading ? (
                  <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                    <Box sx={{ textAlign: "center", flex: 1 }}>
                      <Typography variant="caption">MTD (INR Cr.)</Typography>
                      <Typography
                        variant="h5"
                        sx={{ color: "rgb(0, 86, 171)" }}
                      >
                        {soBooking.mtd}
                      </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem />

                    <Box sx={{ textAlign: "center", flex: 1 }}>
                      <Typography variant="caption">YTD (INR Cr.)</Typography>
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

          {widgets.map((widget) => (
            <div key={widget.widget_id} style={{ padding: "10px" }}>
              {/* <TopWidget
                widget={widget}
                salesBooking={
                  widget.widget_id === "sales_booking" ? soBooking : null
                }
                bookingYear={bookingYear}
                setBookingYear={setBookingYear}
              /> */}
              <TopWidget widget={widget} />
            </div>
          ))}
        </Slider>

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
                      fontSize: "0.83rem",
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
                    sx={{ fontSize: "1.083rem" }}
                    label="Performance Reports"
                    iconPosition="end"
                    icon={<FaChartBar />}
                  />
                  <Tab
                    sx={{ fontSize: "1.083rem" }}
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
