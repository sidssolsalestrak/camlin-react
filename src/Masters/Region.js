import { useState, useEffect } from "react";
import Layout from "../layout";
import { TextField, Box, Typography, Button } from "@mui/material";
import api from "../services/api";
import { useSnackbar } from "notistack";

export default function Region() {
    const [regionName, setRegionName] = useState(null);
    const [regionError, setRegionError] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const handleAddRegion = async () => {
        try {
            setRegionError(false);
            if (!regionName) {
                setRegionError(true);
                return;
            }

            let response = await api.post("/addRegion", {
                newRegion: regionName
            });
            enqueueSnackbar(response.data.message, {
                variant: 'success',
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            });
        } catch (err) {
            console.log("addRegion error", err);
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
                    Add Region
                </Typography>
                <Box sx={{ p: 3 }}>
                    <TextField
                        label="Region Name"
                        onChange={(e) => setRegionName(e.target.value)}
                        size="small"
                        error={!!regionError}
                        helperText={regionError ? "Region Name is Required" : ""}
                    />
                    <Button
                        sx={{ ml: 3 }}
                        variant="contained"
                        onClick={() => handleAddRegion()}
                    >
                        Add
                    </Button>
                </Box>
            </Box>
        </Layout>
    );
}