import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import camlinLogo from "./assets/kc.png";
import {
    AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemText, Box,
    IconButton, Menu, MenuItem, Divider, ListItemIcon, Avatar, Badge, useMediaQuery,
    useTheme, styled, Tooltip, tooltipClasses, Collapse
} from "@mui/material";

import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Lock as LockIcon,
    ExitToApp as ExitToAppIcon,
    ExpandLess,
    ExpandMore,

} from "@mui/icons-material";
import adminImage from "./assets/bhoruka-cusportal-admin.png";
import statincreaseimg from './assets/line-chart.png'
import { FaBorderAll, FaBook, FaUser } from "react-icons/fa6";
import ConfirmationDialog from "./utils/confirmDialog"
import { useSnackbar } from 'notistack'
import { GrTasks } from "react-icons/gr";
import { AiFillDashboard } from "react-icons/ai";
import { ImBook } from "react-icons/im";
import { FaGlobeAsia } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { FaExchangeAlt } from "react-icons/fa";
import { FaFile } from "react-icons/fa";
import { FaRegChartBar } from "react-icons/fa";
import { AiOutlineFileExcel } from "react-icons/ai";
import { PiChartLineUpBold } from "react-icons/pi";
import SalesTrekimg from './assets/salestrakimg.png'


const HtmlTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: "#effac1",
        color: "#343a40",
        maxWidth: 200,
        fontSize: "12px",
        border: "1px solid #979a9b",
        borderRadius: "5px",
    },
}));

