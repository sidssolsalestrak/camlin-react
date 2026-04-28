import React, { useState } from 'react'
import Layout from '../layout'
import { Box } from '@mui/material'
import CircularProgress from '../utils/CircularProgressLoading';
import { AiOutlineFileExcel } from 'react-icons/ai';
import { useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { DownloadCSV } from '../utils/Download CSV/DownloadCSV';
import axios from "../services/api";
import useToast from '../utils/useToast';

const headContainer = {
    backgroundColor: 'white', display: "flex", flexDirection: 'column', gap: 2,
    m: 2, p: 2, borderRadius: '6px',
    minHeight: '20vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' }
}

const StockAndSalesSummary = () => {
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const [progress, setProgress] = useState(null);
    const [year, setYear] = useState(dayjs());
    const showAlert = useToast();

    /*----------------- handle download xl --------*/
    const handleDownloadExcel = async () => {
        try {
            let tableData = [];
            setProgress("0%");
            try {
                const payload = { year: year ? dayjs(year).format("YYYY") : "" };
                const res = await axios.post("/stk_sales_summary_excel", payload);
                if (res?.data?.status === 200) tableData = res?.data?.data ?? [];
            } catch (err) {
                console.warn("API unavailable:", err.message);
            }

            const selectedYear = dayjs(year).format("YYYY");
            const currentYear = dayjs().format("YYYY");
            const totalMonths = selectedYear === currentYear ? dayjs().month() + 1 : 12;
            const endMonth = selectedYear === currentYear ? dayjs().format("MMM") : "Dec";

            const API_MONTH_SUFFIX = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12"];

            const months = Array.from({ length: totalMonths }, (_, i) =>
                dayjs(year).month(i).format("MMM YYYY")
            );

            //Fixed columns matching API field names
            const fixedColumns = [
                { field: "zone_name", headerName: "Zone" },
                { field: "reg_name", headerName: "Region" },
                { field: "rsm_name", headerName: "RSM" },
                { field: "zbm_name", headerName: "ZBM" },
                { field: "am_name", headerName: "AM" },
                { field: "stk_code", headerName: "Distributor Code" },
                { field: "stk_name", headerName: "Distributor Name" },
                { field: "city_name", headerName: "City" },
                { field: "state_name", headerName: "State" },
            ];

            //Each subcol expands to Qty + Value Rs pair
            const subCols = [
                { qtyField: "open_qty", valField: "open_val", headerName: "Opening" },
                { qtyField: "pur_qty", valField: "pur_val", headerName: "Pri.Sales" },
                { qtyField: "tot_qty", valField: "tot_val", headerName: "Total" },
                { qtyField: "sec_qty", valField: "sec_val", headerName: "Sec.Sales" },
                { qtyField: "physical_qty", valField: "cls_val", headerName: "Closing" },
            ];

            const monthColumns = months.flatMap((_, mIdx) => {
                const suffix = API_MONTH_SUFFIX[mIdx];
                return [
                    ...subCols.flatMap(sub => [
                        { field: `${sub.qtyField}${suffix}`, headerName: "Qty" },
                        { field: `${sub.valField}${suffix}`, headerName: "Value Rs" },
                    ]),
                    { field: "", headerName: "" }, // spacer between months
                ];
            });

            const columns = [
                ...fixedColumns,
                ...monthColumns
            ];

            const meta = {
                centered: true,
                title: "DISTRIBUTOR STOCK AND SALES SUMMARY EXTRACT",
                dateRange: `(Jan-${endMonth} ${selectedYear})`,
                monthHeaders: months,
                fixedColCount: fixedColumns.length,
                subColCount: subCols.length * 2 + 1,
                subColHeaders: subCols.map(s => s.headerName),
            };

            DownloadCSV(
                tableData,
                columns,
                `Stock_&_Sales_Summary_${selectedYear}`,
                setProgress,
                enqueueSnackbar,
                meta,
            );
        } catch (error) {
            showAlert.error("Failed to Download")
            setProgress(null);
        } finally {
            setProgress(null);
        }
    };

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Extract", path: location.pathname },
            { label: "Stock & Sales Summary" },
        ]}>
            <Box sx={headContainer}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <Box>
                        <h1 className="mainTitle">Stock & Sales Summary</h1>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Year"
                            views={["year"]}
                            value={year}
                            onChange={(newValue) => setYear(newValue)}
                            slotProps={{ textField: { size: "small", sx: { maxWidth: 150 } } }}
                        />
                    </LocalizationProvider>
                    {progress ? <CircularProgress progress={progress} /> :
                        <span onClick={handleDownloadExcel}>
                            <AiOutlineFileExcel style={{ color: "green", cursor: "pointer", height: "30px", width: "30px" }} />
                        </span>}
                </Box>
            </Box>
        </Layout>
    )
}

export default StockAndSalesSummary;