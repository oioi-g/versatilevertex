import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/loginpage");
    } catch (error) {
      console.error("Logout failed", error);
      alert("Failed to logout. Please try again.");
    }
  };

  const hideLogout =  location.pathname === "/loginpage" || location.pathname === "/" || location.pathname === "/forgotpasswordpage";
  const hideNavLinks =  location.pathname === "/loginpage" || location.pathname === "/" || location.pathname === "/forgotpasswordpage";

  const isActive = (path) => location.pathname === path;

  return (
    <div>
      <AppBar position="fixed" sx={{ backgroundColor: '#214224', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', top: '0', left: '0' }} >
        <Toolbar sx={{ width: '100%', justifyContent: 'space-between', position: 'relative' }} >
          <Typography variant="h4" sx={{ color: '#f0f0f0', fontFamily: 'TanPearl, sans-serif', letterSpacing: '2px', flexGrow: 1, textAlign: 'center' }} >
            Versatile Vertex
          </Typography>

          {!hideLogout && (
            <Button onClick={handleLogout} sx={{ position: 'absolute', right: '50px', backgroundColor: '#f0f0f0', color: '#214224', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', fontFamily: 'TanPearl, sans-serif', textTransform: 'none', '&:hover': { backgroundColor: '#214224', color: '#f0f0f0', border: '1px solid #f0f0f0' } }} >
              Logout
            </Button>
          )}
        </Toolbar>

        {!hideNavLinks && (
          <Toolbar sx={{ justifyContent: 'center', gap: 2 }}>
            <Button component={Link} to="/homepage" sx={{ color: '#f0f0f0', fontWeight: 'bold', textTransform: 'none', fontFamily: "'TanPearl', sans-serif", borderBottom: isActive('/homepage') ? '3px solid #f0f0f0' : 'none' }} >
              Home
            </Button>
            <Button component={Link} to="/userboardspage" sx={{ color: '#f0f0f0', fontWeight: 'bold', textTransform: 'none', fontFamily: "'TanPearl', sans-serif", borderBottom: isActive('/userboardspage') ? '3px solid #f0f0f0' : 'none' }} >
              Moodboard
            </Button>
            <Button component={Link} to="/userprofilepage" sx={{ color: '#f0f0f0', fontWeight: 'bold', textTransform: 'none', fontFamily: "'TanPearl', sans-serif", borderBottom: isActive('/userprofilepage') ? '3px solid #f0f0f0' : 'none' }} >
              Profile
            </Button>
            <Button component={Link} to="/userdashboardpage" sx={{ color: '#f0f0f0', fontWeight: 'bold', textTransform: 'none', fontFamily: "'TanPearl', sans-serif", borderBottom: isActive('/userdashboardpage') ? '3px solid #f0f0f0' : 'none' }} >
              Dashboard
            </Button>
            <Button component={Link} to="/userdesignchallengespage" sx={{ color: '#f0f0f0', fontWeight: 'bold', textTransform: 'none', fontFamily: "'TanPearl', sans-serif", borderBottom: isActive('/userdesignchallengespage') ? '3px solid #f0f0f0' : 'none' }} >
              Design
            </Button>
            <Button component={Link} to="/faqspage" sx={{ color: '#f0f0f0', fontWeight: 'bold', textTransform: 'none', fontFamily: "'TanPearl', sans-serif", borderBottom: isActive('/faqspage') ? '3px solid #f0f0f0' : 'none' }} >
              FAQs
            </Button>
            <Button component={Link} to="/aboutuspage" sx={{ color: '#f0f0f0', fontWeight: 'bold', textTransform: 'none', fontFamily: "'TanPearl', sans-serif", borderBottom: isActive('/aboutuspage') ? '3px solid #f0f0f0' : 'none' }} >
              About Us
            </Button>
          </Toolbar>
        )}
      </AppBar>
    </div>
  );
};

export default Header;