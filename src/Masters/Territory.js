import { useState, useEffect } from "react";
import Layout from "../layout";
import { TextField, Box, Typography, Button } from "@mui/material";
import api from "../services/api";
import { useSnackbar } from "notistack";
import PageHeader from "../utils/PageHeader";
import { useNavigate,useParams } from "react-router-dom";

export default function Territory() {
       const { editTeritoryId }=useParams()
       const navigate=useNavigate()
    
       return(
        <Layout>
        <PageHeader title="Territory" />
        <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: {lg:'60%',md:'80%',sm:'90%',xs:'90%'} }}>
        </Box>
        
        </Layout>
       )
}