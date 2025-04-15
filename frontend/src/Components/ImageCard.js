import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Container } from "@mui/material";
import { Favorite, Bookmark, Close, Report } from '@mui/icons-material';
import ReportDialog from "./ReportDialog";

const ImageCard = ({ image, onClose, onLike, onBookmark, isLiked, likesCount, onReport }) => {
  const [reportOpen, setReportOpen] = useState(false);
  let [currentLikes, setCurrentLikes] = useState(likesCount);
  const [currentIsLiked, setCurrentIsLiked] = useState(isLiked);

  useEffect(() => {
    setCurrentLikes(likesCount);
    setCurrentIsLiked(isLiked);
  }, [likesCount, isLiked]);

  const handleLikeClick = () => {
    if (currentIsLiked) {
      setCurrentLikes(prev => prev - 1);
    } 
    else {
      setCurrentLikes(prev => prev + 1);
    }
    setCurrentIsLiked(!currentIsLiked);
    onLike();
  };

  return (
    <Container>
      <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center',  alignItems: 'center', zIndex: 1000 }}>
        <Box sx={{ backgroundColor: '#214224', borderRadius: '8px', padding: '16px', maxWidth: '500px', width: '100%', position: 'relative' }}>
          <IconButton 
            sx={{ position: 'absolute', top: '8px', right: '8px', color: '#f0f0f0' }} onClick={onClose}>
            <Close />
          </IconButton>

          <img src={image.imageUrl} alt={image.description} style={{ maxWidth: '400px', maxHeight: '400px', width: 'auto', height: 'auto', borderRadius: '8px', marginBottom: '16px', display: 'block', marginRight: 'auto', marginLeft: 'auto', fontFamily: "'TanPearl', sans-serif", fontWeight: 'bold' }} />

          <Typography variant="body1" sx={{ color: '#f0f0f0', marginBottom: '16px', fontFamily: "'TanPearl', sans-serif" }}>
            {image.description.toLowerCase()}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconButton sx={{ color: currentIsLiked ? '#FF5757' : '#f0f0f0' }} onClick={handleLikeClick}>  
                <Favorite />
              </IconButton>
              
              <Typography variant="body2" sx={{ color: '#f0f0f0', fontFamily: "'TanPearl', sans-serif" }}>
                {currentLikes} Likes
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: '8px' }}>
              <IconButton sx={{ color: '#f0f0f0' }} onClick={onBookmark} >
                <Bookmark />
              </IconButton>

              <IconButton sx={{ color: '#f0f0f0' }} onClick={() => setReportOpen(true)}>
                <Report />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onReport={onReport} content={image} />
    </Container>
  );
};

export default ImageCard;