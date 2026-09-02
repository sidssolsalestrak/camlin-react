import { useState, useEffect } from "react";
import { Box, Grid, Typography, TextField, IconButton, Dialog } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import useToast from "../../src/utils/useToast";

const STAR_COLOR_FILLED = "#9f931d";
const STAR_COLOR_EMPTY = "#e1d0d0";

export default function PhotoRatingBreakup({ ratedata, imageBaseUrl = "", api ,onRatingSaved}) {
 const toast = useToast();
   const [enlargedSrc, setEnlargedSrc] = useState(null);
   const [edits, setEdits] = useState({});
   const [savingIdx, setSavingIdx] = useState(null);

  const slots = ratedata
    ? [1, 2, 3, 4, 5, 6]
      .map((i) => ({
        idx: i,
        id: ratedata.id,
        photoName: ratedata[`photo${i}_name`],
        assetType: ratedata[`photo_type_name${i}`],
        title: ratedata[`photo${i}_title`],
        note: ratedata[`photo${i}_note`],
        rateFlag: Number(ratedata[`rate_flag${i}`] || 0),
        rateStar: Number(ratedata[`rate_star${i}`] || 0),
        comment: ratedata[`rate_coment${i}`] || "",
        desc: ratedata[`rate_desc${i}`],
      }))
      .filter((s) => s.photoName)
    : [];

  // seed local edit state whenever a new ratedata record comes in
  useEffect(() => {
    if (!slots.length) return;
    const initial = {};
    slots.forEach((s) => {
      initial[s.idx] = { rateStar: s.rateStar, comment: s.comment, hoverStar: 0 };
    });
    setEdits(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratedata]);

  if (!ratedata || slots.length === 0) {
    return <Typography sx={{ py: 4, textAlign: "center" }}>No Data</Typography>;
  }

  const setStar = (idx, value) => {
    setEdits((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], rateStar: value },
    }));
  };

  const setHover = (idx, value) => {
    setEdits((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], hoverStar: value },
    }));
  };

  const setComment = (idx, value) => {
    setEdits((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], comment: value },
    }));
  };

  const handleSave = async (slot) => {
     const edit = edits[slot.idx] || {};
     const rate_star = edit.rateStar ?? slot.rateStar;
     const comment = edit.comment ?? slot.comment;

    if (!rate_star) {
     toast.error("Please select a star rating before saving");
     return;
   }
     setSavingIdx(slot.idx);
     try {
       const res = await api.post("/merchandiseRatingSave", {
         dataId: slot.idx,
         keyid: slot.id,
         rateComment: comment,
         rate_flag: 1,
         rate_star,
       });

       if (res.status == "200") {
        toast.success("Rating saved successfully");
         onRatingSaved && onRatingSaved();
       } else {
        console.error("Save failed:", res.data);
        toast.error("Failed to save rating");
       }
     } catch (err) {
       console.error("merchandiseRatingSave error:", err);
      toast.error("Something went wrong, Try again!!");
     } finally {
       setSavingIdx(null);
     }
   };

  return (
    <Box>
      {slots.map((slot) => {
        const edit = edits[slot.idx] || { rateStar: slot.rateStar, comment: slot.comment, hoverStar: 0 };
        const displayStars = edit.hoverStar || edit.rateStar || 0;

        const base = imageBaseUrl.endsWith("/") ? imageBaseUrl : `${imageBaseUrl}/`;
        const imgSrc = `${base}doctor_reporting/${slot.photoName}`;

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
                      onClick={() => setStar(slot.idx, n)}
                      onMouseEnter={() => setHover(slot.idx, n)}
                      onMouseLeave={() => setHover(slot.idx, 0)}
                      sx={{
                        fontSize: 28,
                        cursor: "pointer",
                        color: n <= displayStars ? STAR_COLOR_FILLED : STAR_COLOR_EMPTY,
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
                  value={edit.comment}
                  onChange={(e) => setComment(slot.idx, e.target.value)}
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
                <IconButton onClick={() => handleSave(slot)} sx={{ color: "green" }}>
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