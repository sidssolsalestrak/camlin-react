import "./App.css";
import Dashboard from "./dashboard/Dashboard";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TokenHandler from "./services/TokenHandler";
import { SnackbarProvider } from "notistack";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import theme from "./theme";
import Zone from "./Masters/geographical/Zone";
import Territory from "./Masters/geographical/Territory";
import Region from "./Masters/geographical/Region";
import Beat from "./Masters/geographical/Beat";
import Area from "./Masters/geographical/Area";
import AccountMas from "./dashboard/view/account/AccountMas";
import ProductCategory from "./Masters/main/productCategory/ProductCategory";
import ProductSubCategory from "./Masters/main/productSubCategory/ProductSubCategory";
import Department from "./Masters/main/department/Department";
import Designation from "./Masters/main/designation/Designation";
import City from "./Masters/main/city/City";
import ReportingTabs from "./Masters/AdminPanel/ReportingTabs";
import MenuMaster from "./Masters/AdminPanel/MenuMaster";
import AppWidgetMaster from "./Masters/AdminPanel/AppWidgetMaster";
import AppVersion from "./Masters/AdminPanel/AppVersion";
import WebMenuMaster from "./Masters/AdminPanel/WebMenuMaster";
import AddProduct from "./Masters/main/product/AddProduct";
import ViewProduct from "./Masters/main/product/ViewProduct";
import Stockist from "./Masters/main/stockist/Stockist";
import AwsLogs from "./Masters/AdminPanel/AwsLogs";
import ApiProcessing from "./Masters/AdminPanel/ApiProcessing";
import EDetailingMaster from "./Masters/AdminPanel/EDetailingMaster";

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
          <Route
            path="/masters/ter_mas/:editTeritoryId?"
            element={<Territory />}
          />
          <Route path="/masters/beat_mas/:editBeatId?" element={<Beat />} />
          <Route path="/masters/area_mas/:editAreaId?" element={<Area />} />
          {/* main master routes */}
          <Route path="/masters/cat/:id?" element={<ProductCategory />} />
          <Route path="/masters/catSub/:id?" element={<ProductSubCategory />} />
          <Route path="/masters/dept/:id?" element={<Department />} />
          <Route path="/masters/designation/:id?" element={<Designation />} />
          <Route path="/masters/city_mas/:id?" element={<City />} />
          {/* Admin Panel master routes */}
          <Route
            path="/masters/repTabs/:userId?/:cusId?"
            element={<ReportingTabs />}
          />
          <Route path="/masters/prod_mas/:id?" element={<AddProduct />} />
          <Route path="/masters/prodview" element={<ViewProduct />} />
          <Route path="/masters/stockist" element={<Stockist />} />

          <Route
            path="/customers/AllDoctors/:reqType?/:country?/:user?/:userType?/:cusReq?/:beatId?/:login_id?"
            element={<AccountMas />}
          />
          <Route path="/masters/menuMaster/:menuId?" element={<MenuMaster />} />
          <Route
            path="/masters/dashboardmaster/:editwidgetId?"
            element={<AppWidgetMaster />}
          />
          <Route
            path="/masters/appversion/:editappvid?"
            element={<AppVersion />}
          />
          <Route
            path="/masters/webMenuMaster/:editwebmenuId?"
            element={<WebMenuMaster />}
          />
          <Route   path="/Processlist/planprocess/:frmDate?/:processType?/:userli?/:processSts?"  
          element={<AwsLogs />}  />
          <Route path="/AdminPanel/ApiProcessing" element={<ApiProcessing />}   />
          <Route path="/masters/edetailing/:editEdetailing?"  element={<EDetailingMaster />}    />
        </Routes>
      </BrowserRouter>
      {/* </SnackbarProvider> */}
    </ThemeProvider>
  );
}

export default App;
