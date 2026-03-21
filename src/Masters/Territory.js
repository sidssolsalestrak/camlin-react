import { useState, useEffect } from "react";
import Layout from "../layout";
import { TextField, Box, Typography, Button } from "@mui/material";
import api from "../services/api";
import { useSnackbar } from "notistack";

export default function Territory() {
    const [territoryName, setTerritoryName] = useState(null);
    const [territoryError, setTerritoryError] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const handleAddTerritory = async () => {
        try {
            setTerritoryError(false);
            if (!territoryName) {
                setTerritoryError(true);
                return;
            }

            let response = await api.post("/addTerritory", {
                newTerritory: territoryName
            });
            enqueueSnackbar(response.data.message, {
                variant: 'success',
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            });
        } catch (err) {
            console.log("addTerritory error", err);
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
                    Add Territory
                </Typography>
                <Box sx={{ p: 3 }}>
                    <TextField
                        label="Territory Name"
                        onChange={(e) => setTerritoryName(e.target.value)}
                        size="small"
                        error={!!territoryError}
                        helperText={territoryError ? "Territory Name is Required" : ""}
                    />
                    <Button
                        sx={{ ml: 3 }}
                        variant="contained"
                        onClick={() => handleAddTerritory()}
                    >
                        Add
                    </Button>
                </Box>
            </Box>
        </Layout>
    );
}