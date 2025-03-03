import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { FaHome, FaSignOutAlt } from "react-icons/fa";
import { TbDeviceDesktopAnalytics } from "react-icons/tb";
import { FaCreditCard } from "react-icons/fa";
import { Link } from "react-router-dom";

const SidebarNav = () => {
  return (
    <Drawer
      variant="permanent"
      anchor="right"
      sx={{
        width: 256,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 256,
          boxShadow: "2px 0px 10px rgba(0,0,0,0.1)",
        },
      }}
    >
      {/* Logo */}
      <div className="p-4 text-center border-b border-gray-300">
        <h1 className="text-xl font-bold text-4xl" style={{ fontFamily: "'Allura', cursive", fontSize: '30px' }}>
          Rapido Pay
        </h1>
      </div>

      {/* Sidebar Menu */}
      <List>
      <ListItem disablePadding>
        <ListItemButton component={Link} to="/home">
          <ListItemIcon>
            <FaHome size={30} />
          </ListItemIcon>
          <ListItemText 
            primary="الصفحة الرئيسية" 
            sx={{ textAlign: "right", fontSize: "1.2rem", "& .MuiTypography-root": { fontSize: "1.2rem", fontWeight: "bold" } }} 
          />
        </ListItemButton>
      </ListItem>


        <ListItem disablePadding>
          <ListItemButton component={Link} to="/analytics">
            <ListItemIcon>
              <TbDeviceDesktopAnalytics size={30} />
            </ListItemIcon>
            <ListItemText 
              primary="التحليلات البيانية" 
              sx={{ textAlign: "right", fontSize: "1.2rem", "& .MuiTypography-root": { fontSize: "1.2rem", fontWeight: "bold" } }} 
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/cardTypes">
            <ListItemIcon>
              <FaCreditCard size={30} />
            </ListItemIcon>
            <ListItemText 
            primary="بطاقات المتجر" 
              sx={{ textAlign: "right", fontSize: "1.2rem", "& .MuiTypography-root": { fontSize: "1.2rem", fontWeight: "bold" } }} 
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/login">
            <ListItemIcon>
              <FaSignOutAlt size={30}/>
            </ListItemIcon>
            <ListItemText 
              primary="تسجيل الخروج" 
              sx={{ textAlign: "right", fontSize: "1.2rem", "& .MuiTypography-root": { fontSize: "1.2rem", fontWeight: "bold" } }} 
              />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default SidebarNav;
