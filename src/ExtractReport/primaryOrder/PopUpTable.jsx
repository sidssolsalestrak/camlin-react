import React, { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { Box, Slide, Typography } from '@mui/material'
import CloseIcon from "@mui/icons-material/Close";
import DataTable from '../../utils/dataTable'
import axios from "../../services/api";
import { useEffect } from 'react'

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});

const mainTitle = { fontWeight: "bold", fontSize: "14px" }
const subTitle = { fontSize: "14px", color: "#212121" }


const PopUpTable = ({ open, setOpen, rowData }) => {
    const [tableData, settableData] = useState([]);
    const [loading, setloading] = useState(false);

    //fetch data
    const fetchTableData = async () => {
        try {
            setloading(true)
            const res = await axios.post("/getPrimaryOrderBreakup", { ord_id: rowData?.ord_id })
            let data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            settableData(data)
        } catch (error) {
            console.error(error);
            settableData([])
        } finally {
            setloading(false)
        }
    }

    useEffect(() => {
        if (!open) return;
        fetchTableData()
    }, [open])

    const columns = [
        {
            field: "prod_code",
            headerName: "CODE",
            filterable: true,
        },
        {
            field: "prod_name",
            headerName: "NAME",
            filterable: true,
        },
        {
            field: "prod_price",
            headerName: "Stockist Price (PTS)",
            filterable: true,
            type: "alignCenter"
        },
        {
            field: "prod_qty",
            headerName: "Qty",
            filterable: true,
            showTotal: true,
            type: "alignCenter"
        },
        {
            field: "prod_val",
            headerName: "Total Value",
            filterable: true,
            showTotal: true,
            type: "alignCenter"
        },
    ]

    return (
        <div>
            <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="popUp"
                slots={{ transition: Transition }}
                keepMounted
                sx={{
                    "& .MuiDialog-container": {
                        alignItems: "flex-start",
                        marginTop: "20px",
                    },
                    "& .MuiDialog-paper": {
                        maxWidth: "700px",
                        width: "100%",
                    },
                }}>
                <DialogTitle
                    id="popUp"
                    sx={{
                        borderBottom: "1px solid #e2e2e2",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.5
                    }}
                >
                    <Typography
                        sx={{ color: "#343a40", fontSize: "16px", fontWeight: "400" }}
                    >
                        Order Product Breakup
                    </Typography>
                    <span
                        onClick={() => setOpen(false)}
                        style={{ color: "#6c757d", cursor: "pointer" }}
                    >
                        <CloseIcon />
                    </span>
                </DialogTitle>
                <DialogContent sx={{ padding: 0 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1, ml: 1.5 }}>
                        <Box>
                            <span style={mainTitle}>Order No:</span>
                            <span style={subTitle}>{" "}#{rowData?.ord_id || null}</span>
                        </Box>
                        <Box>
                            <span style={mainTitle}>Date:</span>
                            <span style={subTitle}>{" "}{rowData?.ord_date || null}</span>
                        </Box>
                        <Box>
                            <span style={mainTitle}>User:</span>
                            <span style={subTitle}>{" "}{rowData?.user_name || null}</span>
                        </Box>
                        <Box>
                            <span style={mainTitle}>Distributor:</span>
                            <span style={subTitle}>{" "}{rowData?.stk_code} - {rowData?.stk_name}</span>
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", mt: 0.5, mb: 0.5 }}>
                        <DataTable
                            data={tableData}
                            columns={columns}
                            loading={loading}
                            grandTotal={false}
                            pagination={false}
                            showHeader={false}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default PopUpTable;