import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { Button, TextField, Container, Box, Typography, Paper, Link as MuiLink } from '@mui/material';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    birthyear: ''
  });
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    birthyear: ''
  });
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const navigate = useNavigate();

  const checkUsernameAvailability = async (username) => {
    if (!username) return true;
    setIsCheckingUsername(true);
    try {
      const usersRef = collection(db, 'user');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } 
    catch (error) {
      console.error('Error checking username:', error);
      return false;
    } 
    finally {
      setIsCheckingUsername(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (name === 'username' && value.length >= 3 && value.length <= 20 && /^(?=.*[a-zA-Z])[a-zA-Z.]+$/.test(value) && errors.username !== 'Username is already taken') {
      const isAvailable = await checkUsernameAvailability(value);
      if (!isAvailable) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
      }
    }
  };

  const validateForm = async () => {
    let isValid = true;
    const newErrors = {
      username: '',
      email: '',
      password: '',
      birthyear: ''
    };
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    } 
    else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      isValid = false;
    } 
    else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
      isValid = false;
    } 
    else if (!/^(?=.*[a-zA-Z])[a-zA-Z.]+$/.test(formData.username)) {
      newErrors.username = 'Username must contain at least one letter, and can only contain letters and periods';
      isValid = false;
    } 
    else if (formData.username.toLowerCase() === 'admin') {
      newErrors.username = 'Username "admin" is not allowed';
      isValid = false;
    } 
    else {
      const isAvailable = await checkUsernameAvailability(formData.username);
      if (!isAvailable) {
        newErrors.username = 'Username is already taken';
        isValid = false;
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } 
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } 
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    } 
    else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
      isValid = false;
    } 
    else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
      isValid = false;
    } 
    else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
      isValid = false;
    } 
    else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
      isValid = false;
    }

    const currentYear = new Date().getFullYear();
    const userAge = currentYear - formData.birthyear;
    if (!formData.birthyear) {
      newErrors.birthyear = 'Birth year is required';
      isValid = false;
    } 
    else if (formData.birthyear < 1947 || formData.birthyear > currentYear) {
      newErrors.birthyear = `Birth year must be between 1947 and ${currentYear}`;
      isValid = false;
    } 
    else if (userAge < 18) {
      newErrors.birthyear = 'You must be 18 or older to register';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      alert('Registration successful! Please check your email to verify your account.');
      const userRef = doc(db, 'user', user.uid);
      await setDoc(userRef, {
        createdAt: serverTimestamp(),
        email: formData.email,
        username: formData.username.toLowerCase(),
        birthyear: formData.birthyear,
        verified: false
      });
      navigate('/loginpage');
    } 
    catch (error) {
      console.error(error);
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email or login.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      alert(errorMessage);
    }
  };

  return (
    <div>
      <Container maxWidth={false} sx={{ height: '84vh', backgroundColor: '#214224', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, borderRadius: 2, backgroundColor: '#f0f0f0', maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#214224', fontFamily: 'TanPearl, sans-serif' }}>
            Welcome to <br /> Versatile Vertex 🦋
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField name="username" label="Username" variant="outlined" fullWidth value={formData.username} onChange={handleChange} error={!!errors.username} helperText={errors.username || (isCheckingUsername ? 'Checking availability...' : '')} required sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#214224' }, '&:hover fieldset': { borderColor: '#214224' }}}} />
            
            <TextField name="email" label="Email" type="email" variant="outlined" fullWidth value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} required sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#214224' }, '&:hover fieldset': { borderColor: '#214224' }}}} />
            
            <TextField name="password" label="Password" type="password" variant="outlined" fullWidth value={formData.password} onChange={handleChange} error={!!errors.password} helperText={errors.password || 'At least 8 chars with uppercase, lowercase, number, and special char'} required sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#214224' }, '&:hover fieldset': { borderColor: '#214224' }}}} />
            
            <TextField name="birthyear" label="Birth Year" type="number" variant="outlined" fullWidth value={formData.birthyear} onChange={handleChange} error={!!errors.birthyear} helperText={errors.birthyear} required inputProps={{ min: 1947, max: new Date().getFullYear() }} sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#214224' }, '&:hover fieldset': { borderColor: '#214224' }}}} />
            
            <Button type="submit" variant="contained" fullWidth disabled={isCheckingUsername} sx={{ backgroundColor: '#214224', color: '#f0f0f0', fontFamily: 'TanPearl, sans-serif', textTransform: 'none', '&:hover': { backgroundColor: '#f0f0f0', color: '#214224', border: '1px solid #214224' }, '&:disabled': { backgroundColor: '#cccccc', color: '#666666' }}}>
              {isCheckingUsername ? 'Checking...' : 'Register'}
            </Button>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2, color: '#214224' }}>
            Already have an account?
          </Typography>
          
          <Typography variant="body2" sx={{ mt: 2, color: '#214224' }}>
            <MuiLink component={Link} to="/loginpage" sx={{ color: '#214224', textDecoration: 'underline' }}>
              Login Instead
            </MuiLink>
          </Typography>
        </Paper>
      </Container>
    </div>
  );
};

export default RegisterPage;