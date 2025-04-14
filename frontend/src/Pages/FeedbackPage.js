import React, { useState } from "react";
import { Box, Typography, TextField, Button, Snackbar, Alert, CircularProgress, Rating } from "@mui/material";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

const FeedbackPage = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: 5,
    message: "",
    userEmail: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (event, newValue) => {
    setFeedback((prev) => ({ ...prev, rating: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!feedback.message || feedback.message.length < 10) {
      setError("Feedback must be at least 10 characters.");
      setSnackbarOpen(true);
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const feedbackData = {
        rating: feedback.rating,
        message: feedback.message,
        userEmail: user?.email || feedback.userEmail,
        createdAt: serverTimestamp(),
      };
      const feedbackRef = doc(collection(db, "feedback"));
      await setDoc(feedbackRef, feedbackData);
      setSuccess("Thank you for your feedback!");
      setSnackbarOpen(true);
      setFeedback({ rating: 5, message: "", userEmail: "" });
    } 
    catch (err) {
      console.error("Feedback submission error:", err);
      setError("Failed to submit feedback. Please try again.");
      setSnackbarOpen(true);
    } 
    finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setError("");
    setSuccess("");
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 3, fontFamily: "'TanPearl', sans-serif", color: "#214224", textAlign: "center" }}>
        Share Your Feedback
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }} role="group" aria-labelledby="rating-label">
          <Typography variant="h6" sx={{ color: "#214224", marginBottom: 1 }}>
            How would you rate your experience?
          </Typography>

          <Rating name="rating" value={feedback.rating} onChange={handleRatingChange} precision={1} size="large" sx={{ fontSize: "2.5rem", color: "#214224" }} />
        </Box>

        <TextField placeholder="Your Feedback" name="message" multiline rows={4} fullWidth value={feedback.message} onChange={handleChange} error={!!error && error.toLowerCase().includes("feedback")} helperText={ !!error && error.toLowerCase().includes("feedback") ? error : " " } />

        <Button type="submit" variant="contained" disabled={loading} sx={{ backgroundColor: "#214224", color: "#f0f0f0", "&:hover": { backgroundColor: "#f0f0f0", color: "#214224" }}}>
          {loading ? <CircularProgress size={24} color="inherit" /> : "Submit Feedback"}
        </Button>
      </Box>

      {(error || success) && (
        <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity={error ? "error" : "success"} sx={{ width: "100%" }}>
                {error || success}
            </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default FeedbackPage;
