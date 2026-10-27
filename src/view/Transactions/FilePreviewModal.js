import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const S3_PATH2 = process.env.REACT_APP_S3PATH2 || "";

const FilePreviewModal = ({ file, onClose }) => {
  const [imgIndex, setImgIndex] = useState(0);

  const allFiles = useMemo(() => {
    if (!file?.docName) return [];
    return file.docName
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
  }, [file?.docName]);

  useEffect(() => {
    setImgIndex(0);
  }, [file?.docName]);

  if (!file) return null;

  const { fileType } = file;
  const currentFile = allFiles[imgIndex] ?? "";
  const fileUrl = `${S3_PATH2}${currentFile}`;

  return (
    <Dialog
      open={!!file}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, width: "550px" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Typography sx={{ fontWeight: 500, fontSize: "1rem" }}>
          {fileType === 1
            ? "Image Preview"
            : fileType === 2
              ? "PDF Preview"
              : "Excel Preview"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 2, minHeight: 400 }}>
        {/* ── PDF or Excel → iframe ── */}
        {(fileType === 2 || fileType === 3) && (
          <Box
            component="iframe"
            src={fileUrl}
            sx={{
              width: "100%",
              height: 500,
              border: "none",
              display: "block",
            }}
            title="file-preview"
          />
        )}

        {/* ── Image → always show pagination ── */}
        {fileType === 1 && (
          <Box>
            {allFiles.length >= 1 && (
              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                  flexWrap: "wrap",
                  mb: 1.5,
                  alignItems: "center",
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  sx={{
                    minWidth: 32,
                    px: 1,
                    fontSize: 13,
                    color: "blue",
                    borderColor: "blue",
                    "&.Mui-disabled": {
                      color: "blue",
                      borderColor: "#90caf9",
                      opacity: 0.5,
                    },
                  }}
                  onClick={() =>
                    setImgIndex((p) => (p === 0 ? allFiles.length - 1 : p - 1))
                  }
                >
                  ‹‹
                </Button>

                {allFiles.map((_, i) => (
                  <Button
                    key={i}
                    size="small"
                    variant={i === imgIndex ? "contained" : "outlined"}
                    sx={{ minWidth: 32, px: 1, fontSize: 13 }}
                    onClick={() => setImgIndex(i)}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  size="small"
                  variant="outlined"
                  sx={{
                    minWidth: 32,
                    px: 1,
                    fontSize: 13,
                    color: "blue",
                    "&.Mui-disabled": {
                      color: "blue",
                      borderColor: "#90caf9",
                      opacity: 0.5,
                    },
                  }}
                  onClick={() =>
                    setImgIndex((p) => (p === allFiles.length - 1 ? 0 : p + 1))
                  }
                >
                  ››
                </Button>
              </Box>
            )}

            <Box
              component="img"
              src={`${S3_PATH2}${allFiles[imgIndex]}`}
              alt={`Preview ${imgIndex + 1}`}
              sx={{
                width: "100%",
                maxHeight: 700,
                padding: 0,
                display: "block",
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
