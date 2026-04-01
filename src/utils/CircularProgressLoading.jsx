import {
    Box,
    CircularProgress,
    Typography,
} from "@mui/material"; import React from 'react'

const CircularProgressLoading = ({progress}) => {
    const numericProgress =
        typeof progress === "string" && progress.endsWith("%")
            ? parseInt(progress)
            : null;
    return (
        <Box
            position="relative"
            display="inline-flex"
            alignItems="center"
        >
            <CircularProgress
                variant={
                    numericProgress !== null ? "determinate" : "indeterminate"
                }
                value={numericProgress || 0}
                size={30}
                thickness={3}
            />
            <Box
                top={0}
                left={0}
                bottom={0}
                right={0}
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Typography
                    variant="caption"
                    component="div"
                    color="textSecondary"
                >
                    {progress}
                </Typography>
            </Box>
        </Box>
    )
}

export default CircularProgressLoading;
