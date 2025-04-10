import React, { useState } from 'react';
import { Box, Typography, Button, Modal, IconButton, Container } from '@mui/material';
import { Close, Delete } from '@mui/icons-material';

const ReportCard = ({ report, onClose, onDelete, onDeleteReportOnly }) => {
    const [isDeletePressed, setIsDeletePressed] = useState(false);
    const [isDeleteReportPressed, setIsDeleteReportPressed] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  
    return (
      <Container>
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Box sx={{ backgroundColor: '#214224', borderRadius: '8px', padding: '16px', maxWidth: '500px', width: '100%', position: 'relative', color: '#f0f0f0' }}>
            <IconButton sx={{ position: 'absolute', top: '8px', right: '8px', color: '#f0f0f0' }} onClick={onClose}>
              <Close />
            </IconButton>
      
            <Typography variant="h5" sx={{ marginBottom: '16px', fontFamily: "'TanPearl', sans-serif" }}>
              Report Details
            </Typography>
      
            {report.contentUrl && (
              <img src={report.contentUrl} alt="Reported content" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', marginBottom: '16px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
            )}
      
            <Box sx={{ marginBottom: '16px' }}>
              <Typography variant="subtitle1" sx={{ fontFamily: "'TanPearl', sans-serif" }}>
                <strong>Reason:</strong> {report.reason}
              </Typography>

              <Typography variant="subtitle1" sx={{ fontFamily: "'TanPearl', sans-serif" }}>
                <strong>Reported At:</strong> {new Date(report.reportedAt?.seconds * 1000).toLocaleString()}
              </Typography>

              <Typography variant="subtitle1" sx={{ fontFamily: "'TanPearl', sans-serif" }}>
                <strong>Reporter ID:</strong> {report.reporterId}
              </Typography>
            </Box>
      
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="contained" onMouseDown={() => setIsDeleteReportPressed(true)} onMouseUp={() => setIsDeleteReportPressed(false)} onMouseLeave={() => setIsDeleteReportPressed(false)} sx={{ fontFamily: "'TanPearl', sans-serif", backgroundColor: isDeleteReportPressed ? '#ff5757' : '#f0f0f0', color: isDeleteReportPressed ? '#f0f0f0' : '#214224', '&:hover': { backgroundColor: '#ff5757', color: '#f0f0f0' }}} onClick={() => setShowDeleteReportModal(true)}>
                  Delete Report Only
              </Button>
              
              <IconButton 
                  sx={{ color: isDeletePressed ? '#ff5757' : '#f0f0f0', transition: 'color 0.2s ease', fontFamily: "'TanPearl', sans-serif", backgroundColor: isDeletePressed ? "#f0f0f0" : "transparent", '&:hover': { backgroundColor: '#f0f0f0', color: '#ff5757' }}} onMouseDown={() => setIsDeletePressed(true)} onMouseUp={() => setIsDeletePressed(false)} onMouseLeave={() => setIsDeletePressed(false)} onClick={() => setShowDeleteModal(true)}>
                <Delete />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ marginBottom: 2, fontFamily: "'TanPearl', sans-serif" }}>
              Confirm Deletion
            </Typography>

            <Typography sx={{ marginBottom: 3, fontFamily: "'TanPearl', sans-serif" }}>
              Are you sure you want to delete this {report?.type} and its report? This action cannot be undone.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={() => setShowDeleteModal(false)} sx={{ fontFamily: "'TanPearl', sans-serif" }}>
                Cancel
              </Button>

              <Button variant="contained" color="error" sx={{ fontFamily: "'TanPearl', sans-serif" }}
              onClick={() => {
                onDelete();
                setShowDeleteModal(false);
              }}>
                Delete
              </Button>
            </Box>
          </Box>
        </Modal>

        <Modal open={showDeleteReportModal} onClose={() => setShowDeleteReportModal(false)}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ marginBottom: 2, fontFamily: "'TanPearl', sans-serif" }}>
              Confirm Deletion
            </Typography>

            <Typography sx={{ marginBottom: 3, fontFamily: "'TanPearl', sans-serif" }}>
              Are you sure you want to delete this report? The content will remain. This action cannot be undone.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={() => setShowDeleteReportModal(false)} sx={{ fontFamily: "'TanPearl', sans-serif" }}>
                Cancel
              </Button>
              
              <Button variant="contained" color="error" sx={{ fontFamily: "'TanPearl', sans-serif" }}
              onClick={() => {
                onDeleteReportOnly();
                setShowDeleteReportModal(false);
              }}>
                Delete Report
              </Button>
            </Box>
          </Box>
        </Modal>
      </Container>
    );
};

export default ReportCard;