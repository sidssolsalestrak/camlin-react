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

const StockAndSalesDetails = () => {
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [progress, setProgress] = useState(null);
  const [fromDate, setFromDate] = useState(dayjs().subtract(2, "month").startOf("month"));
  const [toDate, settoDate] = useState(dayjs().endOf("month"));
  const showAlert = useToast();

  /*----------------- handle download xl --------*/
  const handleDownloadExcel = async () => {
    try {
      if (toDate.diff(fromDate, 'month', true) > 3) {
        enqueueSnackbar("From and To date must be within a 3-month range.", { variant: "error" });
        return;
      }

      let tableData = [];
      setProgress("0%");
      try {
        const payload = {
          startDate: fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : "",
          endDate: toDate ? dayjs(toDate).format("YYYY-MM-DD") : ""
        };
        const res = await axios.post("/stk_sales_details_excel", payload);
        if (res?.data?.status === 200) {
          tableData = res?.data?.data ?? [];
        }
      } catch (err) {
        // API not ready yet — proceed with empty data so file still downloads
        console.warn("API unavailable, downloading with no data:", err.message);
      }

      const meta = {
        centered: true,
        title: "DISTRIBUTOR STOCK AND SALES DETAIL EXTRACT",
        dateRange: `(${fromDate.format("DD MMM YYYY")} - ${toDate.format("DD MMM YYYY")})`,
      };

      const columns = [
        { field: "sale_month", headerName: "Month", type: "date" },
        { field: "zone_name", headerName: "Zone" },
        { field: "reg_name", headerName: "Region" },
        { field: "stk_code", headerName: "Distributor Code" },
        { field: "stk_name", headerName: "Distributor Name" },
        { field: "city_name", headerName: "City" },
        { field: "state_name", headerName: "State" },
        { field: "cat_name", headerName: "Category" },
        { field: "sub_name", headerName: "Range" },
        { field: "code", headerName: "SKU Code" },
        { field: "prod_name", headerName: "SKU Name" },
        { field: "prod_price", headerName: "SKU Rate" },
        { field: "open_qty", headerName: "Opening Qty" },
        { field: "open_val", headerName: "Opening Value" },
        { field: "pur_qty", headerName: "Pri. Qty" },
        { field: "pur_val", headerName: "Pri. Value" },
        { field: "tot_qty", headerName: "Total" },
        { field: "sec_qty", headerName: "Secondary Qty" },
        { field: "sec_val", headerName: "Secondary Value" },
        { field: "physical_qty", headerName: "Closing Qty" },
        { field: "cls_val", headerName: "Closing Stock Value" },
      ]

      DownloadCSV(
        tableData,
        columns,
        `Stock_Sales_Details ${fromDate.format("DD MMM YYYY")}-${toDate.format("DD MMM YYYY")}`,
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
      { label: "Stock & Sales Details" },
    ]}>
      <Box sx={headContainer}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <Box>
            <h1 className="mainTitle">Stock & Sales Details</h1>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="From Date"
              format="MMM YYYY"
              views={["month", "year"]}
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              maxDate={toDate ? toDate : null}
              slotProps={{ textField: { size: "small", sx: { maxWidth: 150 } } }}
            />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="To Date"
              format="MMM YYYY"
              views={["month", "year"]}
              value={toDate}
              onChange={(newValue) => settoDate(newValue)}
              slotProps={{ textField: { size: "small", sx: { maxWidth: 150 } } }}
              minDate={fromDate ? fromDate : null}
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

export default StockAndSalesDetails