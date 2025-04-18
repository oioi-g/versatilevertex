import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Card, CardContent, Snackbar, Alert } from '@mui/material';
import ReportCard from '../Components/ReportCard';

const AdminViewReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportCard, setShowReportCard] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsRef = collection(db, 'reports');
        const snapshot = await getDocs(reportsRef);
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(reportsData);
        showSnackbar('Reports loaded successfully', 'success');
      } 
      catch (error) {
        console.error('Error fetching reports:', error);
        showSnackbar('Failed to load reports', 'error');
      } 
      finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleViewContent = async (report) => {
    try {
      if (report.type === 'image') {
        const imageDoc = await getDoc(doc(db, 'unsplashImages', report.contentId));
        if (imageDoc.exists()) {
          setSelectedReport({
            ...report,
            contentData: imageDoc.data(),
            contentUrl: imageDoc.data().imageUrl
          });
          setShowReportCard(true);
        }
      } 
      else if (report.type === 'collage') {
        const collageDoc = await getDoc(doc(db, 'publicCollages', report.contentId));
        if (collageDoc.exists()) {
          setSelectedReport({
            ...report,
            contentData: collageDoc.data(),
            contentUrl: collageDoc.data().collage[0]?.imageUrl
          });
          setShowReportCard(true);
        }
      }
    } 
    catch (error) {
      console.error(error);
      showSnackbar('Failed to load content details', 'error');
    }
  };

  const handleDeleteContent = async () => {
    if (!selectedReport) return;
    try {
      if (selectedReport.type === 'image') {
        await deleteDoc(doc(db, 'unsplashImages', selectedReport.contentId));
      } 
      else if (selectedReport.type === 'collage') {
        await deleteDoc(doc(db, 'publicCollages', selectedReport.contentId));
      }
      await deleteDoc(doc(db, 'reports', selectedReport.id));
      setReports(reports.filter(r => r.id !== selectedReport.id));
      setSelectedReport(null);
      setShowReportCard(false);
      showSnackbar('Content and report deleted successfully', 'success');
    } 
    catch (error) {
      console.error('Error deleting content:', error);
      showSnackbar('Failed to delete content', 'error');
    }
  };

  const handleDeleteReportOnly = async () => {
    if (!selectedReport) return;
    try {
      await deleteDoc(doc(db, 'reports', selectedReport.id));
      setReports(reports.filter(r => r.id !== selectedReport.id));
      setSelectedReport(null);
      setShowReportCard(false);
      showSnackbar('Report deleted successfully', 'success');
    } 
    catch (error) {
      console.error('Error deleting report:', error);
      showSnackbar('Failed to delete report', 'error');
    }
  };

  if (loading) {
    return <Typography>Loading reports...</Typography>;
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 3, fontFamily: "'TanPearl', sans-serif", color: "#214224", textAlign: "center" }}>
        Reported Content
      </Typography>

      {reports.length === 0 ? (
        <Typography sx={{ fontFamily: "'TanPearl', sans-serif" }}>No reports found.</Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {reports.map(report => (
            <Card key={report.id} sx={{ backgroundColor: '#214224', cursor: 'pointer', '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.2)', transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }} onClick={() => handleViewContent(report)}>
              <CardContent>
                <Typography variant="h6" sx={{ fontFamily: "'TanPearl', sans-serif", color: "#f0f0f0" }}>
                  {report.type === 'image' ? 'Image Report' : 'Collage Report'}
                </Typography>

                <Typography sx={{ color: "#f0f0f0" }}>
                  <strong>Reason:</strong> {report.reason.substring(0, 50)}{report.reason.length > 50 ? '...' : ''}
                </Typography>

                <Typography sx={{ color: "#f0f0f0" }}>
                  <strong>Date:</strong> {new Date(report.reportedAt?.seconds * 1000).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
        
      {showReportCard && selectedReport && (
        <ReportCard report={selectedReport} onClose={() => setShowReportCard(false)} onDelete={handleDeleteContent} onDeleteReportOnly={handleDeleteReportOnly} />
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminViewReportsPage;