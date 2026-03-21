import { useState, useEffect } from "react";
import Layout from "../layout";
import { TextField, Box, Typography, Button } from "@mui/material";
import api from "../services/api";
import { useSnackbar } from "notistack";

export default function Area() {
    const [areaName, setAreaName] = useState(null);
    const [areaError, setAreaError] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const handleAddArea = async () => {
        try {
            setAreaError(false);
            if (!areaName) {
                setAreaError(true);
                return;
            }

            let response = await api.post("/addArea", {
                newArea: areaName
            });
            enqueueSnackbar(response.data.message, {
                variant: 'success',
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            });
        } catch (err) {
            console.log("addArea error", err);
            enqueueSnackbar("Something went wrong Try again!!", {
                variant: 'error',
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            });
        }
    };

    return (
        <Layout>
            <Box sx={{ backgroundColor: 'white', m: 3, borderRadius: '6px', minHeight: '70vh' }}>
                <Typography sx={{ p: 3, fontWeight: 600, color: 'blue', fontSize: '1.2rem' }}>
                    Add Area
                </Typography>
                <Box sx={{ p: 3 }}>
                    <TextField
                        label="Area Name"
                        onChange={(e) => setAreaName(e.target.value)}
                        size="small"
                        error={!!areaError}
                        helperText={areaError ? "Area Name is Required" : ""}
                    />
                    <Button
                        sx={{ ml: 3 }}
                        variant="contained"
                        onClick={() => handleAddArea()}
                    >
                        Add
                    </Button>
                </Box>
            </Box>
        </Layout>
    );
}