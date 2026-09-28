import { Box, Typography } from "@mui/material";

/**
 * Semicircle gauge mirroring PHP's SVG-based meter widget.
 * `bands` defines the colored threshold ranges (each: { limit, color, label }),
 * evaluated in order against `max` to build the arc segments.
 */
export default function GaugeMeter({ value, max, bands, valueLabel, title }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 85;
  const strokeWidth = 18;

  const clampedValue = Math.max(0, Math.min(value ?? 0, max));
  const pct = max > 0 ? clampedValue / max : 0;

  // Semicircle: angle from 180deg (left) to 0deg (right)
  const angleForPct = (p) => 180 - p * 180;
  const polarToCartesian = (angleDeg) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy - r * Math.sin(angleRad),
    };
  };

  const describeArc = (startPct, endPct) => {
    const start = polarToCartesian(angleForPct(startPct));
    const end = polarToCartesian(angleForPct(endPct));
    const largeArcFlag = endPct - startPct > 0.5 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  // Build band segments as fractions of `max`
  let prevLimit = 0;
  const segments = bands.map((band) => {
    const startPct = prevLimit / max;
    const endPct = Math.min(band.limit, max) / max;
    prevLimit = band.limit;
    return { ...band, startPct, endPct };
  });

  const needleAngle = angleForPct(pct);
  const needleTip = polarToCartesian(needleAngle);

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography sx={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.5, mb: 1 }}>
        {title}
      </Typography>
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {segments.map((seg, idx) => (
          <path
            key={idx}
            d={describeArc(seg.startPct, seg.endPct)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        ))}
        {/* needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#333"
          strokeWidth={3}
        />
        <circle cx={cx} cy={cy} r={6} fill="#333" />
      </svg>
      <Typography sx={{ fontWeight: 700, fontSize: 20, mt: -1 }}>{valueLabel}</Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 1, flexWrap: "wrap" }}>
        {bands.map((band, idx) => (
          <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, backgroundColor: band.color, borderRadius: "2px" }} />
            <Typography variant="caption">{band.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}