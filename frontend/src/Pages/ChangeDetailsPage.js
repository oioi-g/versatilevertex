import React, { useEffect, useState } from "react";
import { useAuth } from "../Context/authContext";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button, Snackbar, Alert } from "@mui/material";

const ChangeDetailsPage = () => {
  const { currentUser } = useAuth();
  const [newUsername, setNewUsername] = useState("");
  const [newBio, setNewBio] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState("");
  const [isAdminUser, setIsAdminUser] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const userRef = doc(db, "user", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setNewUsername(userDoc.data().username || "");
          setOriginalUsername(userDoc.data().username || "");
          setNewBio(userDoc.data().bio || "");
          if (userDoc.data().username === "admin") {
            setIsAdminUser(true);
          }
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const checkUsernameAvailability = async (username) => {
    if (!username || username === originalUsername) return true;
    setIsCheckingUsername(true);
    try {
      const usersRef = collection(db, "user");
      const q = query(usersRef, where("username", "==", username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } 
    catch (error) {
      console.error("Error checking username:", error);
      return false;
    } 
    finally {
      setIsCheckingUsername(false);
    }
  };

  const validateUsername = async (username) => {
    if (isAdminUser) return true;
    if (!username.trim()) {
      setUsernameError("Username is required");
      return false;
    }
    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }
    if (username.length > 20) {
      setUsernameError("Username must be less than 20 characters");
      return false;
    }
    if (!/^[a-zA-Z.]+$/.test(username)) {
      setUsernameError("Username can only contain letters and period");
      return false;
    }
    if (username.toLowerCase() === "admin") {
      setUsernameError('Username "admin" is not allowed');
      return false;
    }
    if (username.toLowerCase() !== originalUsername.toLowerCase()) {
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setUsernameError("Username is already taken");
        return false;
      }
    }
    setUsernameError("");
    return true;
  };

  const handleUsernameChange = async (e) => {
    const value = e.target.value;
    setNewUsername(value);
    if (usernameError) {
      setUsernameError("");
    }
    if (value && value !== originalUsername) {
      await validateUsername(value);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const isValid = await validateUsername(newUsername);
    if (!isValid) return;
    try {
      const userRef = doc(db, "user", currentUser.uid);
      await updateDoc(userRef, {
        username: newUsername.toLowerCase(),
        bio: newBio,
      });
      setError("Changes saved successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      navigate("/userprofilepage");
    } 
    catch (error) {
      setError("Failed to save changes. Please try again.");
      console.error(error);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setError("");
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 3, fontFamily: "'TanPearl', sans-serif", color: "#214224", textAlign: "center" }}>
        Edit Profile
      </Typography>

      <Box component="form" onSubmit={handleSaveChanges} sx={{ maxWidth: 600, margin: "0 auto" }}>
        <TextField fullWidth placeholder="Username" value={newUsername} onChange={handleUsernameChange} error={!!usernameError} helperText={usernameError || (isCheckingUsername ? "Checking availability..." : "")} sx={{ marginBottom: 2 }} disabled={isAdminUser} />
        
        <TextField fullWidth placeholder="Bio" value={newBio} onChange={(e) => setNewBio(e.target.value)} sx={{ marginBottom: 2 }} multiline rows={4} />
        
        <Button type="submit" variant="contained" disabled={!!usernameError || isCheckingUsername} sx={{ backgroundColor: "#214224", color: "#f0f0f0" }}>
          {isCheckingUsername ? "Checking..." : "Save Changes"}
        
        </Button>
        <Button variant="contained" onClick={() => navigate("/userprofilepage")} sx={{ backgroundColor: "#ff5757", color: "#f0f0f0", marginLeft: "20px" }}>
          Cancel
        </Button>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChangeDetailsPage;