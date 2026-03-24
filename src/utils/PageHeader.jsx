import { Box, Typography } from '@mui/material'
import React from 'react'
import { AiFillDashboard } from "react-icons/ai";
import { FaChevronRight, FaPencilAlt, FaTrash } from "react-icons/fa";
 
const style = {
    color: "#026CB6",
    fontSize: "21px",
    fontWeight: 500
}
 
const boxStyle = {
    display: "flex", justifyContent: "space-between", margin: 2, flexWrap: "wrap"
}
 
const PageHeader = ({ title }) => {
    return (
        <div>
            <Box sx={boxStyle}>
                <Box>
                    <Typography sx={style}>{title}</Typography>
                </Box>
                <Box sx={{ pl: 3, pt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AiFillDashboard style={{ color: '#3c8dbc', fontSize: '14px' }} />
                    <Typography sx={{ color: '#3c8dbc', fontSize: '0.85rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        Home
                    </Typography>
                    <FaChevronRight style={{ color: '#bbb', fontSize: '11px' }} />
                    <Typography sx={{ color: '#3c8dbc', fontSize: '0.85rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        Masters
                    </Typography>
                    <FaChevronRight style={{ color: '#bbb', fontSize: '11px' }} />
                    <Typography sx={{ color: '#777', fontSize: '0.85rem' }}>
                        Add
                    </Typography>
                </Box>
            </Box>
        </div>
    )
}
 
export default PageHeader