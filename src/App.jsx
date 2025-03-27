import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import CardTypes from "./pages/cardTypes";
import Login from "./pages/Login";
import StoreMembers from "./pages/StoreMembers"; 

function Layout({ children }) {
  const location = useLocation();
  const applyMargin = ["/home", "/analytics", , "/cardTypes"].includes(location.pathname);
  
  return (
    <div className={`flex flex-row-reverse h-screen bg-gray-100 ${applyMargin ? "mr-64" : ""}`}>
      <div className="flex-1 h-screen">{children}</div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* ✅ Redirect from root `/` to `/home` */}
          <Route path="/" element={<Navigate to="/home" />} />
          
          <Route path="/home" element={<Home />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/cardTypes" element={<CardTypes />} />
          <Route path="/store-members" element={<StoreMembers />} />
          <Route path="/login" element={<Login />} />
          
          {/* ✅ Redirect any undefined route to `/home` */}
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
