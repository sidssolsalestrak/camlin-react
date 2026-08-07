import { useState } from "react";
import { Box, Grid, Typography, TextField, IconButton, Dialog } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const STAR_COLOR_FILLED = "#9f931d";
const STAR_COLOR_EMPTY = "#e1d0d0";

/**
 * Mirrors PHP's getSummary_mer_breakUpRate view: one block per photo slot
 * (1-6) that has a non-empty photo{n}_name — Asset Type, Photo Title, Photo
 * Note, a read-only 5-star display (filled up to round(rate_star{n})),
 * rating comments, rate_desc (or "Unrated" fallback), an Edit/Save icon
 * (label only — PHP's actual save posts to merchandise_rating_save, not yet
 * wired here), and the image thumbnail with click-to-enlarge.
 *
 * imageBaseUrl should be the bucket/CDN root only (PHP's `s3_path3` value) —
 * this component appends the `doctor_reporting/` subfolder itself, matching
 * PHP's `s3_path3 . 'doctor_reporting/' . $ratedata['photo1_name']` exactly.
 */
export default function PhotoRatingBreakup({ ratedata, imageBaseUrl = "", onSaveRating }) {
  const [enlargedSrc, setEnlargedSrc] = useState(null);

  if (!ratedata) {
    return <Typography sx={{ py: 4, textAlign: "center" }}>No Data</Typography>;
  }

  const slots = [1, 2, 3, 4, 5, 6]
    .map((i) => ({
      idx: i,
      photoName: ratedata[`photo${i}_name`],
      assetType: ratedata[`photo_type_name${i}`],
      title: ratedata[`photo${i}_title`],
      note: ratedata[`photo${i}_note`],
      rateFlag: Number(ratedata[`rate_flag${i}`] || 0),
      rateStar: Number(ratedata[`rate_star${i}`] || 0),
      comment: ratedata[`rate_coment${i}`] || "",
      desc: ratedata[`rate_desc${i}`],
    }))
    .filter((s) => s.photoName);

  if (slots.length === 0) {
    return <Typography sx={{ py: 4, textAlign: "center" }}>No Data</Typography>;
  }

  return (
    <Box>
      {slots.map((slot) => {
        const filledStars = Math.round(slot.rateStar);
        // Mirrors PHP: s3_path3 . 'doctor_reporting/' . photo{n}_name
        const base = imageBaseUrl.endsWith("/") ? imageBaseUrl : `${imageBaseUrl}/`;
        const imgSrc = `${base}doctor_reporting/${slot.photoName}`;
        console.log("imgSrc",imgSrc);
        

        return (
          <Box
            key={slot.idx}
            sx={{ border: "1px solid #eee", borderRadius: 1, p: 2, mb: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography>
                  <b>Asset Type:</b> {slot.assetType}
                </Typography>
                <Typography>
                  <b>Photo Title:</b> {slot.title}
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <b>Photo Note:</b> {slot.note}
                </Typography>

                <Box sx={{ display: "flex", gap: 0.5, mb: 1 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarIcon
                      key={n}
                      sx={{
                        fontSize: 28,
                        color: n <= filledStars ? STAR_COLOR_FILLED : STAR_COLOR_EMPTY,
                      }}
                    />
                  ))}
                </Box>

                <Typography sx={{ mb: 0.5 }}>Rating Comments</Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  defaultValue={slot.comment}
                />

                <Typography
                  variant="caption"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1, fontStyle: "italic" }}
                >
                  {slot.desc ? (
                    slot.desc
                  ) : (
                    <>
                      <WarningAmberIcon sx={{ fontSize: 14, color: "brown" }} /> Unrated
                    </>
                  )}
                </Typography>
              </Grid>

              <Grid
                item
                xs={12}
                md={2}
                sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
              >
                <IconButton
                  onClick={() => onSaveRating && onSaveRating(slot)}
                  sx={{ color: "green" }}
                >
                  {slot.rateFlag === 1 ? <EditIcon fontSize="large" /> : <SaveIcon fontSize="large" />}
                </IconButton>
                <Typography variant="caption">
                  {slot.rateFlag === 1 ? "EDIT" : "SAVE"}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4} sx={{ display: "flex", justifyContent: "center" }}>
                {slot.photoName && (
                  <Box
                    component="img"
                    src={imgSrc}
                    alt={slot.title || "photo"}
                    sx={{
                      width: 270,
                      height: 209,
                      objectFit: "cover",
                      cursor: "pointer",
                      border: "1px solid #ddd",
                      borderRadius: 1,
                    }}
                    onClick={() => setEnlargedSrc(imgSrc)}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
        );
      })}

      <Dialog open={!!enlargedSrc} onClose={() => setEnlargedSrc(null)} maxWidth="md">
        {enlargedSrc && (
          <Box component="img" src={enlargedSrc} sx={{ width: 600, height: 600, objectFit: "contain" }} />
        )}
      </Dialog>
    </Box>
  );
}