const Layout = ({ children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [fieldActivityOpen, setFieldActivityOpen] = useState(false)
    const [dashBoardOpen, setDashboardOpen] = useState(false)
    const [trendAnalysisOpen, setTrendAnalysisOpen] = useState(false)
    const [primaryAnalysisOpen, setPrimaryAnalysisOpen] = useState(false)
    const [mastersOpen, setMastersOpen] = useState(false);
    const [geographymasOpen, setGeographyMasOpen] = useState(false)
    const [mainMasOpen, setMainMasOpen] = useState(false)
    const [userMasOpen, setUserMasOpen] = useState(false)
    const [adminPanelopen, setAdminPanelOpen] = useState(false)
    const [accountTabOpen, setAccountTabOpen] = useState(false)
    const [transactionOpen, setTransactionOpen] = useState(false)
    const [extractOpen, setExtractOpen] = useState(false)
    const [reportsOpen, setReportsOpen] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null);
    const [anchorEl1, setAnchorEl1] = React.useState(null);
    const open = Boolean(anchorEl1);
    const location = useLocation()
    const { enqueueSnackbar } = useSnackbar()
    const mastersChildPaths = [
        "/Admin/create_user",
        "/Admin/customer_list",
        "/Admin/users_data/",
        "/Admin/newsNotices",
        "/Admin/Schueco_gallery",
        "/Admin/Schueco_links",
        "/Admin/upl_type_mas",
        "/Admin/CreateProjMas",
    ];

    const geographyMasChildPaths = [
        "/masters/zone_mas",
        "/masters/region",
        "/masters/area_mas",
        "/masters/ter_mas",
        "/masters/beat_mas"

    ]
    const mainMasChildPaths = [
        "/masters/cat",
        "/masters/catSub",
        "/masters/prod_mas",
        "/masters/dept",
        "/masters/designation",
        "/masters/stockist",
        "/masters/city_mas"
    ]
    const userMasChildPaths = [
        "/Users/users_list",
        "/Users/userLog"
    ]
    const adminPanelChildPaths = [
        "/masters/repTabs",
        "/masters/menuMaster",
        "/masters/dashboardmaster",
        "/AdminPanel/ApiProcessing",
        "/masters/appversion",
        "/masters/edetailing",
        "/Processlist/planprocess",
        "/masters/webMenuMaster"
        
    ]
    const trendAnalysisChildPaths = [
        "/reports/trendanalysis/",
    ]
    const primaryanalysisChildPaths = [
        "/dashboard/primarysalesview",
        "/dashboard/salesanalysis",
        "/dashboard/districtsales"
    ]

    const fieldActivityChildPaths = [
        "/dashboard"
    ]

    const accountChildPaths = [
       "/customers/AllDoctors/",
       "/reports/extract",
       "/Customers/CreateDoctor",
       "/customers/AllDoctors/",
       "/customers/account_transfer/"
    ]

    const transactionChildPaths = [
        "/reports/sec_sales_data",
        "/upload_closing",
        "/input/uploadbilling",
        "/input/stock_sales"
    ]

    const reportsChildPaths = [
        "/reports/stock_salesReport",
        "/reports/active_sales",
        "/reports/data_submission_log",
        "/reports/getfieldActivity",
        "/reports/primary_order",
        "/reports/pcm_kam",
        "/reports/outlet_count",
        "/reports/capability_report"
    ]

    const extractChildPaths = [
        "/reports/extract_new",
        "/reports/active_sales_new",
        "/reports/getfieldActivity_new",
        "/reports/primary_order_new",
        "/reports/pcm_kam_new",
        "/reports/stk_sales_summary",
        "/reports/stk_sales_details",
        "/reports/reg_sec_sales"
    ]

    const isFieldActivityActive = fieldActivityChildPaths.includes(location.pathname)
    const isgeographyMasActive = geographyMasChildPaths.includes(location.pathname)
    const isMainMasActive = mainMasChildPaths.includes(location.pathname)
    const isUserMasActive = userMasChildPaths.includes(location.pathname)
    const isAdminPanelActive = adminPanelChildPaths.includes(location.pathname)
    const isTrendAnalysisActive = trendAnalysisChildPaths.includes(location.pathname)
    const isPrimaryAnalysisActive = primaryanalysisChildPaths.includes(location.pathname)
    const isAccountActive = accountChildPaths.includes(location.pathname)
    const isTransactionActive = transactionChildPaths.includes(location.pathname)
    const isReportActive = reportsChildPaths.includes(location.pathname)
    const isExtractActive = extractChildPaths.includes(location.pathname)

    const isDashBoardactive=isTrendAnalysisActive || isPrimaryAnalysisActive || location.pathname.startsWith("/reports/performance_report")
    const isMastersActive=isgeographyMasActive ||isMainMasActive || isUserMasActive || isAdminPanelActive
    

    const handleClick = (event) => {
        setAnchorEl1(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl1(null);
    };

    useEffect(() => {
        setDrawerOpen(!isMobile);
    }, [isMobile]);

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false,
        title: "",
        message: "",
        onConfirm: null,
        loading: false,
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "primary"
    });

    const showConfirmationDialog = (config) => {
        setConfirmationDialog({
            ...confirmationDialog,
            ...config,
            open: true
        });
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog({
            ...confirmationDialog,
            open: false,
            loading: false
        });
    };

    const showLogoutConfirmation = () => {
        showConfirmationDialog({
            title: "Confirm Logout",
            message: "Are you sure you want to Logout?",
            confirmText: "Logout",
            confirmColor: "error",
            onConfirm: () => handleLogout()
        });
    };

    const handleLogout = () => {
        try {
            console.log("Logout Successfully")
            enqueueSnackbar("Logout Successfully", { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        }
        catch (err) {
            console.log(err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })

        }
        finally {
            closeConfirmationDialog();
        }
    }


    return (
        <Box sx={{ display: "flex", height: "100vh", }}>
            <Drawer
                variant={isMobile ? "temporary" : "persistent"}
                open={drawerOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    width: drawerOpen ? 190 : 0,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: 190,
                        boxSizing: "border-box",
                        backgroundColor: "#F5A623",
                        height: "100vh",
                        position: "relative",
                        overflowY: "auto", // make it scrollable
                        "&::-webkit-scrollbar": {
                            width: "8px",
                            background: "transparent",
                        },

                        "&::-webkit-scrollbar-thumb": {
                            background: "rgba(7, 30, 123, 0.24)",
                            borderRadius: "6px",
                            border: "2px solid transparent",
                            backgroundClip: "padding-box",

                            transition: "opacity 0.3s",
                            opacity: 0.5,
                            alignSelf: "center",
                        },

                        "&:hover::-webkit-scrollbar-thumb": {
                            opacity: 1,
                        },
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "12px",
                    }}
                >
                    {/* <img
                  src={ SalesTrekimg}
                  alt="SCHÜCO Logo"
                  style={{ height: "29px", marginTop: "0.5rem" }}
              />     */}
                </Box>
                <List
                    sx={{
                        paddingTop: "2.8rem",
                        "& .MuiListItem-root": {
                            paddingTop: "0.1px",
                            paddingBottom: "0.1px",
                            paddingLeft: "10px",
                            paddingRight: "14px",
                            color: "white",
                            "&:hover": {
                                backgroundColor: "rgba(21, 13, 48, 0.79)",
                            },
                        },
                    }}
                >
                    <div style={{ marginTop: fieldActivityOpen ? "2px" : "0px", }}>
                        <ListItem
                            sx={{
                                cursor: "pointer",
                                backgroundColor:
                                    fieldActivityOpen
                                        ? "rgba(21, 13, 48, 0.63)"
                                        : "transparent",
                            }}
                            onClick={() => {
                                setFieldActivityOpen(!fieldActivityOpen);
                                setDashboardOpen(false)
                                setMastersOpen(false)
                                setAccountTabOpen(false)
                                setTransactionOpen(false)
                                setReportsOpen(false)
                                setExtractOpen(false)
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 25,
                                    paddingLeft: isFieldActivityActive ? "4px" : null,
                                }}
                            >
                                <GrTasks
                                    style={{
                                        color: "white",
                                        fontSize: isMobile ? 12 : 14,
                                        strokeWidth: 3,
                                        stroke: "white",
                                        transform: "scaleY(0.9)",
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary="Field Activity"
                                primaryTypographyProps={{
                                    fontWeight: "500",
                                    fontSize: isMobile ? "0.95rem" : "1rem",
                                }}
                            />
                            {fieldActivityOpen ? (
                                <ExpandLess sx={{ fontSize: "18px" }} />
                            ) : (
                                <ExpandMore sx={{ fontSize: "18px" }} />
                            )}

                        </ListItem>
                        <Collapse in={fieldActivityOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem
                                    component={Link}
                                    to="/dashboard"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/dashboard"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Daywise Log"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>

                            </List>
                        </Collapse>

                    </div>
                    <div style={{ marginTop: dashBoardOpen ? "2px" : "0px", }}>
                        <ListItem
                            sx={{
                                cursor: "pointer",
                                backgroundColor:
                                    dashBoardOpen
                                        ? "rgba(21, 13, 48, 0.63)"
                                        : "transparent",
                            }}
                            onClick={() => {
                                setFieldActivityOpen(false);
                                setDashboardOpen(!dashBoardOpen)
                                setMastersOpen(false)
                                setAccountTabOpen(false)
                                setTransactionOpen(false)
                                setReportsOpen(false)
                                setExtractOpen(false)
                                
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 25,
                                    paddingLeft: isDashBoardactive ? "4px" : null,
                                }}
                            >
                                <AiFillDashboard
                                    style={{
                                        color: 'white',
                                        fontSize: isMobile ? 12 : 18,
                                        strokeWidth: 1,
                                        stroke: "white",
                                        transform: "scaleY(0.9)",
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary="Dashboard"
                                primaryTypographyProps={{
                                    fontWeight: "500",
                                    fontSize: isMobile ? "0.95rem" : "1rem",
                                }}
                            />
                            {dashBoardOpen ? (
                                <ExpandLess sx={{ fontSize: "18px" }} />
                            ) : (
                                <ExpandMore sx={{ fontSize: "18px" }} />
                            )}

                        </ListItem>
                        <Collapse in={dashBoardOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setTrendAnalysisOpen(!trendAnalysisOpen)
                                        setPrimaryAnalysisOpen(false)
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 25,
                                            paddingLeft: "13px",
                                        }}>
                                        <PiChartLineUpBold color="white" fontSize={isMobile ? 11 : 13} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Trend Analysis"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "1rem",
                                            marginLeft: "6px",
                                        }}
                                    />
                                    {trendAnalysisOpen ? (<ExpandLess sx={{ fontSize: "18px" }} />) : (<ExpandMore sx={{ fontSize: "18px" }} />)}
                                </ListItem>
                                <Collapse in={trendAnalysisOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        <ListItem
                                            component={Link}
                                            to="/reports/trendanalysis/"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/reports/trendanalysis/"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Primary Sales"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/reports/trendanalysis/"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/reports/trendanalysis/"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Secondary Sales"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/reports/trendanalysis/"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/reports/trendanalysis/"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Closing"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                    </List>
                                </Collapse>
                                <ListItem
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setPrimaryAnalysisOpen(!primaryAnalysisOpen)
                                        setTrendAnalysisOpen(false)
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 25,
                                            paddingLeft: "13px",
                                        }}>
                                        <PiChartLineUpBold color="white" fontSize={isMobile ? 11 : 13} />
                                    </ListItemIcon>

                                    <ListItemText
                                        primary="Primary Analysis"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "6px",
                                        }}
                                    />
                                    {primaryAnalysisOpen ? (<ExpandLess sx={{ fontSize: "18px" }} />) : (<ExpandMore sx={{ fontSize: "18px" }} />)}
                                </ListItem>
                                <Collapse in={primaryAnalysisOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        <ListItem
                                            component={Link}
                                            to="/dashboard/primarysalesview"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/dashboard/primarysalesview"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Primary Sales"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/dashboard/salesanalysis"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/dashboard/salesanalysis"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            
                                            <ListItemText
                                                primary="Sales Analysis"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/dashboard/districtsales"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/dashboard/districtsales"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="AREA Wise Sales Analysis"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                    </List>
                                </Collapse>
                                <ListItem
                                    component={Link}
                                    to="/reports/performance_report"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/performance_report"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemIcon
                                                sx={{
                                                    minWidth: 25,
                                                    paddingLeft: "13px",
                                                }}>
                                                <PiChartLineUpBold color="white" fontSize={isMobile ? 11 : 13} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Sales Analysis"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "6px",
                                        }}
                                    />
                                </ListItem>
                            </List>
                        </Collapse>
                    </div>
                    <div style={{ marginTop: isMastersActive || mastersOpen ? "2px" : "0px", }}>
                        <ListItem
                            sx={{
                                cursor: "pointer",
                                backgroundColor:
                                    isMastersActive || mastersOpen
                                        ? "rgba(21, 13, 48, 0.63)"
                                        : "transparent",
                            }}
                            onClick={() => {
                               setFieldActivityOpen(false);
                                setDashboardOpen(false)
                                setMastersOpen(!mastersOpen)
                                setAccountTabOpen(false)
                                setTransactionOpen(false)
                                setReportsOpen(false)
                                setExtractOpen(false)
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 25,
                                    paddingLeft: isMastersActive || mastersOpen ? "4px" : null,
                                }}
                            >
                                <ImBook color="white" fontSize={isMobile ? 11 : 13} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Masters"
                                primaryTypographyProps={{
                                    fontSize: isMobile ? "0.95rem" : "1rem",
                                }}
                            />
                            {mastersOpen ? (
                                <ExpandLess sx={{ fontSize: "18px" }} />
                            ) : (
                                <ExpandMore sx={{ fontSize: "18px" }} />
                            )}
                        </ListItem>
                        <Collapse in={mastersOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setGeographyMasOpen(!geographymasOpen)
                                        setMainMasOpen(false)
                                        setUserMasOpen(false)
                                        setAdminPanelOpen(false)
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 25,
                                            paddingLeft: "13px",
                                        }}>
                                        <FaGlobeAsia color="white" fontSize={isMobile ? 11 : 13} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Geogrphical"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: '6px'
                                        }}
                                    />
                                    {geographymasOpen ? (<ExpandLess sx={{ fontSize: "18px" }} />) : (<ExpandMore sx={{ fontSize: "18px" }} />)}
                                </ListItem>
                                <Collapse in={geographymasOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        <ListItem
                                            component={Link}
                                            to="/masters/zone_mas"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/zone_mas"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Zone"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/region"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/region"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Region"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/area_mas"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/area_mas"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Area"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/ter_mas"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/ter_mas"
                                                )
                                                    ? "rgba(255, 255, 255, 0.28)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Territory"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/beat_mas"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/beat_mas"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Beat"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>

                                    </List>
                                </Collapse>
                                <ListItem
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setGeographyMasOpen(false)
                                        setMainMasOpen(!mainMasOpen)
                                        setUserMasOpen(false)
                                        setAdminPanelOpen(false)
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 25,
                                            paddingLeft: "13px",
                                        }}>
                                        <FaBook color="white" fontSize={isMobile ? 11 : 13} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Main"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "6px",
                                        }}
                                    />
                                    {mainMasOpen ? (<ExpandLess sx={{ fontSize: "18px" }} />) : (<ExpandMore sx={{ fontSize: "18px" }} />)}
                                </ListItem>
                                <Collapse in={mainMasOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        <ListItem
                                            component={Link}
                                            to="/masters/cat"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/cat"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Product Category"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/catSub"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/catSub"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Product Sub Category"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/prod_mas"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/prod_mas"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Product"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/dept"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/dept"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Department"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/designation"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/designation"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Designation"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/stockist"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/stockist"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Stockist"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/city_mas"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/city_mas"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="City"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>

                                    </List>
                                </Collapse>
                                <ListItem
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setGeographyMasOpen(false)
                                        setMainMasOpen(false)
                                        setUserMasOpen(!userMasOpen)
                                        setAdminPanelOpen(false)
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 25,
                                            paddingLeft: "13px",
                                        }}>
                                        <FaUsers color="white" fontSize={isMobile ? 11 : 13} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Users"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "6px",
                                        }}
                                    />
                                    {userMasOpen ? (<ExpandLess sx={{ fontSize: "18px" }} />) : (<ExpandMore sx={{ fontSize: "18px" }} />)}
                                </ListItem>
                                <Collapse in={userMasOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        <ListItem
                                            component={Link}
                                            to="/Users/users_list"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/Users/users_list"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="User List"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/Users/userLog"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/Users/userLog"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="User Log"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                    </List>
                                </Collapse>
                                <ListItem
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setGeographyMasOpen(false)
                                        setMainMasOpen(false)
                                        setUserMasOpen(false)
                                        setAdminPanelOpen(!adminPanelopen)
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 25,
                                            paddingLeft: "13px",
                                        }}>
                                        <FaUser color="white" fontSize={isMobile ? 11 : 13} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Admin Panel"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "6px",
                                        }}
                                    />
                                    {adminPanelopen ? (<ExpandLess sx={{ fontSize: "18px" }} />) : (<ExpandMore sx={{ fontSize: "18px" }} />)}
                                </ListItem>
                                <Collapse in={adminPanelopen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        <ListItem
                                            component={Link}
                                            to="/masters/repTabs"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/repTabs"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Reporting Tabs"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/menuMaster"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/menuMaster"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Menu Master"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/dashboardmaster"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/dashboardmaster"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="App Widget Master"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/AdminPanel/ApiProcessing"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/AdminPanel/ApiProcessing"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Api Processing"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/appversion"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/appversion"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="App Version"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/edetailing"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/edetailing"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="E-Detailer"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/Processlist/planprocess"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/Processlist/planprocess"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="AWS Log"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>
                                        <ListItem
                                            component={Link}
                                            to="/masters/webMenuMaster"
                                            sx={{
                                                pl: 4,
                                                backgroundColor: location.pathname.startsWith(
                                                    "/masters/webMenuMaster"
                                                )
                                                    ? "rgba(255, 255, 255, 0.2)}"
                                                    : "transparent",
                                            }}
                                        >
                                            <ListItemText
                                                primary="Web Menu Master"
                                                primaryTypographyProps={{
                                                    fontSize: isMobile ? "0.9rem" : "0.97rem",
                                                    marginLeft: "3.5rem",
                                                }}
                                            />
                                        </ListItem>

                                    </List>
                                </Collapse>
                            </List>
                        </Collapse>
                    </div>
                    <div style={{ marginTop: accountTabOpen ? "2px" : "0px", }}>
                        <ListItem
                            sx={{
                                cursor: "pointer",
                                backgroundColor:
                                    accountTabOpen
                                        ? "rgba(21, 13, 48, 0.63)"
                                        : "transparent",
                            }}
                            onClick={() => {
                               setFieldActivityOpen(false);
                                setDashboardOpen(false)
                                setMastersOpen(false)
                                setAccountTabOpen(!accountTabOpen)
                                setTransactionOpen(false)
                                setReportsOpen(false)
                                setExtractOpen(false)
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 25,
                                    paddingLeft: isAccountActive ? "4px" : null,
                                }}>
                                <FaFile color="white" fontSize={isMobile ? 11 : 13} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Accounts"
                                primaryTypographyProps={{
                                    fontWeight: "500",
                                    fontSize: isMobile ? "0.95rem" : "1rem",
                                }}
                            />
                            {accountTabOpen ? (
                                <ExpandLess sx={{ fontSize: "18px" }} />
                            ) : (
                                <ExpandMore sx={{ fontSize: "18px" }} />
                            )}

                        </ListItem>
                        <Collapse in={accountTabOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem
                                    component={Link}
                                    to="/customers/AllDoctors/"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/customers/AllDoctors/"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Account List"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/extract"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/extract"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Account Extract"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/Customers/CreateDoctor"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/Customers/CreateDoctor"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Add New Request"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/customers/AllDoctors/"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/customers/AllDoctors/"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Approval Request"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/customers/account_transfer/"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/customers/account_transfer/"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Account Transfer"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>

                            </List>
                        </Collapse>

                    </div>
                    <div style={{ marginTop: transactionOpen ? "2px" : "0px", }}>
                        <ListItem
                            sx={{
                                cursor: "pointer",
                                backgroundColor:
                                    accountTabOpen
                                        ? "rgba(21, 13, 48, 0.63)"
                                        : "transparent",
                            }}
                            onClick={() => {
                                setFieldActivityOpen(false);
                                setDashboardOpen(false)
                                setMastersOpen(false)
                                setAccountTabOpen(false)
                                setTransactionOpen(!transactionOpen)
                                setReportsOpen(false)
                                setExtractOpen(false)
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 25,
                                    paddingLeft: isTransactionActive ? "4px" : null,
                                }}>
                                <FaExchangeAlt color="white" fontSize={isMobile ? 11 : 13} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Transactions"
                                primaryTypographyProps={{
                                    fontWeight: "500",
                                    fontSize: isMobile ? "0.95rem" : "1rem",
                                }}
                            />
                            {transactionOpen ? (
                                <ExpandLess sx={{ fontSize: "18px" }} />
                            ) : (
                                <ExpandMore sx={{ fontSize: "18px" }} />
                            )}

                        </ListItem>
                        <Collapse in={transactionOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem
                                    component={Link}
                                    to="/reports/sec_sales_data"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/sec_sales_data"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Data Submission Status"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/upload_closing"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/upload_closing"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Closing Upload"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/input/uploadbilling"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/input/uploadbilling"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="pri.Sales Upload"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/input/stock_sales"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/input/stock_sales"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Stock & Sales Upload"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                            </List>
                        </Collapse>

                    </div>
                    <div style={{ marginTop: reportsOpen ? "2px" : "0px", }}>
                        <ListItem
                            sx={{
                                cursor: "pointer",
                                backgroundColor:
                                    reportsOpen
                                        ? "rgba(21, 13, 48, 0.63)"
                                        : "transparent",
                            }}
                            onClick={() => {
                                setFieldActivityOpen(false);
                                setDashboardOpen(false)
                                setMastersOpen(false)
                                setAccountTabOpen(false)
                                setTransactionOpen(false)
                                setReportsOpen(!reportsOpen)
                                setExtractOpen(false)
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 25,
                                    paddingLeft: isReportActive ? "4px" : null,
                                }}>
                                <FaRegChartBar color="white" fontSize={isMobile ? 11 : 13} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Reports"
                                primaryTypographyProps={{
                                    fontWeight: "500",
                                    fontSize: isMobile ? "0.95rem" : "1rem",
                                }}
                            />
                            {reportsOpen ? (
                                <ExpandLess sx={{ fontSize: "18px" }} />
                            ) : (
                                <ExpandMore sx={{ fontSize: "18px" }} />
                            )}

                        </ListItem>
                        <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem
                                    component={Link}
                                    to="/reports/stock_salesReport"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/stock_salesReport"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Stock and Sales Report"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/active_sales"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/active_sales"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Active Sales Hierachy Report"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/data_submission_log"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/data_submission_log"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Data Submission Log"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/getfieldActivity"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/getfieldActivity"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Daily Activity"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/primary_order"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/primary_order"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Primary Order"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/pcm_kam"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/pcm_kam"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Order Report"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/outlet_count"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/outlet_count"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Outlet Count"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/capability_report"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/capability_report"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="KPI Report"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                            </List>
                        </Collapse>

                    </div>
                    <div style={{ marginTop: extractOpen ? "2px" : "0px", }}>
                        <ListItem
                            sx={{
                                cursor: "pointer",
                                backgroundColor:
                                    extractOpen
                                        ? "rgba(21, 13, 48, 0.63)"
                                        : "transparent",
                            }}
                            onClick={() => {
                               setFieldActivityOpen(false);
                                setDashboardOpen(false)
                                setMastersOpen(false)
                                setAccountTabOpen(false)
                                setTransactionOpen(false)
                                setReportsOpen(false)
                                setExtractOpen(!extractOpen)
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 25,
                                    paddingLeft: isExtractActive ? "4px" : null,
                                }}>
                                <AiOutlineFileExcel color="white" fontSize={isMobile ? 11 : 13} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Extract"
                                primaryTypographyProps={{
                                    fontWeight: "500",
                                    fontSize: isMobile ? "0.95rem" : "1rem",
                                }}
                            />
                            {reportsOpen ? (
                                <ExpandLess sx={{ fontSize: "18px" }} />
                            ) : (
                                <ExpandMore sx={{ fontSize: "18px" }} />
                            )}

                        </ListItem>
                        <Collapse in={extractOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem
                                    component={Link}
                                    to="/reports/extract_new"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/extract_new"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Account Extract"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/active_sales_new"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/active_sales_new"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Sales Hierachy"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/getfieldActivity_new"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/getfieldActivity_new"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Daily Activity"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/primary_order_new"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/primary_order_new"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Primary Order"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/pcm_kam_new"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/pcm_kam_new"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Order Report"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/stk_sales_summary"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/stk_sales_summary"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Stock & Sales Summary"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/stk_sales_details"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/stk_sales_details"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Stock & Sales Details"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                                <ListItem
                                    component={Link}
                                    to="/reports/reg_sec_sales"
                                    sx={{
                                        pl: 4,
                                        backgroundColor: location.pathname.startsWith(
                                            "/reports/reg_sec_sales"
                                        )
                                            ? "rgba(255, 255, 255, 0.2)}"
                                            : "transparent",
                                    }}
                                >
                                    <ListItemText
                                        primary="Regionwise Secondary Sales"
                                        primaryTypographyProps={{
                                            fontSize: isMobile ? "0.9rem" : "0.97rem",
                                            marginLeft: "2.5rem",
                                        }}
                                    />
                                </ListItem>
                            </List>
                        </Collapse>

                    </div>
                </List>


            </Drawer>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    overflow: "hidden",
                }}
            >
                <AppBar
                    position="static"
                    sx={{
                        backgroundColor: "white",
                        color: "#3c4043",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                        height: "56px",
                        display: "flex",
                        justifyContent: "center",
                        borderBottom: "1px solid #e0e0e0",
                    }}
                >
                    <Toolbar
                        sx={{
                            minHeight: "56px !important",
                            paddingLeft: isMobile ? "12px" : "16px",
                            paddingRight: isMobile ? "12px" : "16px",
                        }}
                    >
                        {/* Menu toggle button */}
                        <IconButton
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{
                                color: "#5f6368",
                                marginRight: "16px",
                                bgcolor: "#b5babf",
                                borderRadius: "3px",
                                padding: "4px 10px",
                                "&:hover": {
                                    bgcolor: "#b5babf",
                                    color: "#5f6368",
                                },
                            }}
                        >
                            <MenuIcon sx={{ color: "white", fontSize: '18px' }} />
                        </IconButton>
                        <Box
                            sx={{
                                display: "flex",
                                mr: 2,
                                visibility: isMobile
                                    ? { xs: "hidden", sm: "visible" }
                                    : "visible",
                                width: isMobile ? { xs: '15%' } : null
                            }}
                        >
                            <Typography
                                sx={{
                                    color: '#000000',
                                    fontSize: '1.7rem',
                                    mt: 0.1,
                                    fontFamily: "'Poppins', sans-serif",
                                    fontWeight: 500
                                }}
                            >
                                salestrak
                            </Typography>
                            <Box>
                                <img
                                    src={statincreaseimg}
                                    alt=" Logo"
                                    style={{ width: isMobile ? "2rem" : "2rem", alignSelf: 'start', marginTop: '0.1rem' }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ flexGrow: 1 }} />
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <img
                                src={camlinLogo}
                                alt="camlin Logo"
                                style={{ width: isMobile ? "4rem" : "6.3rem" }}

                            />
                        </Box>

                        <IconButton
                            color="inherit"
                            sx={{
                                color: "#5f6368",
                                mr: 1,
                                alignItems: "center",
                                "&:hover": {
                                    backgroundColor: "rgba(0,0,0,0.04)",
                                },
                            }}
                            id="basic-button"
                            aria-controls={open ? "basic-menu" : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? "true" : undefined}
                            onClick={handleClick}
                        >
                            <Badge
                                // badgeContent={notificationCount[0]?.NofificationCnt}
                                color="error"
                                sx={{
                                    "& .MuiBadge-badge": {
                                        backgroundColor: "#f44336",
                                        color: "white",
                                    },
                                }}
                            >
                                <NotificationsIcon sx={{ fontSize: "20px" }} />
                            </Badge>
                        </IconButton>
                        <Menu
                            id="basic-menu"
                            anchorEl={anchorEl1}
                            open={open}
                            onClose={handleClose}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "left",
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "center",
                            }}
                            PaperProps={{
                                sx: {
                                    width: "300px",
                                    height: "400px",
                                    padding: "0px", // Remove padding from PaperProps since we'll handle it inside
                                    fontSize: "1rem",
                                    color: "#212529",
                                    backgroundColor: "#fff",
                                    border: "1px solid rgba(0, 0, 0, 0.15)",
                                    boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.175)",
                                    display: "flex",
                                    flexDirection: "column",
                                    overflow: "hidden", // Important: prevents double scrollbars
                                },
                            }}
                        >

                        </Menu>
                        <Box sx={{ mr: { md: 10, sm: '8%', xs: '8%' } }}>
                            <img src={adminImage} alt="admin_icon_image" height="22px" />
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'end' }}>
                                <Typography sx={{ color: "#888888", fontSize: { xs: "0.8rem", sm: "1rem" }, marginRight: { sm: '1rem', lg: '1rem', md: '1rem', xs: '0rem' }, alignSelf: 'center' }}>
                                    Welcome
                                </Typography>
                                <IconButton edge="end" onClick={handleMenuClick} sx={{ p: 0 }}>
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: "Black",
                                            color: "white",
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {/* {userData?.name?.split(' ').map(n => n[0]).join('') || 'SA'} */}
                                    </Avatar>
                                </IconButton>
                                <Menu
                                    id="menu-appbar"
                                    anchorEl={anchorEl}
                                    anchorOrigin={{
                                        vertical: "bottom",
                                        horizontal: "right",
                                    }}
                                    transformOrigin={{
                                        vertical: "top",
                                        horizontal: "right",
                                    }}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                    PaperProps={{
                                        elevation: 3,
                                        sx: {
                                            minWidth: "200px",
                                            borderRadius: "8px",
                                            marginTop: "8px",
                                            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                            border: "1px solid #e0e0e0",
                                        },
                                    }}
                                >
                                    <MenuItem disabled sx={{ opacity: 1 }}>
                                        <Typography
                                            variant="body2"
                                        >
                                            User Name
                                        </Typography>
                                    </MenuItem>
                                    <MenuItem
                                        onClick={async () => {
                                            handleMenuClose();
                                            showLogoutConfirmation()
                                        }}
                                    >
                                        <ListItemIcon>
                                            <ExitToAppIcon sx={{ color: "#5f6368", fontSize: "1rem" }} />
                                        </ListItemIcon>
                                        <Typography variant="body2">Logout</Typography>
                                    </MenuItem>
                                </Menu>
                            </Typography>
                        </Box>
                    </Toolbar>

                </AppBar>
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        overflow: "auto",
                        backgroundColor: "#f8f9fa",
                    }}
                >
                    {children}
                </Box>
                <div className="footer">
                    <div className="float-right"></div>
                    <div style={{ padding: 8 }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            <Typography sx={{ fontSize: '11.2px' }}>Powered by Sidssol</Typography>
                        </div>
                    </div>
                </div>

            </Box>
            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={closeConfirmationDialog}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                cancelText={confirmationDialog.cancelText}
                loading={confirmationDialog.loading}
                confirmColor={confirmationDialog.confirmColor}
            />

        </Box>
    )

}

export default Layout