import React, { useState, useEffect } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import "./layout.css";
import api from "./services/api";

const Layout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);

  const [menuHtml, setMenuHtml] = useState("");
  const [menuUrls, setMenuUrls] = useState([]);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await api.post("/getMenuDetails");
      console.log("Menu API response:", res);
      const data = res.data;

      if (data.status === 200) {
        setMenuHtml(data.data.menudata);
        setMenuUrls(data.data.menuurl);
      }
    } catch (err) {
      console.log("Menu fetch error:", err);
    }
  };

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

  useEffect(() => {
    window.acc_stat_view = (acc_stat, num, url) => {
      console.log("Clicked:", acc_stat, num, url);

      // redirect
      window.location.href = url;
    };
  }, []);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: 220,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 220,
            backgroundColor: "#F5A623",
            color: "white",
            overflowY: "auto",
          },
        }}
      >
        <Box sx={{ paddingTop: "60px" }}>
          <div
            className="php-menu"
            dangerouslySetInnerHTML={{ __html: menuHtml }}
          />
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* HEADER */}
        <AppBar position="static" sx={{ background: "#fff", color: "#000" }}>
          <Toolbar>
            <IconButton onClick={toggleDrawer}>
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" sx={{ ml: 2 }}>
              SalesTrak
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, p: 2, background: "#f5f5f5" }}>{children}</Box>

        <Box sx={{ textAlign: "center", p: 1, fontSize: "12px" }}>
          Powered by Sidssol
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
