import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { FaBullhorn } from "react-icons/fa";

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
  textAlign: "center",
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

const CardShell = ({ borderColor, title, children }) => (
  <Card
    sx={{
      width: "97%",
      borderRadius: "10px",
      borderTop: `4px solid ${borderColor}`,
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      height: "180px",
      cursor: "pointer",
      "&:hover": {
        bgcolor: "#e2e2e2",
      },
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Typography sx={{ fontSize: "1.15rem", fontWeight: 700, color: "#212529" }}>
        {title}
      </Typography>
      <Divider sx={{ my: 1.25 }} />
      {children}
    </CardContent>
  </Card>
);

export default function TopWidget({
  widget,
  salesBooking = { mtd: 0, ytd: 0, loading: false },
  asOfLabel
}) {
  const borderColor = widget?.color || "#F57C00";

  if (salesBooking.loading) {
    return (
      <CardShell borderColor={borderColor} title={widget.title}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 90 }}>
          <CircularProgress />
        </Box>
      </CardShell>
    );
  }

  // ---- Display widget: Reports value + Images / Avg Rating / UnRated columns ----
  if (widget.type === "display") {
    const { reports = 0, images = 0, avgRating = "0.00", unrated = 0 } = salesBooking;
    return (
      <CardShell borderColor={borderColor} title={widget.title}>
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <StatValue>{reports}</StatValue>
          <StatUnit>Reports</StatUnit>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "flex-start",
            mt: 2,
            textAlign: "center",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#212529" }}>
              Images :
            </Typography>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#1565C0" }}>
              {images}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#212529" }}>
              Avg Rating:
            </Typography>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#1565C0" }}>
              {avgRating}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#212529" }}>
              UnRated:
            </Typography>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#1565C0" }}>
              {unrated}
            </Typography>
          </Box>
        </Box>
      </CardShell>
    );
  }

  // ---- Campaigns widget: just "active" + Find Out More ----
  if (widget.type === "campaign") {
    const status = salesBooking.status || "active";
    return (
      <CardShell borderColor={borderColor} title={widget.title}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 70,
            gap: 1
          }}
        >
          <FaBullhorn color="#1565C0" size={20} />
          <Typography sx={{ fontSize: "2.25rem", fontWeight: 700, color: "#1565C0" }}>
            {status}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <FindOutMore>
            Find Out More <ChevronRightIcon fontSize="small" />
          </FindOutMore>
        </Box>
      </CardShell>
    );
  }

  // ---- Default stat widget (Primary Orders / Primary Sales / etc.) ----
  return (
    <CardShell borderColor={borderColor} title={widget.title}>
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <StatValue>{salesBooking.ytd || 0}</StatValue>
        <StatUnit>{widget.unit || "Pcs"}</StatUnit>
      </Box>
      <AsOfLabel>{asOfLabel || `as of ${dayjs().format("DD MMM YYYY")}`}</AsOfLabel>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2.5 }}>
        <Typography sx={{ fontSize: "1rem", color: "#a9c2e6" }}>
          MTD:{" "}
          <Box component="span" sx={{ fontWeight: 500, color: "#a9c2e6" }}>
            {salesBooking.mtd || 0} {widget.unit || "Pcs"}
          </Box>
        </Typography>
        <FindOutMore>
          Find Out More <ChevronRightIcon fontSize="small" />
        </FindOutMore>
      </Box>
    </CardShell>
  );
}