import React, { useState, useEffect } from "react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Box, Typography, TextField, Button, Snackbar, Alert, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const CreateChallengePage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !deadline) {
      setError("Please fill out all fields.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      const challengesRef = collection(db, "designChallenges");
      await addDoc(challengesRef, {
        title,
        description,
        deadline: Timestamp.fromDate(new Date(deadline)),
        createdAt: Timestamp.now(),
        createdBy: user.uid,
      });
      setError("Challenge created successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      navigate("/userdesignchallengespage");
    } 
    catch (error) {
      setError("Failed to create challenge.");
      console.error(error);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setError("");
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.uid !== "v4DdTGxRLtScNyjfXCG5AnXegP43") {
    return null;
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 3, fontFamily: "'TanPearl', sans-serif", color: "#214224", textAlign: "center" }}>
        Create New Challenge
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, margin: "0 auto" }}>
        <TextField fullWidth placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ marginBottom: 2 }} />
        <TextField fullWidth placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} sx={{ marginBottom: 2 }} multiline rows={4} />
        <TextField fullWidth placeholder="Deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} sx={{ marginBottom: 2 }} />
        <Button type="submit" variant="contained" sx={{ backgroundColor: "#214224", color: "#f0f0f0" }}>
          Create Challenge
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

export default CreateChallengePage;