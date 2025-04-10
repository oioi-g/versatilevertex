import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Container, Box, Typography, TextField, Button, Paper, Link as MuiLink, Snackbar, Alert, CircularProgress } from '@mui/material';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(`Password reset email sent to ${email}. Check your inbox!`);
      setEmail('');
    } 
    catch (err) {
      console.error('Password reset error:', err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          break;
        default:
          setError('Failed to send reset email. Please try again.');
      }
    } 
    finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 3, color: '#214224', fontFamily: 'TanPearl, sans-serif' }}>
          Reset Your Password
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Email Address" type="email" variant="outlined" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} error={!!error} helperText={error} sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#214224' }, '&:hover fieldset': { borderColor: '#214224' }}}} />
          
          <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 2, backgroundColor: '#214224', color: '#f0f0f0', '&:hover': { backgroundColor: '#f0f0f0', color: '#214224', border: '1px solid #214224' }}}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Remember Your Password?{' '}
            <MuiLink component={Link} to="/loginpage" sx={{ color: '#214224', textDecoration: 'underline', '&:hover': { color: '#1a2e1a' }}}>
              Log In Instead
            </MuiLink>
          </Typography>
        </Box>
      </Paper>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ForgotPasswordPage;