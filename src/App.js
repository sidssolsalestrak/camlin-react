import Dashboard from "./dashboard/Dashboard";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {


  return (
   <BrowserRouter>
   <Routes>
    <Route path="/" element={<Dashboard  />}   />
   </Routes>
   </BrowserRouter>
  );
}

export default App;
