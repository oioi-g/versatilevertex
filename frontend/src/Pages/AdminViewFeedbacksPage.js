import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Rating, IconButton, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';

const AdminViewFeedbacksPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [user, userLoading] = useAuthState(auth);

  const isAdmin = user?.uid === 'v4DdTGxRLtScNyjfXCG5AnXegP43';
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/homepage');
    } 
    else {
      fetchFeedbacks();
    }
  }, [isAdmin, navigate]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "feedback"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const feedbackData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toLocaleString() || 'N/A'
      }));
      setFeedbacks(feedbackData);
    } 
    catch (error) {
      console.error("Error fetching feedbacks:", error);
      setSnackbar({ open: true, message: 'Failed to load feedbacks', severity: 'error' });
    } 
    finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedbackId) => {
    try {
      await deleteDoc(doc(db, "feedback", feedbackId));
      setFeedbacks(feedbacks.filter(f => f.id !== feedbackId));
      setSnackbar({ open: true, message: 'Feedback deleted successfully', severity: 'success' });
    } 
    catch (error) {
      console.error("Error deleting feedback:", error);
      setSnackbar({ open: true, message: 'Failed to delete feedback', severity: 'error' });
    }
  };

  if (userLoading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#214224', fontFamily: 'TanPearl, sans-serif', textAlign: "center" }}>
        User Feedbacks
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Rating</TableCell>
                <TableCell>Feedback</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {feedbacks.length > 0 ? (
                feedbacks.map((feedback) => (
                  <TableRow key={feedback.id} hover>
                    <TableCell>
                      <Rating value={feedback.rating} precision={0.5} readOnly />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {feedback.message}
                      </Typography>
                    </TableCell>
                    <TableCell>{feedback.userEmail}</TableCell>
                    <TableCell>{feedback.createdAt}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleDelete(feedback.id)} color="error" size="small" >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      No feedback found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }} >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminViewFeedbacksPage;