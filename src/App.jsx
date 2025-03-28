import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import CardTypes from "./pages/cardTypes";
import Login from "./pages/Login";
import StoreMembers from "./pages/StoreMembers"; 
import CashierPage from './pages/CashierPage';

function Layout({ children }) {
  const location = useLocation();
  const applyMargin = ["/home", "/analytics", , "/cardTypes"].includes(location.pathname);
  
  return (
    <div className={`flex flex-row-reverse h-screen bg-gray-100 ${applyMargin ? "mr-64" : ""}`}>
      <div className="flex-1 h-screen">{children}</div>
    </div>
  );
}


const ProtectedRoute = ({ children }) => {
  const userRole = localStorage.getItem("user_role");
  if (userRole !== "admin") {
    return <Navigate to="/cashier" replace />;
  }
  return children;
};




function App() {
  return (
    <Router>
      <Layout>
      <Routes>
  {/* Root redirection */}
  <Route path="/" element={
    localStorage.getItem("user_role") === "admin"
      ? <Navigate to="/home" />
      : localStorage.getItem("user_role") === "user"
      ? <Navigate to="/cashier" />
      : <Navigate to="/login" />
  } />

  {/* Admin pages */}
  <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
  <Route path="/cardTypes" element={<ProtectedRoute><CardTypes /></ProtectedRoute>} />
  <Route path="/store-members" element={<ProtectedRoute><StoreMembers /></ProtectedRoute>} />

  {/* Cashier page */}
  <Route path="/cashier" element={<CashierPage />} />

  {/* Public */}
  <Route path="/login" element={<Login />} />

  {/* Fallback */}
  <Route path="*" element={<Navigate to="/" />} />
</Routes>


      </Layout>
    </Router>
  );
}

export default App;