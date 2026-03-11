import { useEffect, useState } from "react";
import { Card, CardContent, Typography, CircularProgress, Box, Divider } from "@mui/material";
import api from "../services/api";

export default function TopWidget({ widget}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(widget.api_endpoint);

        setData(res.data.data);
      } catch (err) {
        console.error("Widget API error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [widget]);

  return (
    <Card
      sx={{
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        width:'97%'
      }}
    >
      <CardContent>
        <Typography
          sx={{
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
          }}
        >
          {widget.title}
        </Typography>
        <Divider sx={{ width: '100%' }} />
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Box sx={{ width: '50%' }}>{widget.icon}</Box>
          {loading ? (
            <CircularProgress size={25} />
          ) : (
            <Typography
              sx={{
                fontSize: "28px",
                fontWeight: 500,
                color: "#0056ab",
              }}
            >
              {data?.value || 0}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
