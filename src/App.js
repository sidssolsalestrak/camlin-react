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
            <Route path='/masters/zone_mas' element={<Zone />} />
            <Route path='/masters/region' element={<Region />} />
            <Route path='/masters/ter_mas' element={<Territory />} />
            <Route path='/masters/beat_mas' element={<Beat />} />
            <Route path='/masters/area_mas' element={<Area />} />

            <Route path='/masters/cat' element={<ProductCategory />} />
            <Route path='/masters/catSub' element={<ProductSubCategory />} />
            <Route path='/masters/dept' element={<Department />} />
            <Route path='/masters/designation' element={<Designation />} />
            <Route path='/masters/city_mas' element={<City />} />
          </Routes>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
