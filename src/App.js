import "./App.css";
import Dashboard from "./dashboard/Dashboard";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TokenHandler from "./services/TokenHandler";
import { SnackbarProvider } from "notistack";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import theme from "./theme";
import Zone from "./Masters/Zone";
import Territory from "./Masters/Territory";
import Region from "./Masters/Region";
import Beat from "./Masters/Beat";
import Area from "./Masters/Area";
import AccountMas from "./dashboard/view/account/AccountMas";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* <SnackbarProvider maxSnack={3}> */}
      <BrowserRouter>
        <Routes>
          <Route path="/:token" element={<TokenHandler />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/masters/zone_mas/:editZoneid?" element={<Zone />} />
          <Route path="/masters/region/:editRegionId?" element={<Region />} />
          <Route path="/masters/ter_mas" element={<Territory />} />
          <Route path="/masters/beat_mas" element={<Beat />} />
          <Route path="/masters/area_mas/:editAreaId?" element={<Area />} />

          <Route
            path="/customers/AllDoctors/:reqType?/:country?/:user?/:userType?/:cusReq?/:beatId?/:login_id?"
            element={<AccountMas />}
          />
        </Routes>
      </BrowserRouter>
      {/* </SnackbarProvider> */}
    </ThemeProvider>
  );
}

export default App;
