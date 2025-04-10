import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Box, Button, Typography, Grid, Card, CardContent, CircularProgress, Snackbar, Alert, Chip } from "@mui/material";
import { init, send } from "@emailjs/browser";

init("jIwqvBU_XAMYExEEh");

const AdminViewSubmissionsPage = () => {
  const { challengeId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [winnerId, setWinnerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleSelectWinner = async (submissionId) => {
    if (!submissionId) return;
    setLoading(true);
    try {
      const winnerSubmission = submissions.find(s => s.id === submissionId);
      const challengeRef = doc(db, "designChallenges", challengeId);
      await updateDoc(challengeRef, {
        winnerId: submissionId,
        winnerDetails: {
          id: winnerSubmission.id,
          username: winnerSubmission.username,
          userEmail: winnerSubmission.userEmail,
          imageURL: winnerSubmission.imageURL,
        }
      });
      setWinnerId(submissionId);
      if (winnerSubmission) {
        await send(
          "service_mvecfxf",
          "template_xoqi97s",
          {
            to_email: winnerSubmission.userEmail,
            to_name: winnerSubmission.username,
            name: "adminvv"
          }
        );
      }
      setSnackbarMessage("Winner chosen successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage("Failed to select winner");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } 
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const challengeRef = doc(db, "designChallenges", challengeId);
        const challengeDoc = await getDoc(challengeRef);
        if (challengeDoc.exists()) {
          const challengeData = challengeDoc.data();
          setChallenge({
            id: challengeDoc.id,
            ...challengeData,
            deadline: challengeData.deadline.toDate(),
          });
          setWinnerId(challengeData.winnerId || null);
        }
        const submissionsRef = collection(db, "designChallenges", challengeId, "submissions");
        const snapshot = await getDocs(submissionsRef);
        const submissionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt.toDate(),
        }));
        setSubmissions(submissionsData);
      } 
      catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, [challengeId]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setSnackbarMessage("");
    setSnackbarSeverity("success");
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" sx={{ marginBottom: 4, fontFamily: "'TanPearl', sans-serif", color: "#214224" }}>
        Submissions for: {challenge?.title}
      </Typography>

      {loading && (
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={4}>
        {submissions.map((submission) => {
          const isWinner = winnerId === submission.id;
          return (
            <Grid item key={submission.id} xs={12} sm={6} md={4}>
              <Card sx={{ backgroundColor: "#214224", borderRadius: 3, boxShadow: 5, position: "relative" }}>
                <CardContent>
                  {isWinner && (
                    <Chip label="Winner" color="success" sx={{ position: "absolute", top: 10, right: 10, fontWeight: "bold" }} />
                  )}

                  <img src={submission.imageURL} alt="Submission" style={{ width: "100%", marginTop: 10, borderRadius: 8, color: "#f0f0f0" }} />
                  
                  <Typography variant="caption" sx={{ display: "block", fontFamily: "'TanPearl', sans-serif", color: "#f0f0f0", mt: 2 }}>
                    Submitted by: {submission.username}
                  </Typography>

                  <Typography variant="caption" sx={{ display: "block", fontFamily: "'TanPearl', sans-serif", color: "#f0f0f0", mt: 1 }}>
                    Submitted on:{" "}
                    {new Date(submission.submittedAt).toLocaleString()}
                  </Typography>

                  <Button onClick={() => handleSelectWinner(submission.id)} sx={{ backgroundColor: "#f0f0f0", color: "#214224", mt: 2, width: "100%", "&:hover": { backgroundColor: "#e0e0e0" }}} disabled={!!winnerId}>
                    Select as Winner
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminViewSubmissionsPage;