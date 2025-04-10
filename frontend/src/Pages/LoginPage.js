import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Button, TextField, Container, Box, Typography, Paper, Link as MuiLink, Snackbar, Alert } from '@mui/material';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        await auth.signOut();
        setSnackbar({
          open: true,
          message: 'Please verify your email before logging in. Check your inbox for the verification link.',
          severity: 'warning'
        });
        return;
      }
      setSnackbar({
        open: true,
        message: 'Login successful! Redirecting...',
        severity: 'success'
      });
      setTimeout(() => navigate('/homepage'), 1500); 
    } 
    catch (error) {
      console.error('Login error:', error);
      let message = 'Login failed. Please try again.';
      let fieldErrors = { ...errors };
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Email not registered. Please check or sign up.';
          fieldErrors.email = 'Email not found';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password. Please try again.';
          fieldErrors.password = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          message = 'Too many attempts. Account temporarily locked. Try again later or reset password.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email format. Please check your email.';
          fieldErrors.email = 'Invalid email';
          break;
        default:
          message = error.message;
      }
      setErrors(fieldErrors);
      setSnackbar({
        open: true,
        message,
        severity: 'error'
      });
    } 
    finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: ''
    };
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <div>
      <Container maxWidth={false} sx={{ height: '79.7vh', backgroundColor: '#214224', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, borderRadius: 2, backgroundColor: '#f0f0f0', maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#214224', fontFamily: 'TanPearl, sans-serif' }}>
            Welcome back to<br/>Versatile Vertex 🦋
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField name="email" label="Email" type="email" variant="outlined" fullWidth value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} required sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#214224' }, '&:hover fieldset': { borderColor: '#214224' }}}} />
            
            <TextField name="password" label="Password" type="password" variant="outlined" fullWidth value={formData.password} onChange={handleChange} error={!!errors.password} helperText={errors.password} required sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#214224' }, '&:hover fieldset': { borderColor: '#214224' }}}} />
            
            <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ backgroundColor: '#214224', color: '#f0f0f0', fontFamily: 'TanPearl, sans-serif', textTransform: 'none', '&:hover': { backgroundColor: '#f0f0f0', color: '#214224', border: '1px solid #214224' }, '&:disabled': { backgroundColor: '#cccccc', color: '#666666' }}}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2, color: '#214224' }}>
            <MuiLink component={Link} to="/forgotpasswordpage" sx={{ color: '#214224', textDecoration: 'underline', '&:hover': { color: '#1a2e1a' }}}>
              Forgot password?
            </MuiLink>
          </Typography>
          
          <Typography variant="body2" sx={{ mt: 2, color: '#214224' }}>
            Don't have an account?<br />
            <MuiLink component={Link} to="/" sx={{ color: '#214224', textDecoration: 'underline', '&:hover': { color: '#1a2e1a' }}}>
              Register Instead
            </MuiLink>
          </Typography>
        </Paper>
      </Container>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
          {snackbar.severity === 'warning'}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default LoginPage;