import { Box, Typography, Breadcrumbs, Link } from '@mui/material'
import React from 'react'
import { AiFillDashboard } from "react-icons/ai";
import { FaChevronRight, FaPencilAlt, FaTrash } from "react-icons/fa";

const style = {
    color: "#026CB6",
    fontSize: "21px",
    fontWeight: 500
}


const PageHeader = ({ title,url }) => {
    return (
        <div>
            <Box sx={{mt:1.5,ml:3}}>
                 <Breadcrumbs aria-label="breadcrumb"
                 sx={{ p: 0, m: 0, '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
                 >
                    <Link sx={{p:0}} underline="hover" color="inherit" href="/">
                        Home
                    </Link>
                    <Link
                        underline="hover"
                        color="inherit"
                        href={url}
                        sx={{cursor:'pointer'}}
                    >
                        Masters
                    </Link>
                    <Typography sx={{ color: 'text.primary' }}>{title}</Typography>
                </Breadcrumbs>
                <Box sx={{mt:1}}>
                    <Typography sx={style}>{title}</Typography>
                </Box>
            </Box>
        </div>
    )
}

export default PageHeader