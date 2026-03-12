import Dashboard from "./dashboard/Dashboard";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TokenHandler from "./services/TokenHandler";
function App() {


  return (
   <BrowserRouter>
   <Routes>
    <Route path="/:token" element={<TokenHandler />} />
    <Route path="/" element={<Dashboard  />}   />
   </Routes>
   </BrowserRouter>
  );
}

export default App;
