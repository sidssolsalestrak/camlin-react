import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";

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

export default function TopWidget({
  widget,
  salesBooking,
  bookingYear,
  setBookingYear,
}) {
  return (
    <Card
      sx={{
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        width: "97%",
        height: "140px"
      }}
    >
      <CardContent>
        <StatTitle>{widget.title}</StatTitle>

        <Divider />

        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Box sx={{ width: "50%" }}>{widget.icon}</Box>

          {salesBooking ? (
            salesBooking.loading ? (
              <CircularProgress size={25} />
            ) : (
              <Box>
                <Typography
                  sx={{
                    fontSize: "28px",
                    fontWeight: 500,
                    color: "#0056ab",
                  }}
                >
                  {salesBooking.mtd}
                </Typography>

                <Typography sx={{ fontSize: "12px" }}>
                  YTD: {salesBooking.ytd}
                </Typography>
              </Box>
            )
          ) : (
            <Typography
              sx={{
                fontSize: "28px",
                fontWeight: 500,
                color: "#0056ab",
              }}
            >
              0
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
