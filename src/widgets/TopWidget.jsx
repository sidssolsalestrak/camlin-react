import { useEffect, useState } from "react";
import { Card, CardContent, Typography, CircularProgress } from "@mui/material";
import api from "../services/api";

export default function TopWidget({ widget }) {
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
      }}
    >
      <CardContent>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 600,
            mb: 1,
          }}
        >
          {widget.title}
        </Typography>

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
      </CardContent>
    </Card>
  );
}
