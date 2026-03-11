import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import camlinLogo from "./assets/kc.png";
import {
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Divider,
    ListItemIcon,
    Avatar,
    Badge,
    useMediaQuery,
    useTheme,
    styled,
    Tooltip,
    tooltipClasses,
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
    const [anchorEl, setAnchorEl] = useState(null);
    const [anchorEl1, setAnchorEl1] = React.useState(null);
    const open = Boolean(anchorEl1);



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

    return (
        <Box sx={{ display: "flex", height: "100vh", }}>
            {/* <Drawer
                variant={isMobile ? "temporary" : "persistent"}
                open={drawerOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    width: drawerOpen ? 221 : 0,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: 221,
                        boxSizing: "border-box",
                        backgroundColor: "#81af41",
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

                </Box>
            </Drawer> */}
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
                                    style={{ width: isMobile ? "2rem" : "2rem", alignSelf: 'start' }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ flexGrow: 1 }} />
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <img
                                src={camlinLogo}
                                alt="camlin Logo"
                                style={{ width: isMobile ? "4rem" : "6rem" }}

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
                                            sx={{ fontWeight: "500", color: "#3c4043" }}
                                        >
                                         User Name
                                        </Typography>
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

            </Box>


        </Box>
    )

}

export default Layout