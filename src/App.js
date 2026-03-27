import './App.css'
import Dashboard from "./dashboard/Dashboard";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TokenHandler from "./services/TokenHandler";
import { SnackbarProvider } from 'notistack';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@emotion/react';
import theme from './theme';
import Zone from './Masters/Zone';
import Territory from './Masters/Territory';
import Region from './Masters/Region';
import Beat from './Masters/Beat';
import Area from './Masters/Area';
import ProductCategory from './Masters/main/productCategory/ProductCategory';
import ProductSubCategory from './Masters/main/productSubCategory/ProductSubCategory';
import Department from './Masters/main/department/Department';
import Designation from './Masters/main/designation/Designation';
import City from './Masters/main/city/City';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} >
        <BrowserRouter>
          <Routes>
            <Route path="/:token" element={<TokenHandler />} />
            <Route path="/" element={<Dashboard />} />
            <Route path='/masters/zone_mas/:editZoneid?' element={<Zone />} />
            <Route path='/masters/region/:editRegionId?' element={<Region />} />
            <Route path='/masters/ter_mas' element={<Territory />} />
            <Route path='/masters/beat_mas' element={<Beat />} />
            <Route path='/masters/area_mas/:editAreaId?' element={<Area />} />

            <Route path='/masters/cat/:id?' element={<ProductCategory />} />
            <Route path='/masters/catSub/:id?' element={<ProductSubCategory />} />
            <Route path='/masters/dept/:id?' element={<Department />} />
            <Route path='/masters/designation/:id?' element={<Designation />} />
            <Route path='/masters/city_mas/:id?' element={<City />} />
          </Routes>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
