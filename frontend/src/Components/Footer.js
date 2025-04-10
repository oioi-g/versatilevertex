import React from "react";
// import { Link } from "react-router-dom";
import { AppBar, Toolbar, IconButton } from '@mui/material';
import { Facebook, Twitter, Instagram } from '@mui/icons-material';

const Footer = () => {
    return (
        <div>
            <AppBar position="static" sx={{ top: 'auto', bottom: 0, backgroundColor: '#214224', boxShadow: '0 -2px 5px rgba(0,0,0,0.1)' }} >
                <Toolbar sx={{ justifyContent: 'center', gap: 2 }}>
                    <IconButton href="https://www.facebook.com" target="_blank" sx={{ color: '#f0f0f0' }}>
                        <Facebook />
                    </IconButton>
                    <IconButton href="https://www.twitter.com" target="_blank" sx={{ color: '#f0f0f0' }}>
                        <Twitter />
                    </IconButton>
                    <IconButton href="https://www.instagram.com" target="_blank" sx={{ color: '#f0f0f0' }}>
                        <Instagram />
                    </IconButton>
                </Toolbar>
            </AppBar>
        </div>
    );
};

export default Footer;