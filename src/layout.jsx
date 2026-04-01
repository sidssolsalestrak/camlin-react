import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import camlinLogo from "./assets/kc.png";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  Box,
  IconButton,
  Menu,
  MenuItem,
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
  ExitToApp as ExitToAppIcon,
} from "@mui/icons-material";
import adminImage from "./assets/bhoruka-cusportal-admin.png";
import ConfirmationDialog from "./utils/confirmDialog";
import { useSnackbar } from "notistack";
import SalesTrekimg from "./assets/salestrakimg.png";
import "./layout.css";
import api from "./services/api";
import { useNavigate } from "react-router-dom";
import { SiChatbot } from "react-icons/si";
import { getUserFromToken } from "./utils/getUserFromToken";
import "font-awesome/css/font-awesome.min.css";

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
  const location = useLocation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Dynamic menu state (from 2nd file)
  const [menuHtml, setMenuHtml] = useState("");
  const [menuUrls, setMenuUrls] = useState([]);

  // Fetch menu on mount
  useEffect(() => {
    fetchMenu();
    loadChatbot();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await api.post("/getMenuDetails");
      const data = res.data;
      if (data.status === 200) {
        let html = data.data.menudata;

        html = html.replace(/href="(?!\/|http)([^"]+)"/g, 'href="/$1"');

        setMenuHtml(html);
        setMenuUrls(data.data.menuurl);
      }
    } catch (err) {
      console.log("Menu fetch error:", err);
    }
  };

  // Wire up treeview toggles after menuHtml renders
  useEffect(() => {
    if (!menuHtml) return;
    const timer = setTimeout(() => {
      const toggles = document.querySelectorAll(".treeview > a");
      toggles.forEach((el) => {
        el.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          const parent = this.parentElement;
          parent.classList.toggle("active");
          const submenu = parent.querySelector(":scope > .treeview-menu");
          if (submenu) {
            submenu.classList.toggle("open");
          }
        };
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [menuHtml]);

  // Highlight active menu item based on current path
  useEffect(() => {
    if (!menuHtml) return;
    const timer = setTimeout(() => {
      const allLinks = document.querySelectorAll(".php-menu a");

      // ✅ Step 1: Clean up ALL previous active classes at every level
      allLinks.forEach((link) => {
        link.classList.remove("menu-active");

        // Walk up and remove both parent-active and parent-active-main from ALL ancestor treeviews
        let currentEl = link.closest(".treeview");
        while (currentEl) {
          currentEl
            .querySelector(":scope > a")
            ?.classList.remove("parent-active");
          currentEl
            .querySelector(":scope > a")
            ?.classList.remove("parent-active-main"); // ✅ new
          currentEl = currentEl
            .closest(".treeview-menu")
            ?.parentElement?.closest(".treeview");
        }
      });

      // ✅ Step 2: Find the matching link and apply active classes
      allLinks.forEach((link) => {
        const onclick = link.getAttribute("onclick") || "";
        const href = link.getAttribute("href") || "";

        const urlMatch = onclick.match(
          /acc_stat_view\([^,]+,\s*[^,]+,\s*'([^']+)'\)/,
        );
        const url = urlMatch ? urlMatch[1] : href.replace(/^\//, "");

        if (url && location.pathname === `/${url}`) {
          // ✅ Highlight the active child link
          link.classList.add("menu-active");

          // ✅ Walk up ALL ancestor treeviews — open and mark each one
          let currentEl = link.closest(".treeview-menu")?.parentElement;
          while (currentEl && currentEl.classList.contains("treeview")) {
            currentEl.classList.add("active");
            currentEl
              .querySelector(":scope > .treeview-menu")
              ?.classList.add("open");

            // ✅ Top-level parent gets different class than sub-parents
            const isTopLevel = !currentEl.closest(".treeview-menu");
            if (isTopLevel) {
              currentEl
                .querySelector(":scope > a")
                ?.classList.add("parent-active-main");
            } else {
              currentEl
                .querySelector(":scope > a")
                ?.classList.add("parent-active");
            }

            // Move up to next ancestor
            currentEl = currentEl.closest(".treeview-menu")?.parentElement;
          }
        }
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [menuHtml, location.pathname]);

  // Global click handler used by menu items
  useEffect(() => {
    window.acc_stat_view = (acc_stat, num, url) => {
      console.log("Clicked:", acc_stat, num, url);
      navigate(`/${url}`);
    };
  }, []);

  // Sync drawer with mobile breakpoint
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

  const handleClick = (event) => {
    setAnchorEl1(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl1(null);
  };

  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmColor: "primary",
  });

  const showConfirmationDialog = (config) => {
    setConfirmationDialog({
      ...confirmationDialog,
      ...config,
      open: true,
    });
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog({
      ...confirmationDialog,
      open: false,
      loading: false,
    });
  };

  const showLogoutConfirmation = () => {
    showConfirmationDialog({
      title: "Confirm Logout",
      message: "Are you sure you want to Logout?",
      confirmText: "Logout",
      confirmColor: "error",
      onConfirm: () => handleLogout(),
    });
  };

  const handleLogout = () => {
    try {
      console.log("Logout Successfully");
      enqueueSnackbar("Logout Successfully", {
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });
    } catch (err) {
      console.log(err);
      enqueueSnackbar("Something went wrong Try again!!", {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });
    } finally {
      closeConfirmationDialog();
    }
  };

  const loadChatbot = () => {
    const user = getUserFromToken();

    if (!user) {
      console.log("User not found");
      return;
    }
    if (document.getElementById("chatbot-script")) {
      return;
    }

    // prevent duplicate load
    if (document.getElementById("chatbot-script")) {
      console.log("Chatbot already loaded");
      return;
    }

    const script = document.createElement("script");
    script.id = "chatbot-script";

    script.src =
      "http://ec2-13-201-74-231.ap-south-1.compute.amazonaws.com/widget/widget.js?v=11";

    script.setAttribute(
      "data-chatbot-url",
      "http://ec2-13-201-74-231.ap-south-1.compute.amazonaws.com/chatbot",
    );
    // script.setAttribute("data-user-id", user.user_id);
    // script.setAttribute("data-user-email", user.email || user.identity);
    // script.setAttribute("data-role", user.user_type || "region_admin");
    // script.setAttribute("data-dataset", user.dataset || "salestrak-camlin");
    // script.setAttribute(
    //   "data-allowed-datasets",
    //   JSON.stringify(["salestrak-camlin"]),
    // );
    // script.setAttribute(
    //   "data-dataset-scope",
    //   JSON.stringify({ reg_name: ["South"] }),
    // );

    script.setAttribute("data-user-id", "schueco_admin");
    script.setAttribute("data-user-email", "admin@schueco.com");
    script.setAttribute("data-company", "schueco");
    script.setAttribute("data-role", "admin");
    script.setAttribute("data-dataset", "schueco-so");
    script.setAttribute(
      "data-allowed-datasets",
      JSON.stringify(["schueco-so", "schueco-invoice"]),
    );
    script.setAttribute("data-dataset-scope", JSON.stringify({}));

    // script.setAttribute("data-user-id", "login_admin_1");
    // script.setAttribute("data-user-email", "admin1@test.com");
    // script.setAttribute("data-role", "gcc_admin_1");
    // script.setAttribute("data-dataset", "salestrak-gcc");

    // script.setAttribute(
    //   "data-allowed-datasets",
    //   JSON.stringify(["salestrak-gcc"]),
    // );

    // script.setAttribute("data-dataset-scope", JSON.stringify({}));

    document.body.appendChild(script);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* ── SIDEBAR DRAWER ── */}
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
            backgroundColor: "#588aae",
            height: "100vh",
            position: "relative",
            overflowY: "auto",
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
        {/* Logo area (kept from 1st file, commented logo preserved) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
          }}
        >
          {/* <img src={SalesTrekimg} alt="SCHÜCO Logo" style={{ height: "29px", marginTop: "0.5rem" }} /> */}
        </Box>

        {/* Dynamic menu rendered from API HTML */}
        <Box sx={{ paddingTop: "2.8rem" }}>
          <div
            className="php-menu"
            dangerouslySetInnerHTML={{ __html: menuHtml }}
          />
        </Box>
      </Drawer>

      {/* ── MAIN CONTENT AREA ── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          overflow: "hidden",
        }}
      >
        {/* ── APPBAR ── */}
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
            {/* Hamburger toggle */}
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
              <MenuIcon sx={{ color: "white", fontSize: "18px" }} />
            </IconButton>

            {/* SalesTrak logo */}
            <Box
              sx={{
                display: "flex",
                visibility: isMobile
                  ? { xs: "hidden", sm: "visible" }
                  : "visible",
                width: isMobile ? { xs: "15%" } : null,
                ml: 1,
              }}
            >
              <Box>
                <img
                  src={SalesTrekimg}
                  alt=" Logo"
                  style={{
                    width: isMobile ? "6rem" : "8rem",
                    alignSelf: "center",
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Camlin logo */}
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <img
                src={camlinLogo}
                alt="camlin Logo"
                style={{ width: isMobile ? "6rem" : "10rem" }}
              />
            </Box>

            {/* Notifications bell */}
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

            {/* Notifications dropdown */}
            <Menu
              id="basic-menu"
              anchorEl={anchorEl1}
              open={open}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "center" }}
              PaperProps={{
                sx: {
                  width: "300px",
                  height: "400px",
                  padding: "0px",
                  fontSize: "1rem",
                  color: "#212529",
                  backgroundColor: "#fff",
                  border: "1px solid rgba(0, 0, 0, 0.15)",
                  boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.175)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                },
              }}
            >
              {/* Notification items go here */}
            </Menu>

            {/* Admin icon */}
            <Box sx={{ mr: { md: 10, sm: "8%", xs: "8%" } }}>
              <img src={adminImage} alt="admin_icon_image" height="22px" />
            </Box>

            {/* Welcome + Avatar + user menu */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "end",
                }}
              >
                <Typography
                  sx={{
                    color: "#888888",
                    fontSize: { xs: "0.8rem", sm: "1rem" },
                    marginRight: {
                      sm: "1rem",
                      lg: "1rem",
                      md: "1rem",
                      xs: "0rem",
                    },
                    alignSelf: "center",
                  }}
                >
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

                {/* User dropdown menu */}
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
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
                    <Typography variant="body2">User Name</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      handleMenuClose();
                      showLogoutConfirmation();
                    }}
                  >
                    <ListItemIcon>
                      <ExitToAppIcon
                        sx={{ color: "#5f6368", fontSize: "1rem" }}
                      />
                    </ListItemIcon>
                    <Typography variant="body2">Logout</Typography>
                  </MenuItem>
                </Menu>
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* ── PAGE CONTENT ── */}
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

        {/* ── FOOTER (only on /dashboard routes) ── */}
        {location.pathname.startsWith("/dashboard") && (
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
                <Typography sx={{ fontSize: "11.2px" }}>
                  Powered by Sidssol
                </Typography>
              </div>
            </div>
          </div>
        )}
      </Box>

      {/* ── CONFIRMATION DIALOG ── */}
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
  );
};

export default Layout;
