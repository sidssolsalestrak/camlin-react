import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import Layout from "../../layout";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Divider,
  Typography,
  IconButton,
  Checkbox,
  Tooltip,
  Paper,
  Chip,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Backdrop,
  CircularProgress,
  Switch,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import { FaTrashAlt } from "react-icons/fa";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import UploadIcon from "@mui/icons-material/Upload";
import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { InputAdornment } from "@mui/material";
import { useParams } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import api from "../../services/api";
import ConfirmationDialog from "../../utils/confirmDialog";
import { FaThumbsUp } from "react-icons/fa6";
import { MdBlockFlipped } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { FaFile } from "react-icons/fa";
import FilePreviewModal from "./FilePreviewModal";
import useToast from "../../utils/useToast";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { getMasterPanel } from "../../services/masterPanelService";

function UploadClosing() {
  const {
    defEncode,
    enMonth,
    endistributor,
    enProcessStat,
    enProcessDataStat,
  } = useParams();

  const safeDecode = (val) => {
    try {
      if (!val || val === "undefined" || val === "null") return null;
      return atob(val);
    } catch {
      return null;
    }
  };

  const checking = Number(safeDecode(defEncode) ?? 0);
  const decodedMnt = safeDecode(enMonth);
  const decodedStkId = safeDecode(endistributor);
  const decodedProcStat = safeDecode(enProcessStat);
  const decodedBtnVal = safeDecode(enProcessDataStat);
  const toast = useToast();

  const [masterPanel, setMasterPanel] = useState({});

  useEffect(() => {
    const loadMasterPanel = async () => {
      const data = await getMasterPanel();
      setMasterPanel(data);
    };
    loadMasterPanel();
  }, []);

  const [selMonth, setSelMonth] = useState(() => {
    if (decodedMnt) {
      const parsed = dayjs(decodedMnt, "MMM YYYY");
      return parsed.isValid() ? parsed : dayjs();
    }
    return dayjs();
  });

  const [allDesname, setAllDesName] = useState([]);

  const [selDesName, setSelDesName] = useState(() => {
    if ((Number(checking) === 1 || Number(checking === 2)) && decodedStkId) {
      return decodedStkId;
    }
    return "0";
  });

  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [masId, setMasId] = useState(null);
  const [jsonName, setJsonName] = useState(null);
  const [docType, setDocType] = useState(1);
  const [processStat, setProcessStat] = useState(null);
  const [activeFilter, setActiveFilter] = useState("total");
  const [search, setSearch] = useState("");
  const [dltChecked, setDltChecked] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [mapModal, setMapModal] = useState({
    open: false,
    row: null,
    suggestions: [],
  });
  const [mapRadio, setMapRadio] = useState(null);
  const [mapAutoResults, setMapAutoResults] = useState([]);
  const [mapAutoSelected, setMapAutoSelected] = useState(null);
  const [finalConfirmText, setFinalConfirmText] = useState("");
  const [btnVal, setBtnVal] = useState(Number(decodedBtnVal ?? 0));
  const [manualMode, setManualMode] = useState(false);
  const mapDebounce = useRef(null);
  const location = useLocation();
  const [files, setFiles] = useState([]);
  const [inputCount, setInputCount] = useState(1);
  const inputRefs = useRef([]);
  const MAX_FILE_INPUTS = 9;
  const [mapModalLoading, setMapModalLoading] = useState(false);
  const [mapConfirmOpen, setMapConfirmOpen] = useState(false);
  const [pendingMapRow, setPendingMapRow] = useState(null);
  const [mapActionRowKey, setMapActionRowKey] = useState(null);
  const [rawInvalidCell, setRawInvalidCell] = useState(null);

  const [mapConfirm, setMapConfirm] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "OK",
    cancelText: "Cancel",
    confirmColor: "primary",
  });

  const closeMapConfirm = () =>
    setMapConfirm((c) => ({
      ...c,
      open: false,
      onConfirm: null,
    }));

  const rowKeyCounter = useRef(0);
  const tagWithRowKeys = useCallback((rows) => {
    return (rows || []).map((r) => ({
      ...r,
      _rowKey: `row_${rowKeyCounter.current++}`,
    }));
  }, []);

  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmColor: "primary",
  });

  const closeConfirm = () =>
    setConfirm((c) => ({
      ...c,
      open: false,
      onConfirm: null,
    }));

  const [tglVal, setTglVal] = useState(1);

  const [imgData, setImgData] = useState([]);
  const [fileType, setFileType] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const [rawPages, setRawPages] = useState([]);
  const [rawPageIndex, setRawPageIndex] = useState(0);

  const territory = useMemo(() => {
    const parts = selDesName.split("|");
    return parts[3] || "";
  }, [selDesName]);

  const MAP_COLORS = {
    mapped: "#16a34a",
    semi: "#f97316",
    unmapped: "#dc2626",
    invalid: "#6c5dc5",
  };

  const MapDot = ({ row }) => {
    const color =
      row.prod_map_stat === 1
        ? row.pn
          ? MAP_COLORS.semi
          : MAP_COLORS.unmapped
        : row.qty_map_stat === 1
          ? MAP_COLORS.invalid
          : MAP_COLORS.mapped;
    return (
      <Box
        component="span"
        sx={{
          width: 9,
          height: 9,
          borderRadius: "2px",
          background: color,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
    );
  };

  const counts = useMemo(() => {
    let mapped = 0,
      semi = 0,
      unmapped = 0,
      invalid = 0,
      totalQty = 0;
    tableData.forEach((r) => {
      if (r.prod_map_stat === 1 && !r.pn) unmapped++;
      if (r.prod_map_stat === 1 && r.pn) semi++;
      if (r.qty_map_stat === 1) invalid++;
      if (r.prod_map_stat !== 1) mapped++;
      totalQty += Number(r.prod_qty) || 0;
    });
    return {
      mapped,
      semi,
      unmapped,
      invalid,
      total: tableData.length,
      totalQty,
    };
  }, [tableData]);

  const availableCategories = useMemo(() => {
    const cats = new Set();
    tableData.forEach((r) => {
      if (r.cat_name) cats.add(r.cat_name);
    });
    return Array.from(cats).sort();
  }, [tableData]);

  const [selCategory, setSelCategory] = useState("all");

  const canConfirm =
    counts.unmapped === 0 &&
    counts.semi === 0 &&
    counts.invalid === 0 &&
    tableData.length > 0;

  const parseMonth = (d) => (d ? d.format("YYYY-MM-01") : "");

  const getPreviewMeta = (type) => {
    if (type === 2) return { Icon: PictureAsPdfIcon, color: "#ca0909" };
    if (type === 3) return { Icon: TableChartIcon, color: "#13a113" };
    if (type === 1) return { Icon: ImageIcon, color: "#13a113" };
    return { Icon: InsertDriveFileIcon, color: "#13a113" };
  };

  const { color: previewTriggerColor } = getPreviewMeta(fileType);

  const enterRawMappingMode = useCallback((data) => {
    setRawInvalidCell(null);
    const formatType = data.format_type;
    const tdStart = data.file_type === 1 ? 2 : 1;

    const pages = (data.result || []).map((page) => {
      if (formatType === 1) {
        let headerRowIdx = 0;
        for (let l = 0; l < page.length; l++) {
          if (page[l] && page[l][0] === "Range") {
            headerRowIdx = 1;
            break;
          }
        }
        const colCount = Math.min(4, (page[0] || []).length);
        const headers = Array.from(
          { length: colCount },
          (_, i) => page[headerRowIdx]?.[i] ?? "",
        );
        const rows = [];
        for (let j = 2; j < page.length; j++) {
          const r = page[j];
          if (!r || r[0] === "Range") continue;
          for (let k = 0; k < r.length; k += colCount) {
            rows.push(r.slice(k, k + colCount));
          }
        }
        return { headers, rows, mapping: {} };
      }

      const headers = (page[0] || []).map((h) => h ?? "");
      const rows = [];
      for (let j = tdStart; j < page.length; j++) {
        if (page[j]) rows.push(page[j]);
      }
      return { headers, rows, mapping: {} };
    });

    setRawPages(pages);
    setRawPageIndex(0);
  }, []);

  const handleApiResponse = useCallback(
    (data) => {
      if (!data) return;
      setMasId(data.mas_id ?? null);
      setJsonName(data.json_name ?? null);
      setDocType(data.doc_type ?? 1);
      setProcessStat(data.process_stat ?? null);
      setImgData(Array.isArray(data.img_data) ? data.img_data : []);
      setFileType(data.file_type ?? null);
      setBtnVal(Number(data.btn_val ?? decodedBtnVal ?? 0));
      setPreviewFile(null);
      setDltChecked({});
      setSelectAll(false);
      setSelCategory("all");

      if (data.result) {
        setTableData([]);
        enterRawMappingMode(data);
        return;
      }

      setRawPages([]);
      const rows = data.all_data || data.pre_data || data.all_prod || [];
      setTableData(tagWithRowKeys(rows));
    },
    [enterRawMappingMode, tagWithRowKeys, decodedBtnVal],
  );

  const validateQuantities = (rows) => {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i]._isGrandTotal) continue;
      const raw = rows[i].prod_qty;
      const isValid = /^\d+$/.test(String(raw ?? "").trim());
      if (!isValid) {
        toast.error(`Invalid number in row ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.post("/getDesname");
        setAllDesName(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        console.error("fetchDesname:", err);
      }
    })();
  }, []);

  const loadDesListData = useCallback(async () => {
    const desId = selDesName.split("|")[0];
    if (!desId || desId === "0") return;
    setLoading(true);
    try {
      const res = await api.post("/getDesList", {
        des_name_id: desId,
        selected_mnt: parseMonth(selMonth),
        pro_status: decodedProcStat ?? 0,
        btn_val: decodedBtnVal ?? 0,
        tgl_val: tglVal,
      });
      setManualMode(false);
      handleApiResponse(res.data);
    } catch (err) {
      console.error("fetchDesList:", err);
    } finally {
      setLoading(false);
    }
  }, [
    selDesName,
    selMonth,
    handleApiResponse,
    decodedProcStat,
    decodedBtnVal,
    tglVal,
  ]);

  useEffect(() => {
    if (selDesName && selDesName !== "0") loadDesListData();
  }, [selDesName, selMonth, tglVal]);

  const handleFileChange = (e, slotIndex) => {
    if (!selDesName || selDesName === "0") {
      toast.error(`Please select a ${masterPanel["STKS"] || "Distributor"} first.`);
      e.target.value = "";
      return;
    }
    const incoming = e.target.files?.[0];
    if (!incoming) return;
    const isDuplicate = files.some(
      (f, i) => i !== slotIndex && f?.name === incoming.name,
    );
    if (isDuplicate) {
      toast.error(`File "${incoming.name}" is already added.`);
      e.target.value = "";
      return;
    }
    setFiles((prev) => {
      const next = [...prev];
      next[slotIndex] = incoming;
      return next;
    });
  };

  const handleRemoveFile = (slotIndex) => {
    setFiles((prev) => prev.filter((_, i) => i !== slotIndex));
    const ref = inputRefs.current[slotIndex];
    if (ref) ref.value = "";
  };

  const handleAddMore = () => {
    for (let i = 1; i < inputCount; i++) {
      const ref = inputRefs.current[i];
      if (ref && ref.files.length === 0) {
        toast.error(
          "Please select a file for all previous inputs before adding more.",
        );
        return;
      }
    }
    if (inputCount >= MAX_FILE_INPUTS) {
      toast.error("Maximum file input count reached (9).");
      return;
    }
    setInputCount((c) => c + 1);
  };

  const handleImport = async () => {
    if (!selDesName || selDesName === "0") {
      toast.error(`Please select a ${masterPanel["STKS"] || "Distributor"}.`);
      return;
    }
    if (files.length === 0) {
      toast.error("Please select a file to import.");
      return;
    }
    const [desId, desName, desCode] = selDesName.split("|");
    const form = new FormData();
    files.forEach((f) => {
      const ext = f.name.split(".").pop().toLowerCase();
      form.append(
        ["xlsx", "xls"].includes(ext) ? "uploadFile" : "uploadFile[]",
        f,
      );
    });
    form.append("des_id", desId);
    form.append("des_name", desName);
    form.append("des_code", desCode);
    form.append("selected_mnt", parseMonth(selMonth));
    setLoading(true);
    try {
      const res = await api.post("/upload_to_s3", form);
      setManualMode(false);
      setFiles([]);

      if (res.data.result) {
        // raw OCR pending — column-mapping mode, use payload directly
        handleApiResponse(res.data);
      } else {
        // OCR + mapping already done server-side — re-fetch the
        // canonical table view from getDesList (same as every other refresh)
        await loadDesListData();
      }
    } catch (err) {
      console.error("import:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = async (overrideTglVal) => {
    const desId = selDesName.split("|")[0];
    if (!desId || desId === "0") {
      toast.error(`Please select a ${masterPanel["STKS"] || "Distributor"}.`);
      return;
    }
    const tglToSend = overrideTglVal !== undefined ? overrideTglVal : 0;
    setLoading(true);
    if (overrideTglVal === undefined) setTglVal(0);
    try {
      const res = await api.post("/add_manual", {
        des_name_id: desId,
        selected_mnt: parseMonth(selMonth),
        add_tgl_val: tglToSend,
      });
      setManualMode(true);
      handleApiResponse(res.data);
    } catch (err) {
      console.error("addManual:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAllProducts = (e) => {
    const newVal = e.target.checked ? 1 : 0;
    setTglVal(newVal);
    if (manualMode) {
      handleAddManual(newVal);
    }
  };

  const handleRawMappingChange = (pageIdx, colIdx, value) => {
    setRawPages((prev) =>
      prev.map((page, pIdx) => {
        if (pIdx !== pageIdx) return page;
        const mapping = { ...page.mapping };
        if (!value) {
          delete mapping[colIdx];
        } else {
          Object.keys(mapping).forEach((k) => {
            if (mapping[k] === value) delete mapping[k];
          });
          mapping[colIdx] = value;
        }
        return { ...page, mapping };
      }),
    );
  };

  const handleRawCellChange = (pageIdx, rowIdx, colIdx, value) => {
    setRawPages((prev) =>
      prev.map((page, pIdx) => {
        if (pIdx !== pageIdx) return page;
        const rows = page.rows.map((r, rIdx) =>
          rIdx !== rowIdx
            ? r
            : r.map((c, cIdx) => (cIdx === colIdx ? value : c)),
        );
        return { ...page, rows };
      }),
    );

    // clear the error once the user fixes that exact cell
    setRawInvalidCell((prev) =>
      prev &&
      prev.pageIdx === pageIdx &&
      prev.rowIdx === rowIdx &&
      prev.colIdx === colIdx
        ? null
        : prev,
    );
  };

  const buildRawColumns = (page, pageIdx) => {
    const columns = [
      {
        field: "_sl",
        headerName: "#",
        width: 40,
        align: "center",
        sortable: false,
        renderCell: ({ row }) => (
          <Typography variant="caption" color="text.secondary">
            {row._sl}
          </Typography>
        ),
      },
    ];

    page.headers.forEach((label, colIdx) => {
      columns.push({
        field: `col_${colIdx}`,
        headerName: label || `Column ${colIdx + 1}`,
        sortable: false,
        renderHeader: () => (
          <Select
            size="small"
            fullWidth
            value={page.mapping[colIdx] || "_original"}
            onChange={(e) => {
              const v = e.target.value;
              handleRawMappingChange(
                pageIdx,
                colIdx,
                v === "_original" ? null : v,
              );
            }}
            sx={{
              fontSize: 12,
              background: "#fff",
              "& .MuiSelect-select": { py: "4px" },
            }}
          >
            <MenuItem value="_original" sx={{ fontSize: 12 }}>
              {label || `Column ${colIdx + 1}`}
            </MenuItem>
            <MenuItem value="code" sx={{ fontSize: 12 }}>
              Code
            </MenuItem>
            <MenuItem value="product_name" sx={{ fontSize: 12 }}>
              {masterPanel["PROD"] || "Product"} Name
            </MenuItem>
            <MenuItem value="closing_qty" sx={{ fontSize: 12 }}>
              Closing Qty
            </MenuItem>
          </Select>
        ),
        renderCell: ({ row }) => {
          const isInvalid =
            rawInvalidCell &&
            rawInvalidCell.pageIdx === pageIdx &&
            rawInvalidCell.rowIdx === row._rowIdx &&
            rawInvalidCell.colIdx === colIdx;

          return (
            <TextField
              size="small"
              fullWidth
              value={row.cells[colIdx] ?? ""}
              onChange={(e) =>
                handleRawCellChange(
                  pageIdx,
                  row._rowIdx,
                  colIdx,
                  e.target.value,
                )
              }
              error={!!isInvalid}
              inputProps={{ style: { fontSize: 12 } }}
              sx={
                isInvalid
                  ? {
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#fdecea",
                        "& fieldset": { borderColor: "error.main" },
                      },
                    }
                  : undefined
              }
            />
          );
        },
      });
    });

    return columns;
  };

  const rawRowsForTable = (page) =>
    page.rows.map((cells, idx) => ({
      id: idx,
      _rowIdx: idx,
      _sl: idx + 1,
      cells,
    }));

  const handleRawSubmit = () => {
    setRawInvalidCell(null);

    for (let p = 0; p < rawPages.length; p++) {
      const mapped = Object.values(rawPages[p].mapping);
      if (!mapped.includes("product_name")) {
        toast.error(`Please select ${masterPanel["PROD"] || "Product"} Name in page ${p + 1}`);
        return;
      }
      if (!mapped.includes("closing_qty")) {
        toast.error(`Please select Closing Qty in page ${p + 1}`);
        return;
      }
    }

    const qtyRegex = /^\d+$/; // digits only — no letters, no dots, no symbols
    const allValues = [];
    const totPage = [];

    for (let p = 0; p < rawPages.length; p++) {
      const page = rawPages[p];
      const productIdx = Number(
        Object.keys(page.mapping).find(
          (k) => page.mapping[k] === "product_name",
        ),
      );
      const qtyIdx = Number(
        Object.keys(page.mapping).find(
          (k) => page.mapping[k] === "closing_qty",
        ),
      );
      const codeKey = Object.keys(page.mapping).find(
        (k) => page.mapping[k] === "code",
      );

      for (let r = 0; r < page.rows.length; r++) {
        const cells = page.rows[r];
        if (!cells.some((c) => c !== "" && c != null)) continue;

        const qty = String(cells[qtyIdx] ?? "").trim();

        if (qty !== "" && !qtyRegex.test(qty)) {
          setRawPageIndex(p); // jump to the page containing the error
          setRawInvalidCell({ pageIdx: p, rowIdx: r, colIdx: qtyIdx });
          toast.error(
            `Invalid Closing Qty in row ${r + 1} of page ${p + 1} — only numbers are allowed`,
          );
          return;
        }

        allValues.push({
          page_num: p + 1,
          product_name: cells[productIdx],
          prod_code: codeKey !== undefined ? cells[Number(codeKey)] : "",
          closing_qty: qty,
        });
      }
      totPage.push(p + 1);
    }

    setConfirm({
      open: true,
      title: "Confirmation",
      message: "Are you sure you want to upload this data?",
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "primary",
      onConfirm: async () => {
        closeConfirm();
        const [desId, desName, desCode] = selDesName.split("|");
        setLoading(true);
        try {
          const res = await api.post("/upload_to_db", {
            des_id: desId,
            des_name: desName,
            des_code: desCode,
            selected_mnt: parseMonth(selMonth),
            allValues,
            tot_page: totPage,
          });
          setRawPages([]);
          setManualMode(false);
          if (res.data.status === 200) {
            toast.success(res.data.message);
          }
          handleApiResponse(res.data);
        } catch (err) {
          console.error("uploadToDb:", err);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleQtyChange = (rowKey, val) => {
    setTableData((prev) =>
      prev.map((r) =>
        r._rowKey === rowKey ? { ...r, prod_qty: val.replace(/\D/g, "") } : r,
      ),
    );
  };

  const handleManualQtyChange = (rowKey, val) => {
    setTableData((prev) =>
      prev.map((r) =>
        r._rowKey === rowKey ? { ...r, prod_qty: val.replace(/\D/g, "") } : r,
      ),
    );
  };

  const handleOpenMapModal = async (row) => {
    const words = row.prod_name?.split(" ") || [];

    setMapModal({
      open: true,
      row,
      suggestions: [],
    });

    setMapModalLoading(true);
    setMapRadio(null);
    setMapAutoResults([]);
    setMapAutoSelected(null);

    try {
      const r = await api.post("/related_val", { words });
      const suggestions = Array.isArray(r.data.data) ? r.data.data : [];

      setMapModal((prev) => ({
        ...prev,
        suggestions,
      }));
    } catch (err) {
      console.error("related_val error:", err);
      setMapModal((prev) => ({
        ...prev,
        suggestions: [],
      }));
    } finally {
      setMapModalLoading(false);
    }
  };

  const handleMapInputChange = (val) => {
    setMapAutoSelected(null);
    if (mapDebounce.current) clearTimeout(mapDebounce.current);
    if ((val || "").length < 2) {
      setMapAutoResults([]);
      return;
    }
    mapDebounce.current = setTimeout(async () => {
      try {
        const r = await api.post("/autocomplete_val", { q: val });
        setMapAutoResults(Array.isArray(r.data.data) ? r.data.data : []);
      } catch {
        setMapAutoResults([]);
      }
    }, 300);
  };

  const handleDoMap = async () => {
    const selected = mapRadio || mapAutoSelected;
    if (!selected || !pendingMapRow) return;

    const row = pendingMapRow;

    setMapActionRowKey(row._rowKey);

    try {
      const payload = {
        id: row.id,
        mas_id: row.mas_id,
        ...(mapRadio && {
          selected_id: mapRadio.id,
          selected_code: mapRadio.code,
          selected_name: mapRadio.name,
        }),
        ...(mapAutoSelected && {
          prodId: mapAutoSelected.id,
          selectedCode: mapAutoSelected.code,
          selectedName: mapAutoSelected.name,
        }),
      };

      const res = await api.post("/map_prod", payload);
      setTableData(tagWithRowKeys(res.data.pre_data || []));

      if (res.data.status === 200) {
        toast.success(res.data.message);
      }
    } catch (err) {
      console.error("doMap:", err);
      toast.error("something went wrong,Try again!");
    } finally {
      setMapActionRowKey(null);
      setPendingMapRow(null);
      setMapRadio(null);
      setMapAutoResults([]);
      setMapAutoSelected(null);
    }
  };

  const handleAskMapConfirm = () => {
    const selected = mapRadio || mapAutoSelected;
    if (!selected) {
      toast.error("Please select at least one option.");
      return;
    }

    const row = mapModal.row;
    if (!row) return;

    const selectedData = mapRadio
      ? {
          type: "radio",
          id: mapRadio.id,
          code: mapRadio.code,
          name: mapRadio.name,
        }
      : {
          type: "auto",
          id: mapAutoSelected.id,
          code: mapAutoSelected.code,
          name: mapAutoSelected.name,
        };

    setMapConfirm({
      open: true,
      title: "Confirmation",
      message: `Are you sure you want to map this ${masterPanel["PROD"] || "product"}?`,
      confirmText: "OK",
      cancelText: "Cancel",
      confirmColor: "primary",
      onConfirm: async () => {
        closeMapConfirm();
        await executeMapProduct(row, selectedData);
      },
    });
  };

  const executeMapProduct = async (row, selectedData) => {
    handleCloseMapModal();
    setMapActionRowKey(row._rowKey);

    try {
      const payload = {
        id: row.id,
        mas_id: row.mas_id,
        ...(selectedData.type === "radio" && {
          selected_id: selectedData.id,
          selected_code: selectedData.code,
          selected_name: selectedData.name,
        }),
        ...(selectedData.type === "auto" && {
          prodId: selectedData.id,
          selectedCode: selectedData.code,
          selectedName: selectedData.name,
        }),
      };

      const res = await api.post("/map_prod", payload);
      setTableData(tagWithRowKeys(res.data.pre_data || []));

      if (res.data.status === 200) {
        toast.success(res.data.message);
      }
    } catch (err) {
      console.error("doMap:", err);
      toast.error("something went wrong,Try again!");
    } finally {
      setMapActionRowKey(null);
    }
  };

  const renderRowSkeleton = (row) => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        width: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{ width: 9, height: 9, borderRadius: "2px", bgcolor: "grey.300" }}
        />
        <Box
          sx={{
            height: 12,
            width: "70%",
            borderRadius: 1,
            bgcolor: "grey.300",
          }}
        />
      </Box>
      <Box
        sx={{
          ml: 1.5,
          height: 10,
          width: "50%",
          borderRadius: 1,
          bgcolor: "grey.200",
        }}
      />
    </Box>
  );

  const TableSkeleton = ({ rows = 8 }) => (
    <Box>
      {/* header/legend bar skeleton */}
      <Box
        sx={{
          p: "10px 14px",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {[70, 90, 80, 90, 60].map((w, i) => (
          <Box
            key={i}
            sx={{
              height: 24,
              width: w,
              borderRadius: "16px",
              bgcolor: "grey.200",
            }}
          />
        ))}
      </Box>

      {/* row skeletons */}
      <Box sx={{ p: "10px 14px" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              py: 1.2,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                width: 20,
                height: 12,
                borderRadius: 1,
                bgcolor: "grey.200",
              }}
            />
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 0.6,
              }}
            >
              <Box
                sx={{
                  height: 12,
                  width: `${55 + ((i * 7) % 30)}%`,
                  borderRadius: 1,
                  bgcolor: "grey.300",
                }}
              />
              <Box
                sx={{
                  height: 9,
                  width: "35%",
                  borderRadius: 1,
                  bgcolor: "grey.200",
                }}
              />
            </Box>
            <Box
              sx={{
                width: 110,
                height: 34,
                borderRadius: 1,
                bgcolor: "grey.200",
              }}
            />
            <Box
              sx={{
                width: 60,
                height: 24,
                borderRadius: 1,
                bgcolor: "grey.200",
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );

  const handleDeleteRow = (row) => {
    setConfirm({
      open: true,
      title: "Confirmation",
      message: "Once deleted, you will not be able to recover this row?",
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "error",
      onConfirm: async () => {
        closeConfirm();
        try {
          let response = await api.post("/delete_single_prod", {
            rowId: row.id,
            mas_id: row.mas_id,
          });
          setTableData((prev) => prev.filter((r) => r._rowKey !== row._rowKey));
          if (response.data.status === 200) {
            toast.success(response.data.message);
          }
        } catch (err) {
          console.error(err);
          toast.error("something went wrong,Try again!");
        }
      },
    });
  };

  const handleDeleteSelected = () => {
    const keys = Object.keys(dltChecked).filter((k) => dltChecked[k]);
    if (!keys.length) {
      toast.error(`Please select at least one ${masterPanel["PROD"] || "product"}.`);
      return;
    }
    setConfirm({
      open: true,
      title: "Confirmation",
      message: `Are you sure you want to delete Selected ${masterPanel["PROD"] || "Product"}?`,
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "error",
      onConfirm: async () => {
        closeConfirm();
        try {
          const selectedRows = tableData.filter((r) =>
            keys.includes(r._rowKey),
          );
          const ids = selectedRows.map((r) => r.id);
          const masIds = selectedRows.map((r) => r.mas_id).filter(Boolean);
          let response = await api.post("/selected_dlt", {
            dlt_prod_id: ids,
            prod_mas_id: masIds,
          });
          setTableData((prev) => prev.filter((r) => !dltChecked[r._rowKey]));
          setDltChecked({});
          setSelectAll(false);
          if (response.data.status === 200) {
            toast.success(response.data.message);
          }
        } catch (err) {
          console.error(err);
          toast.error("something went wrong,Try again!");
        }
      },
    });
  };

  const handleAbort = () => {
    setConfirm({
      open: true,
      title: "Confirmation",
      message: "Are you sure you want to delete data?",
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          let response = await api.post("/delete_all", {
            mas_id: masId,
            json_name: jsonName,
          });
          setTableData([]);
          setMasId(null);
          setFiles([]);
          setImgData([]);
          setFileType(null);
          setPreviewFile(null);
          setRawPages([]);
          setManualMode(false);
          if (response.data.status === 200) {
            toast.success(response.data.message);
            window.location.reload();
          }
        } catch (err) {
          console.error(err);
          toast.error("something went wrong,Try again!");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const handleSave = () => {
    if (!validateQuantities(tableData)) return;
    setConfirm({
      open: true,
      title: "Confirmation",
      message: "Are you sure you want to Update?",
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "primary",
      onConfirm: async () => {
        closeConfirm();
        const allData = tableData.map((r) => ({
          product_id: r.id,
          prod_id: r.prod_id,
          mas_id: r.mas_id,
          prod_qty: r.prod_qty,
        }));
        const semiRows = tableData.filter((r) => r.prod_map_stat === 1 && r.pi);
        const suggIds = semiRows.map((r) => r.pi);
        const prodMasIds = semiRows.map((r) => r.mas_id);
        const prodIds = semiRows.map((r) => r.id);
        const prodCodes = semiRows.map((r) => r.pc);
        const prodName = semiRows.map((r) => r.pn);

        setLoading(true);
        try {
          let response = await api.post("/update_all", {
            allData,
            suggIds,
            prodMasIds,
            prodIds,
            prodCodes,
            prodName,
          });
          if (response.data.message) {
            toast.success(response.data.message);
          }
          await loadDesListData();
        } catch (err) {
          console.error(err);
          toast.error("Somthing went wrong,Try again!");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleManualInsert = () => {
    if (!validateQuantities(tableData)) return;
    setConfirm({
      open: true,
      title: "Confirmation",
      message: "Are you sure you want to Update?",
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "primary",
      onConfirm: async () => {
        const [desId, desName, desCode] = selDesName.split("|");
        const codeStr = tableData.map((r) => r.prod_code ?? "").join(",");
        const closStr = tableData.map((r) => r.prod_qty ?? 0).join(",");
        const hidProdIdStr = tableData.map((r) => r.prod_id ?? "").join(",");
        const hidProdNameStr = tableData
          .map((r) => r.prod_name ?? "")
          .join(",");

        setLoading(true);
        try {
          const res = await api.post("/insert_manual", {
            primary_mas_id: masId ?? 0,
            selected_mnt: parseMonth(selMonth),
            des_id: desId,
            des_name: desName,
            des_code: desCode,
            code: codeStr,
            clos: closStr,
            hidprod_id: hidProdIdStr,
            hidprod_name: hidProdNameStr,
          });
          if (res.data?.inserted_id) setMasId(res.data.inserted_id);
          setTglVal(1);
          if (res.data.inserted_id) {
            toast.success(res.data.message);
          }
          await loadDesListData();
        } catch (err) {
          console.error("insertManual:", err);
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const handleConfirm = () => {
    if (!validateQuantities(tableData)) return;
    const allData = tableData.map((r) => ({
      product_id: r.id,
      prod_id: r.prod_id,
      mas_id: r.mas_id,
      prod_name: r.prod_name,
      prod_code: r.prod_code,
      prod_qty: r.prod_qty,
    }));
    (async () => {
      try {
        const validRes = await api.post("/final_submit_validation", {
          allData,
        });
        let confirmationText = "";
        if (validRes.data.status === 500) {
          confirmationText = "Are you sure you want to submit?";
        } else {
          const repeated = validRes.data.data || [];
          confirmationText = (
            <>
              The following SKU has been Repeated for the Transaction:
              {(validRes.data.data || []).map((p, i) => (
                <div key={i}>
                  {p.prod_code} - {p.prod_name}
                </div>
              ))}
            </>
          );
        }
        setConfirm({
          open: true,
          title: "Confirmation",
          message: confirmationText,
          confirmText: "OK",
          cancelText: "Close",
          confirmColor: "primary",
          onConfirm: async () => {
            setLoading(true);
            try {
              const response = await api.post("/final_submit", { allData });
              if (response.data.status === 200) {
                toast.success(response.data.message);
              }
              await loadDesListData();
            } catch (err) {
              console.error(err);
              toast.error("something went wrong, Try again!");
            } finally {
              setLoading(false);
              closeConfirm();
            }
          },
        });
      } catch (err) {
        console.error(err);
        toast.error("something went wrong, Try again!");
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    const next = {};
    if (checked) {
      filteredRows.forEach((r) => {
        if (!r._isGrandTotal) next[r._rowKey] = true;
      });
    }
    setDltChecked(next);
  };

  const handleDltThisData = async () => {
    setConfirm({
      open: true,
      title: "Confirmation",
      message: "Are you sure you want to delete all?",
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "primary",
      onConfirm: async () => {
        try {
          let response = await api.post("/dlt_All", {
            mas_id: masId,
            json_name: jsonName,
          });
          if (response.data.status === 200) {
            toast.success(response.data.message);
          } else {
            toast.error("someThing went wrong,try again!");
          }
          window.location.reload();
        } catch (err) {
          console.log("Delete this Data btn err", err);
          toast.error("someThing went wrong,try again!");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  const handleCloseMapModal = () => {
    setMapModal({ open: false, row: null, suggestions: [] });
    setMapModalLoading(false);
    setMapRadio(null);
    setMapAutoResults([]);
    setMapAutoSelected(null);
  };

  const isApproved = Number(processStat) === 3 || Number(docType) === 2;
  const isRejected = Number(processStat) === 2;
  const canDelete = !isApproved;
  const isPending = processStat === 1;
  const isRawPending = processStat === 4;
  const canUpdateApproved = isApproved && Number(btnVal) !== 1;
  const canEditQty = Number(docType) === 1 || canUpdateApproved;
  const showTable = tableData.length > 0;
  const rawMode = rawPages.length > 0;
  const currentRawPage = rawPages[rawPageIndex] || null;
  const isLastRawPage = rawPageIndex === rawPages.length - 1;
  const hasExistingData = Boolean(masId);
  const showDistributorTerritory = selDesName !== "0";
  const hasPreviewFiles = imgData.length > 0;

  // ─── filteredRows: same as before ───────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = tableData;
    if (activeFilter === "mapped")
      rows = rows.filter((r) => r.prod_map_stat !== 1 && r.qty_map_stat !== 1);
    if (activeFilter === "semi")
      rows = rows.filter((r) => r.prod_map_stat === 1 && r.pn);
    if (activeFilter === "unmapped")
      rows = rows.filter((r) => r.prod_map_stat === 1 && !r.pn);
    if (activeFilter === "invalid")
      rows = rows.filter((r) => r.qty_map_stat === 1);
    if (selCategory !== "all")
      rows = rows.filter((r) => r.cat_name === selCategory);

    const numbered = rows.map((r, i) => ({ ...r, _sl: i + 1 }));

    if (isApproved && numbered.length > 0) {
      const grandTotal = numbered.reduce(
        (sum, r) => sum + (Number(r.prod_qty) || 0),
        0,
      );
      numbered.push({
        _rowKey: "__grand_total__",
        _sl: "",
        _isGrandTotal: true,
        prod_name: "Grand Total",
        prod_qty: grandTotal,
        prod_map_stat: 0,
        qty_map_stat: 0,
      });
    }

    return numbered;
  }, [tableData, activeFilter, isApproved, selCategory]);

  // ─── NEW: groupedRows — injects cat_name header rows when approved ────────
  const groupedRows = useMemo(() => {
    if (!isApproved && !manualMode) return filteredRows; // ✅ also group when manualMode

    const rows = [];
    let prevCat = null;

    filteredRows.forEach((row, idx) => {
      if (row._isGrandTotal) {
        rows.push(row);
        return;
      }

      const cat = row.cat_name || "Uncategorized";

      if (cat !== prevCat) {
        rows.push({
          _rowKey: `cat-header-${cat}-${idx}`,
          _rowType: "cat_header",
          cat_name: cat,
        });
        prevCat = cat;
      }

      rows.push({ ...row, _rowType: "data" });
    });

    return rows;
  }, [filteredRows, isApproved, manualMode]);

  // ─── NEW: rowStyle — grey background for category header rows ────────────
  const rowStyle = (row) => {
    if (row._rowType === "cat_header") {
      return {
        "& td": {
          backgroundColor: "#c0c0c0da !important",
          color: "#000000",
          fontWeight: 800,
          fontSize: "0.88rem",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        },
      };
    }
    return {};
  };

  const manualColumns = [
    {
      field: "_sl",
      headerName: "#",
      width: 40,
      align: "center",
      sortable: false,
      renderCell: ({ row }) => {
        if (row._rowType === "cat_header") return null; // ✅ hide for headers
        return (
          <Typography variant="caption" color="text.secondary">
            {row._sl}
          </Typography>
        );
      },
    },
    {
      field: "prod_name",
      headerName: `${masterPanel["PROD"] || "Product"} Name`,
      renderHeader: () => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {masterPanel["PROD"] || "Product"} Name
          </Typography>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.25, mr: 30 }}
          >
            <Typography
              variant="caption"
              fontWeight={500}
              sx={{ whiteSpace: "nowrap" }}
            >
              All {masterPanel["PROD"] || "Product"}s
            </Typography>
            <Switch
              size="small"
              checked={tglVal === 1}
              onChange={handleToggleAllProducts}
            />
            <Typography
              variant="caption"
              fontWeight={500}
              sx={{ whiteSpace: "nowrap" }}
            >
              with values
            </Typography>
          </Box>
        </Box>
      ),
      renderCell: ({ row }) => {
        if (row._rowType === "cat_header") {
          // ✅ category header row
          return <strong>{row.cat_name}</strong>;
        }
        if (row._isGrandTotal) {
          return (
            <Typography
              variant="body2"
              sx={{ fontSize: 12, fontWeight: 600, color: "text.primary" }}
            >
              {`GRAND TOTAL (Qty)`}
            </Typography>
          );
        }
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MapDot row={row} />
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              {row.cat_code_1} {row.prod_code ? `| ${row.prod_code}` : ""} |{" "}
              {row.prod_name}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "prod_qty",
      headerName: "Closing Qty",
      width: 180,
      headerAlign: "center",
      align: "center",
      renderCell: ({ row }) => {
        if (row._rowType === "cat_header") return null; // ✅ hide for headers
        if (row._isGrandTotal) {
          return (
            <Typography
              variant="body2"
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: "text.primary",
                textAlign: "center",
                width: "100%",
                ml: -2,
              }}
            >
              {row.prod_qty}
            </Typography>
          );
        }
        return (
          <TextField
            key={row._rowKey}
            size="small"
            value={row.prod_qty === 0 ? "" : (row.prod_qty ?? "")}
            onChange={(e) => handleManualQtyChange(row._rowKey, e.target.value)}
            inputProps={{
              style: { textAlign: "center", fontSize: 13 },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: 13,
                width: 110,
                mx: "auto",
              },
            }}
          />
        );
      },
    },
  ];
  const dtColumns = [
    {
      field: "_sl",
      headerName: "#",
      width: 40,
      align: "center",
      sortable: false,
      renderCell: ({ row }) => {
        // ✅ No serial number for category headers
        if (row._rowType === "cat_header") return null;
        return (
          <Typography variant="caption" color="text.secondary">
            {row._sl}
          </Typography>
        );
      },
    },
    {
      field: "prod_name",
      headerName: `${masterPanel["PROD"] || "Product"} Name`,
      renderHeader: () => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {masterPanel["PROD"] || "Product"} Name
          </Typography>
          {isApproved && (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.25, mr: 30 }}
            >
              <Typography
                variant="caption"
                fontWeight={500}
                sx={{ whiteSpace: "nowrap" }}
              >
                All {masterPanel["PROD"] || "Product"}s
              </Typography>
              <Switch
                size="small"
                checked={tglVal === 1}
                onChange={handleToggleAllProducts}
              />
              <Typography
                variant="caption"
                fontWeight={500}
                sx={{ whiteSpace: "nowrap" }}
              >
                with values
              </Typography>
            </Box>
          )}
        </Box>
      ),
      renderCell: ({ row }) => {
        // ✅ Category header — show cat_name spanning the cell
        if (row._rowType === "cat_header") {
          return <strong>{row.cat_name}</strong>;
        }

        if (row._isGrandTotal) {
          return (
            <Typography
              variant="body2"
              sx={{ fontSize: 13, fontWeight: 600, color: "text.primary" }}
            >
              GRAND TOTAL (Qty)
            </Typography>
          );
        }
        if (row._rowKey === mapActionRowKey) {
          return renderRowSkeleton(row);
        }
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                flexWrap: "wrap",
              }}
            >
              <MapDot row={row} />
              {!isApproved && (
                <Tooltip title={`Map ${masterPanel["PROD"] || "product"}`}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenMapModal(row)}
                    sx={{ color: "primary.main", p: "2px" }}
                  >
                    <LinkIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
              <Typography
                variant="body2"
                onClick={() => (!isApproved ? handleOpenMapModal(row) : null)}
                sx={{
                  fontSize: 12,
                  cursor: "pointer",
                  color:
                    row.strak_prod_name == null && row.pn === ""
                      ? "error.main"
                      : "text.primary",
                  "&:hover": {
                    color: !isApproved ? "primary.main" : null,
                    textDecoration: !isApproved ? "underline" : null,
                  },
                }}
              >
                {row.cat_code_1} {row.prod_code ? `| ${row.prod_code}` : ""} |{" "}
                {row.prod_name}
              </Typography>
              {row.pn && (
                <Checkbox size="small" defaultChecked sx={{ p: "2px" }} />
              )}
            </Box>
            {!isApproved ? (
              <Box sx={{ ml: 2.5 }}>
                {row.strak_prod_name ? (
                  <Typography variant="caption">
                    <Box component="span" color="text.secondary">
                      mapped as:{" "}
                    </Box>
                    <Box component="span" color="success.main">
                      {row.strak_prod_code} | {row.strak_prod_name}
                    </Box>
                  </Typography>
                ) : (
                  <Typography variant="caption">
                    <Box component="span" color="text.secondary">
                      suggestions:{" "}
                    </Box>
                    <Box component="span" color="error.main">
                      {row.pc && row.pn ? `${row.pc} | ${row.pn}` : ""}
                    </Box>
                  </Typography>
                )}
              </Box>
            ) : null}
          </Box>
        );
      },
    },
    {
      field: "prod_qty",
      headerName: "Closing Qty",
      width: 200,
      textAlign: "center",
      renderHeader: () => (
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ width: "100%", textAlign: "center" }}
        >
          Closing Qty
        </Typography>
      ),
      renderCell: ({ row }) => {
        if (row._rowKey === mapActionRowKey) {
          return (
            <Box
              sx={{ width: "100%", display: "flex", justifyContent: "center" }}
            >
              <Box
                sx={{
                  height: 34,
                  width: 110,
                  borderRadius: 1,
                  bgcolor: "grey.300",
                }}
              />
            </Box>
          );
        }
        // ✅ No qty cell for category headers
        if (row._rowType === "cat_header") return null;

        if (row._isGrandTotal) {
          return (
            <Typography
              variant="body2"
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: "text.primary",
                ml: "30%",
              }}
            >
              {row.prod_qty}
            </Typography>
          );
        }
        return canEditQty ? (
          <TextField
            key={row._rowKey}
            size="small"
            value={row.prod_qty ?? ""}
            onChange={(e) => handleQtyChange(row._rowKey, e.target.value)}
            inputProps={{
              style: { textAlign: "center", fontSize: 13 },
            }}
            error={row.qty_map_stat === 1}
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: 13,
                mx: "auto",
              },
            }}
          />
        ) : (
          <TextField
            value={row.prod_qty}
            size="small"
            inputProps={{
              style: { textAlign: "center", fontSize: 13 },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: 13,
                width: 110,
                mx: "auto",
              },
            }}
          />
        );
      },
    },
    ...(canDelete
      ? [
          {
            field: "_actions",
            headerName: " ",
            width: 110,
            align: "center",
            headerAlign: "center",
            sortable: false,
            renderHeader: () => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  width: "100%",
                }}
              >
                <Tooltip title="Delete selected">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={handleDeleteSelected}
                    sx={{ p: "2px" }}
                  >
                    <FaTrashAlt size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Select all">
                  <Checkbox
                    size="small"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    sx={{ p: "2px" }}
                  />
                </Tooltip>
              </Box>
            ),
            renderCell: ({ row }) => {
              if (row._rowKey === mapActionRowKey) {
                return (
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        height: 24,
                        width: 60,
                        borderRadius: 1,
                        bgcolor: "grey.300",
                      }}
                    />
                  </Box>
                );
              }
              // ✅ No actions for category headers
              if (row._rowType === "cat_header") return null;
              if (row._isGrandTotal) return null;
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                  }}
                >
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteRow(row)}
                      sx={{ color: "action.disabled" }}
                    >
                      <FaTrash size={16} />
                    </IconButton>
                  </Tooltip>
                  <Checkbox
                    size="small"
                    checked={!!dltChecked[row._rowKey]}
                    onChange={(e) =>
                      setDltChecked((prev) => ({
                        ...prev,
                        [row._rowKey]: e.target.checked,
                      }))
                    }
                    sx={{ p: "2px" }}
                  />
                </Box>
              );
            },
          },
        ]
      : []),
  ];

  const legendChips = [
    {
      key: "mapped",
      color: MAP_COLORS.mapped,
      label: "Mapped",
      cnt: counts.mapped,
    },
    {
      key: "semi",
      color: MAP_COLORS.semi,
      label: "Semi-Mapped",
      cnt: counts.semi,
    },
    {
      key: "unmapped",
      color: MAP_COLORS.unmapped,
      label: "Un-Mapped",
      cnt: counts.unmapped,
    },
    {
      key: "invalid",
      color: MAP_COLORS.invalid,
      label: "Invalid Qty",
      cnt: counts.invalid,
    },
  ];

  const resetUploadState = () => {
    setFiles([]);
    setInputCount(1);
    inputRefs.current = [];
    setRawPages([]);
    setRawPageIndex(0);
    setRawInvalidCell(null);
    setManualMode(false);
    setTglVal(1);
    setActiveFilter("total");
    setSearch("");
    setDltChecked({});
    setSelectAll(false);
    setSelCategory("all");
    setPreviewFile(null);
  };

  return (
    <Layout
      breadcrumb={[
        { label: "Home", path: "/" },
        { label: "Transactions", path: location.pathname },
        { label: "Upload Closing", path: location.pathname },
      ]}
    >
      <Box p={2} display="flex" flexDirection="column" gap={2}>
        <Paper
          elevation={0}
          sx={{
            p: "16px 18px",
            borderRadius: "10px",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          <Grid container spacing={1.5} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
              <FormControl fullWidth>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Month"
                    views={["month", "year"]}
                    format="MMM YYYY"
                    value={selMonth}
                    onChange={(v) => {
                      resetUploadState();
                      setSelMonth(v);
                    }}
                    slotProps={{ textField: { size: "small" } }}
                    maxDate={dayjs()}
                    disabled={checking === 2}
                  />
                </LocalizationProvider>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "35px",
                }}
              >
                <Autocomplete
                  size="small"
                  options={allDesname}
                  disabled={checking === 2}
                  value={
                    allDesname.find(
                      (d) =>
                        `${d.id}|${d.stk_name}|${d.stk_code}|${d.ter_name}` ===
                        selDesName,
                    ) || null
                  }
                  getOptionLabel={(option) =>
                    `${option.stk_name} - ${option.stk_code}`
                  }
                  onChange={(event, newValue) => {
                    resetUploadState();
                    if (newValue) {
                      setSelDesName(
                        `${newValue.id}|${newValue.stk_name}|${newValue.stk_code}|${newValue.ter_name}`,
                      );
                    } else {
                      setSelDesName("0");
                    }

                    setManualMode(false);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={masterPanel["STKS"] || "Distributor"}
                      placeholder={`Search ${masterPanel["STKS"] || "Distributor"}`}
                    />
                  )}
                />
                {showDistributorTerritory && (
                  <Typography
                    variant="caption"
                    sx={{ mt: 0.1, color: "#212121", fontSize: "12px" }}
                  >
                    <strong>{masterPanel["TERR"] || "Territory"}:</strong> {territory}
                  </Typography>
                )}
              </Box>
            </Grid>
            {Number(checking) !== 2 && !hasExistingData && !manualMode && (
              <>
                <Grid size={{ xs: 12, sm: "auto" }}>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      Upload File
                    </Typography>

                    <Button
                      component="label"
                      role={undefined}
                      variant="outlined"
                      tabIndex={-1}
                      startIcon={<CloudUploadIcon />}
                      sx={{
                        width: 220,
                        justifyContent: "flex-start",
                        textTransform: "none",
                        position: "relative",
                        pr: files[0] ? 4 : 2,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                          maxWidth: "100%",
                        }}
                      >
                        {files[0]?.name || "Choose File"}
                      </Box>
                      <input
                        ref={(el) => (inputRefs.current[0] = el)}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls"
                        onChange={(e) => handleFileChange(e, 0)}
                        style={{
                          clip: "rect(0 0 0 0)",
                          clipPath: "inset(50%)",
                          height: 1,
                          overflow: "hidden",
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          whiteSpace: "nowrap",
                          width: 1,
                        }}
                      />
                      {files[0] && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveFile(0);
                          }}
                          sx={{
                            position: "absolute",
                            right: 4,
                            top: "50%",
                            transform: "translateY(-50%)",
                            p: "2px",
                            color: "grey",
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      )}
                    </Button>

                    {files.length > 0 && inputCount < MAX_FILE_INPUTS && (
                      <Typography
                        variant="caption"
                        onClick={handleAddMore}
                        sx={{
                          color: "primary.main",
                          cursor: "pointer",
                          userSelect: "none",
                          fontSize: "1rem",
                          width: "fit-content",
                          whiteSpace: "nowrap",
                          position: "absolute",
                          mt: 6,
                        }}
                      >
                        + ADD MORE
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {Array.from({ length: inputCount - 1 }).map((_, idx) => (
                  <Grid key={idx + 1} size={{ xs: 12, sm: "auto" }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        mt: "20px",
                      }}
                    >
                      <Button
                        component="label"
                        role={undefined}
                        variant="outlined"
                        tabIndex={-1}
                        startIcon={<CloudUploadIcon />}
                        sx={{
                          width: 220,
                          justifyContent: "flex-start",
                          textTransform: "none",
                          position: "relative",
                          pr: files[idx + 1] ? 4 : 2,
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                            maxWidth: "100%",
                          }}
                        >
                          {files[idx + 1]?.name || "Choose File"}
                        </Box>
                        <input
                          ref={(el) => (inputRefs.current[idx + 1] = el)}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls"
                          onChange={(e) => handleFileChange(e, idx + 1)}
                          style={{
                            clip: "rect(0 0 0 0)",
                            clipPath: "inset(50%)",
                            height: 1,
                            overflow: "hidden",
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            whiteSpace: "nowrap",
                            width: 1,
                          }}
                        />
                        {files[idx + 1] && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveFile(idx + 1);
                            }}
                            sx={{
                              position: "absolute",
                              right: 4,
                              top: "50%",
                              transform: "translateY(-50%)",
                              p: "2px",
                              color: "grey",
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Button>
                    </Box>
                  </Grid>
                ))}
              </>
            )}
            {Number(checking) !== 2 && !hasExistingData && !manualMode && (
              <Grid size={{ xs: 12, sm: "auto" }}>
                <Button
                  variant="contained"
                  onClick={handleImport}
                  disabled={loading}
                >
                  {loading ? "Importing…" : "Import"}
                </Button>
              </Grid>
            )}

            {hasPreviewFiles && (
              <Grid
                size={{ xs: 12, sm: "auto" }}
                sx={{ display: "flex", alignItems: "center" }}
              >
                <Tooltip title="Preview uploaded file">
                  <IconButton
                    onClick={() =>
                      setPreviewFile({
                        docName: imgData.map((img) => img.doc_name).join(","),
                        fileType,
                      })
                    }
                    sx={{
                      border: "1.5px solid",
                      borderColor: previewTriggerColor,
                      color: previewTriggerColor,
                      borderRadius: "8px",
                      width: 33,
                      height: 33,
                    }}
                  >
                    <FaFile size={30} />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}

            {Number(checking) !== 2 &&
              !hasExistingData &&
              !rawMode &&
              !manualMode &&
              !files.length > 0 && (
                <Grid size={{ xs: 12, sm: "auto" }}>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => handleAddManual()}
                    disabled={loading || !selDesName || selDesName === "0"}
                  >
                    Add Manual
                  </Button>
                </Grid>
              )}

            {processStat !== null && (
              <Grid
                size={{ xs: 12, sm: "grow", lg: 3 }}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignSelf: "center",
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  {(isPending || isApproved || isRawPending || isRejected) && (
                    <Typography
                      variant="caption"
                      fontSize={12}
                      fontWeight={500}
                    >
                      STATUS:
                    </Typography>
                  )}
                  {isPending && (
                    <Typography
                      variant="caption"
                      fontSize={12}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "success.main",
                        fontWeight: 500,
                        textWrap: "nowrap",
                      }}
                    >
                      Unconfirmed (In Process)
                    </Typography>
                  )}
                  {isRawPending && (
                    <Typography
                      variant="caption"
                      fontSize={12}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "warning.main",
                        fontWeight: 500,
                        textWrap: "nowrap",
                      }}
                    >
                      In Pending <InsertDriveFileIcon sx={{ fontSize: 12 }} />
                    </Typography>
                  )}
                  {isRejected && (
                    <Typography
                      variant="caption"
                      fontSize={12}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "error.main",
                        fontWeight: 500,
                      }}
                    >
                      Rejected <MdBlockFlipped size={12} />
                    </Typography>
                  )}
                  {isApproved && (
                    <Typography
                      variant="caption"
                      fontSize={12}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "success.main",
                        fontWeight: 500,
                      }}
                    >
                      Approved <FaThumbsUp size={12} />
                    </Typography>
                  )}
                  {!isPending &&
                    !isRawPending &&
                    !isRejected &&
                    !isApproved && (
                      <Typography
                        variant="caption"
                        fontSize={12}
                        sx={{ color: "text.secondary", fontWeight: 500 }}
                      >
                        {processStat}
                      </Typography>
                    )}
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>

        {rawMode && currentRawPage && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <Box
              sx={{
                p: "10px 14px",
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
              }}
            >
              <Box sx={{ flex: 1 }} />
              {rawPages.length > 1 && (
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={rawPageIndex === 0}
                    onClick={() => setRawPageIndex((i) => i - 1)}
                  >
                    ‹
                  </Button>
                  {rawPages.map((_, i) => (
                    <Button
                      key={i}
                      size="small"
                      variant={i === rawPageIndex ? "contained" : "outlined"}
                      onClick={() => setRawPageIndex(i)}
                      sx={{ minWidth: 32, px: 0 }}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={rawPageIndex === rawPages.length - 1}
                    onClick={() => setRawPageIndex((i) => i + 1)}
                  >
                    ›
                  </Button>
                </Box>
              )}
              {masId && canDelete && (
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ backgroundColor: "#F39C12", color: "white" }}
                  onClick={handleAbort}
                >
                  Abort
                </Button>
              )}
            </Box>
            <DataTable
              columns={buildRawColumns(currentRawPage, rawPageIndex)}
              data={rawRowsForTable(currentRawPage)}
              loading={loading}
              pagination={false}
              searchable={false}
            />
          </Paper>
        )}

        {/* Skeleton — shown while fetching (covers distributor/month switch, import, refresh) */}
        {loading && !rawMode && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <TableSkeleton rows={8} />
          </Paper>
        )}

        {/* Real table — only once loading is done and we have data */}
        {!loading && showTable && (
          <Paper
            elevation={0}
            sx={{
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <Box
              sx={{
                p: "10px 14px",
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexWrap: "wrap",
                gap: 0.75,
                alignItems: "center",
              }}
            >
              {legendChips.map(({ key, color, label, cnt }) => (
                <Chip
                  key={key}
                  icon={
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "2px",
                        background: color,
                        ml: "6px !important",
                      }}
                    />
                  }
                  label={
                    <>
                      {label}
                      {cnt > 0 && (
                        <Box
                          component="span"
                          sx={{ fontWeight: 600, color, ml: 0.5 }}
                        >
                          ({cnt})
                        </Box>
                      )}
                    </>
                  }
                  onClick={() =>
                    setActiveFilter(activeFilter === key ? "total" : key)
                  }
                  variant={activeFilter === key ? "outlined" : "filled"}
                  sx={{
                    borderColor: activeFilter === key ? color : "transparent",
                    background:
                      activeFilter === key ? `${color}18` : "action.hover",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                />
              ))}
              <Box
                onClick={() => setActiveFilter("total")}
                color={
                  activeFilter === "total" ? "primary.main" : "text.secondary"
                }
                sx={{
                  "&:hover": {
                    color: "primary.main !important",
                    textDecoration: "underline",
                    cursor: "pointer",
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ ml: 0.5, fontSize: "10px" }}
                >
                  {`:TOTAL ->`} <strong>({counts.total})</strong> Records
                </Typography>
                <Typography variant="caption" sx={{ ml: 0, fontSize: "10px" }}>
                  ({counts.totalQty}) Qty
                </Typography>
              </Box>
              {(isPending || isRejected) && (
                <Box
                  onClick={handleDltThisData}
                  sx={{ display: "flex", cursor: "pointer" }}
                >
                  <FaTrash size={15} color="red" />
                  <Typography sx={{ textWrap: "wrap" }}>
                    Delete this Data
                  </Typography>
                </Box>
              )}
              <Box sx={{ flex: 1 }} />

              {!isApproved &&
                !isRejected &&
                (manualMode ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleManualInsert}
                    disabled={loading}
                  >
                    Save
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={loading}
                  >
                    Save
                  </Button>
                ))}

              {!isApproved && !isRejected && !manualMode && (
                <Tooltip
                  title={
                    canConfirm
                      ? "Confirm and submit"
                      : "Resolve all mapping issues first"
                  }
                >
                  <span>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleConfirm}
                      disabled={!canConfirm || loading}
                    >
                      Confirm
                    </Button>
                  </span>
                </Tooltip>
              )}

              {canUpdateApproved && !manualMode && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleManualInsert}
                  disabled={loading}
                >
                  Update
                </Button>
              )}

              {masId && canDelete && !manualMode && (
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ backgroundColor: "#F39C12", color: "white" }}
                  onClick={handleAbort}
                >
                  Abort
                </Button>
              )}
              {availableCategories.length > 0 && isApproved && (
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={selCategory}
                    onChange={(e) => setSelCategory(e.target.value)}
                    sx={{ fontSize: 12 }}
                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                  >
                    <MenuItem value="all" sx={{ fontSize: 12 }}>
                      All
                    </MenuItem>
                    {availableCategories.map((cat) => (
                      <MenuItem key={cat} value={cat} sx={{ fontSize: 12 }}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            <DataTable
              columns={manualMode ? manualColumns : dtColumns}
              data={groupedRows}
              loading={loading}
              pageSize={10}
              pagination={true}
              defaultPageSize={500}
              externalSearch={search}
              onSearchChange={setSearch}
              getRowId={(row) => row._rowKey}
              rowStyle={rowStyle}
              getRowClassName={(params) =>
                params.row._isGrandTotal ? "grand-total-row" : ""
              }
              sx={{
                "& .grand-total-row": {
                  backgroundColor: "rgba(0,0,0,0.04)",
                  fontWeight: 600,
                  borderTop: "2px solid",
                  borderColor: "divider",
                },
                "& .grand-total-row:hover": {
                  backgroundColor: "rgba(0,0,0,0.07) !important",
                },
              }}
            />
          </Paper>
        )}

        {isLastRawPage && rawMode && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              justifyContent: "end",
            }}
          >
            <Button
              sx={{ width: "2rem" }}
              variant="contained"
              onClick={handleRawSubmit}
              disabled={loading}
            >
              Submit
            </Button>
          </Box>
        )}

        {!loading && !showTable && !rawMode && selDesName !== "0" && (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              textAlign: "center",
              borderRadius: "10px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            }}
          >
            <Typography color="text.secondary" fontSize={13}>
              No data uploaded yet. Select files above and click Import.
            </Typography>
          </Paper>
        )}
      </Box>

      <Dialog
        open={mapModal.open}
        onClose={handleCloseMapModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Mapping {masterPanel["PROD"] || "Product"}
          </Typography>
          <Typography fontWeight={500} fontSize={15}>
            {mapModal.row?.prod_name}
          </Typography>
          <IconButton
            onClick={handleCloseMapModal}
            sx={{ position: "absolute", right: 12, top: 12 }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 1.5 }}>
          {mapModalLoading ? (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
                sx={{ mb: 0.75, display: "block" }}
              >
                Suggestions
              </Typography>

              {Array.from({ length: 4 }).map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.2,
                  }}
                >
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      bgcolor: "grey.300",
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        height: 14,
                        width: `${70 - idx * 8}%`,
                        borderRadius: 1,
                        bgcolor: "grey.300",
                      }}
                    />
                  </Box>
                </Box>
              ))}

              <Divider sx={{ my: 1.5 }} />

              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
                sx={{ mb: 0.75, display: "block" }}
              >
                Others
              </Typography>

              <Box
                sx={{
                  height: 40,
                  borderRadius: 1,
                  bgcolor: "grey.200",
                }}
              />
            </Box>
          ) : (
            <>
              {mapModal.suggestions.length > 0 && (
                <Box mb={1.5}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
                    sx={{ mb: 0.5, display: "block" }}
                  >
                    Suggestions
                  </Typography>

                  <RadioGroup value={mapRadio?.id ?? ""}>
                    {mapModal.suggestions.map((s) => (
                      <FormControlLabel
                        key={s.prod_id}
                        value={s.prod_id}
                        control={
                          <Radio
                            size="small"
                            onChange={() => {
                              setMapRadio({
                                id: s.prod_id,
                                code: s.prod_code,
                                name: s.prod_name,
                              });
                              setMapAutoSelected(null);
                            }}
                          />
                        }
                        label={
                          <Typography fontSize={13}>
                            {s.prod_code} – {s.prod_name}
                          </Typography>
                        }
                        sx={{ my: 0 }}
                      />
                    ))}
                  </RadioGroup>

                  <Divider sx={{ mt: 1 }} />
                </Box>
              )}

              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
                sx={{ mb: 0.75, display: "block" }}
              >
                Others
              </Typography>

              <Autocomplete
                freeSolo
                options={mapAutoResults}
                getOptionLabel={(o) =>
                  typeof o === "string" ? o : `${o.prod_code} – ${o.prod_name}`
                }
                onInputChange={(_, val) => handleMapInputChange(val)}
                onChange={(_, val) => {
                  if (val && typeof val === "object") {
                    setMapAutoSelected({
                      id: val.prod_id,
                      code: val.prod_code,
                      name: val.prod_name,
                    });
                    setMapRadio(null);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder={`Search ${masterPanel["PROD"] || "product"}…`}
                    fullWidth
                  />
                )}
              />
            </>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setMapModal((m) => ({ ...m, open: false }))}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            onClick={handleAskMapConfirm}
            disabled={mapModalLoading}
          >
            Map
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={confirm.open}
        onClose={closeConfirm}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        loading={loading}
        confirmColor={confirm.confirmColor}
      />

      <ConfirmationDialog
        open={mapConfirm.open}
        onClose={closeMapConfirm}
        onConfirm={mapConfirm.onConfirm}
        title={mapConfirm.title}
        message={mapConfirm.message}
        confirmText={mapConfirm.confirmText}
        cancelText={mapConfirm.cancelText}
        loading={false}
        confirmColor={mapConfirm.confirmColor}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </Layout>
  );
}

export default UploadClosing;