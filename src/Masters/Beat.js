import { useState, useEffect } from "react";
import Layout from "../layout";
import { TextField, Box, Typography, Button } from "@mui/material";
import api from "../services/api";
import { useSnackbar } from "notistack";

export default function Beat() {
    const [beatName, setBeatName] = useState(null);
    const [beatError, setBeatError] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const handleAddBeat = async () => {
        try {
            setBeatError(false);
            if (!beatName) {
                setBeatError(true);
                return;
            }

            let response = await api.post("/addBeat", {
                newBeat: beatName
            });
            enqueueSnackbar(response.data.message, {
                variant: 'success',
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            });
        } catch (err) {
            console.log("addBeat error", err);
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
                    Add Beat
                </Typography>
                <Box sx={{ p: 3 }}>
                    <TextField
                        label="Beat Name"
                        onChange={(e) => setBeatName(e.target.value)}
                        size="small"
                        error={!!beatError}
                        helperText={beatError ? "Beat Name is Required" : ""}
                    />
                    <Button
                        sx={{ ml: 3 }}
                        variant="contained"
                        onClick={() => handleAddBeat()}
                    >
                        Add
                    </Button>
                </Box>
            </Box>
        </Layout>
    );
}