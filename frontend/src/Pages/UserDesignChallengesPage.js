import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, addDoc, doc, getDoc, Timestamp, deleteDoc } from "firebase/firestore";
import { db, auth, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Box, Typography, Grid, Card, CardContent, Button, Snackbar, Alert } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { init } from "@emailjs/browser";

init("jIwqvBU_XAMYExEEh");

const UserDesignChallengesPage = () => {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "user", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && userDoc.data().username === "admin") {
          setIsAdmin(true);
        }
      }
    };
    checkAdmin();
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchChallenges = useCallback(async () => {
    try {
      const challengesRef = collection(db, "designChallenges");
      const snapshot = await getDocs(challengesRef);
      const challengesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline.toDate(),
      }));
      setChallenges(challengesData);
    } 
    catch (error) {
      showSnackbar("Failed to fetch challenges.", "error");
      console.error(error);
    }
  }, []);

  const fetchSubmissionsForChallenge = useCallback(async (challengeId) => {
    try {
      const submissionsRef = collection( db, "designChallenges", challengeId, "submissions");
      const snapshot = await getDocs(submissionsRef);
      const submissionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt.toDate(),
      }));
      return submissionsData;
    } 
    catch (error) {
      showSnackbar("Failed to fetch submissions.", "error");
      console.error(error);
      return [];
    }
  }, []);
  
  
  const fetchUserSubmissions = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const allSubmissions = [];
      for (const challenge of challenges) {
        const submissions = await fetchSubmissionsForChallenge(challenge.id);
        const userSubmissions = submissions.filter(
          (sub) => sub.userId === user.uid
        );
        allSubmissions.push(...userSubmissions);
      }
      setUserSubmissions(allSubmissions);
    } 
    catch (error) {
      showSnackbar("Failed to fetch user submissions.", "error");
      console.error(error);
    }
  }, [challenges, fetchSubmissionsForChallenge]);  
  
  const fetchUsername = async (userId) => {
    try {
      const userRef = doc(db, "user", userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        return userDoc.data().username;
      }
      return null;
    } 
    catch (error) {
      console.error("Failed to fetch username:", error);
      return null;
    }
  };

  const handleDeleteSubmission = async (submissionId, challengeId) => {
    const user = auth.currentUser;
    if (!user) {
      showSnackbar("You must be logged in to delete a submission.", "error");
      return;
    }
    try {
      const submissionRef = doc(db, "designChallenges", challengeId, "submissions", submissionId);
      await deleteDoc(submissionRef);
      setUserSubmissions((prevSubmissions) =>
        prevSubmissions.filter((sub) => sub.id !== submissionId)
      );
      showSnackbar("Submission deleted successfully!", "success");
    } 
    catch (error) {
      showSnackbar("Failed to delete submission.", "error");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  useEffect(() => {
    if (challenges.length > 0 && !isAdmin) {
      fetchUserSubmissions();
    }
  }, [challenges, fetchUserSubmissions, isAdmin]);

  const handleImageUpload = async (file) => {
    if (!file) {
      showSnackbar("Please select an image to upload.", "error");
      return null;
    }
    try {
      const storageRef = ref(storage, `submissions/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } 
    catch (error) {
      showSnackbar("Failed to upload image.", "error");
      console.error(error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (isAdmin) {
      showSnackbar("Admins cannot submit designs.", "error");
      return;
    }
    if (!imageFile) {
      showSnackbar("Please select an image to upload.", "error");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      showSnackbar("You must be logged in to submit.", "error");
      return;
    }
    const currentDate = new Date();
    if (currentDate > selectedChallenge.deadline) {
      showSnackbar("This challenge has already passed its deadline.", "error");
      return;
    }
    const userHasSubmitted = userSubmissions.some(
      (sub) => sub.challengeId === selectedChallenge.id
    );
    if (userHasSubmitted) {
      showSnackbar("You have already submitted to this challenge.", "error");
      return;
    }
    setUploading(true);
    try {
      const imageURL = await handleImageUpload(imageFile);
      if (!imageURL) return;
      const username = await fetchUsername(user.uid);
      if (!username) {
        showSnackbar("Failed to fetch user details.", "error");
        return;
      }
      const submissionsRef = collection(db, "designChallenges", selectedChallenge.id, "submissions");
      await addDoc(submissionsRef, {
        imageURL,
        userId: user.uid,
        userEmail: user.email,
        submittedAt: Timestamp.fromDate(new Date()),
        challengeId: selectedChallenge.id,
        username: username,
      });
      setImageFile(null);
      setSelectedChallenge(null);
      showSnackbar("Submission successful!", "success");
      fetchUserSubmissions();
    } 
    catch (error) {
      showSnackbar("Failed to submit.", "error");
    } 
    finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedChallenge(null);
    setImageFile(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  const handleChallengeClick = (challenge) => {
    if (isAdmin) {
      navigate(`/admin/submissionspage/${challenge.id}`);
    } 
    else {
      const isPastDeadline = new Date() > challenge.deadline;
      if (!isPastDeadline) {
        setSelectedChallenge(challenge);
      } 
      else {
        showSnackbar(
          "This challenge has closed. Submissions are no longer accepted.",
          "error"
        );
      }
    }
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: "#f0f0f0", minHeight: "100vh" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        {isAdmin && (
          <Button variant="contained" onClick={() => navigate("/admin/createchallengepage")} sx={{ backgroundColor: "#214224", color: "#f0f0f0", '&:hover': { backgroundColor: "#1a331a" }, borderRadius: 2, textTransform: "none", fontWeight: "bold" }} startIcon={<Add />}>
            New Challenge
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {challenges.map((challenge) => {
          const isPastDeadline = new Date() > challenge.deadline;
          const isDisabled = !isAdmin && isPastDeadline;
  
          return (
            <Grid item key={challenge.id} xs={12} sm={6} md={4}>
              <Card sx={{ backgroundColor: isDisabled ? "#bfbfbf" : "#214224", color: "#f0f0f0", borderRadius: 3, boxShadow: 4, transition: "all 0.3s ease", cursor: "pointer", opacity: isDisabled ? 0.6 : 1, "&:hover": { boxShadow: 6 }}} onClick={() => isDisabled ? showSnackbar("This challenge has closed. Submissions are no longer accepted.", "error") : handleChallengeClick(challenge) }>
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: "'TanPearl', serif", mb: 1 }}>
                    {challenge.title}
                  </Typography>

                  <Typography variant="body2" sx={{ fontFamily: "Inter, sans-serif" }}>
                    {challenge.description}
                  </Typography>

                  <Typography variant="caption" sx={{ display: "block", fontFamily: "Inter, sans-serif", mt: 2, fontStyle: "italic", color: "#f0f0f0" }}>
                    Deadline: {new Date(challenge.deadline).toLocaleString()}
                    {isPastDeadline && !isAdmin && " - Passed"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {!isAdmin && selectedChallenge && (
        <Box sx={{ mt: 6, backgroundColor: "#ffffff", p: 4, borderRadius: 3, boxShadow: 3, maxWidth: 600 }}>
          <Typography variant="h5" sx={{ mb: 3, fontFamily: "'TanPearl', serif", color: "#214224" }}>
            Submit Your Design for: {selectedChallenge.title}
          </Typography>

          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ marginBottom: 16 }} />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={handleSubmit} disabled={uploading} sx={{ backgroundColor: "#214224", color: "#f0f0f0", fontWeight: "bold", '&:hover': { backgroundColor: "#1a331a" }}}>
              {uploading ? "Uploading..." : "Submit"}
            </Button>

            <Button
              variant="outlined" onClick={handleCancel} sx={{ borderColor: "#ff5757", color: "#ff5757", '&:hover': { backgroundColor: "#ffecec", borderColor: "#ff3d3d" }}}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {!isAdmin && userSubmissions.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" sx={{ mb: 3, fontFamily: "'TanPearl', serif", color: "#214224" }}>
            Your Submissions
          </Typography>

          <Grid container spacing={3}>
            {userSubmissions.map((submission) => (
              <Grid item key={submission.id} xs={12} sm={6} md={4}>
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontFamily: "'TanPearl', serif", mb: 1 }}>
                      {challenges.find((c) => c.id === submission.challengeId)?.title}
                    </Typography>

                    <img src={submission.imageURL} alt="Submission" style={{ width: "100%", borderRadius: 8 }} />

                    <Typography variant="caption" sx={{ display: "block", mt: 2, color: "#666", fontFamily: "Inter, sans-serif" }}>
                      Submitted on: {new Date(submission.submittedAt).toLocaleString()}
                    </Typography>

                    <Button variant="contained" onClick={() => handleDeleteSubmission(submission.id, submission.challengeId)} sx={{ mt: 2, backgroundColor: "#ff5757", color: "#fff", '&:hover': { backgroundColor: "#e04444" }}} fullWidth>
                      Delete Submission
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserDesignChallengesPage;