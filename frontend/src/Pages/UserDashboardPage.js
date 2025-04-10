import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Button, Box, Typography, Grid, Card, CardContent, CircularProgress, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, Alert } from "@mui/material";
import { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const UserDashboardPage = () => {
  const [collages, setCollages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [collageToDelete, setCollageToDelete] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCollages = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("You need to be logged in to view the dashboard.");
          return;
        }
        const collagesRef = collection(db, "publicCollages");
        const q = query(collagesRef, where("postedBy", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const collagesData = [];
        querySnapshot.forEach((doc) => {
          const collage = doc.data();
          collagesData.push({
            id: doc.id,
            ...collage,
          });
        });
        setCollages(collagesData);
      } 
      catch (error) {
        console.error(error);
        setError("Failed to fetch collages. Please try again later.");
      } 
      finally {
        setLoading(false);
      }
    };
    fetchCollages();
  }, []);

  const handleCollageClick = (collageId) => {
    navigate(`/collagedetailspage/${collageId}`);
  };

  const handleDeleteClick = (collageId, e) => {
    e.stopPropagation();
    setCollageToDelete(collageId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, "publicCollages", collageToDelete));
      setCollages(collages.filter(collage => collage.id !== collageToDelete));
      setShowDeleteDialog(false);
      setSnackbarMessage("Collage deleted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } 
    catch (error) {
      console.error("Error deleting collage:", error);
      setSnackbarMessage("Failed to delete collage. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setCollageToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6" color="#ff5757">
          {error}
        </Typography>
      </Box>
    );
  }

  const viewsData = collages.map((collage) => collage.views || 0);
  const likesData = collages.map((collage) => collage.likes || 0);
  const sharesData = collages.map((collage) => collage.shares || 0);
  const collageLabels = collages.map((collage) => collage.name);

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#214224"
        }
      },
      title: {
        display: true,
        text: "Collage Performance Summary",
        color: "#214224",
        font: {
          size: 16,
          family: "'TanPearl', sans-serif"
        }
      },
    },
    scales: {
      x: {
        type: "category",
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: "#214224",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: "#214224",
        },
      },
    },
  };

  const barChartData = {
    labels: collageLabels,
    datasets: [
      {
        label: "Views",
        data: viewsData,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 1,
      },
      {
        label: "Likes",
        data: likesData,
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgb(54, 162, 235)",
        borderWidth: 1,
      },
      {
        label: "Shares",
        data: sharesData,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#214224",
        },
      },
      title: {
        display: true,
        text: "Collage Engagement Distribution",
        color: "#214224",
        font: {
          size: 16,
          family: "'TanPearl', sans-serif"
        },
      },
    },
  };

  const pieChartData = {
    labels: collageLabels,
    datasets: [
      {
        label: "Engagement",
        data: viewsData.map((view, index) => view + likesData[index] + sharesData[index]),
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(75, 192, 192, 0.2)",
        ],
        borderColor: [
          "rgb(255, 99, 132)",
          "rgb(54, 162, 235)",
          "rgb(75, 192, 192)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: "#f0f0f0", minHeight: "100vh" }}>
      {collages.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: "center", color: "#214224" }}>
          No collages found. Start creating and posting collages to see insights!
        </Typography>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: "#214224", height: "400px" }}>
              <CardContent sx={{ height: "100%", padding: 2, display: "flex", flexDirection: "column", "& .chart-container": { flex: 1, backgroundColor: "#f0f0f0", borderRadius: "8px", padding: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}}>
                <div className="chart-container">
                  <Bar options={barChartOptions} data={barChartData} />
                </div>
              </CardContent>
            </Card>
          </Grid>
  
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: "#214224", height: "400px" }}>
              <CardContent sx={{ height: "100%", padding: 2, display: "flex", flexDirection: "column", "& .chart-container": { flex: 1, backgroundColor: "#f0f0f0", borderRadius: "8px", padding: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}}>
                <div className="chart-container">
                  <Pie options={pieChartOptions} data={pieChartData} />
                </div>
              </CardContent>
            </Card>
          </Grid>
  
          {collages.map((collage) => (
            <Grid item key={collage.id} xs={12} sm={6} md={4}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: "#214224", position: "relative", cursor: "pointer", transition: "transform 0.2s", "&:hover": { transform: "scale(1.02)" }}} onClick={() => handleCollageClick(collage.id)}>
                <IconButton sx={{ position: "absolute", top: 8, right: 8, color: "#f0f0f0", "&:hover": { color: "#ff5757" }}} onClick={(e) => handleDeleteClick(collage.id, e)}>
                  <Delete />
                </IconButton>
  
                <CardContent>
                  <Typography variant="h6" sx={{ marginBottom: 2, color: "#f0f0f0" }}>
                    {collage.name}
                  </Typography>
  
                  <Typography variant="body2" sx={{ color: "#f0f0f0" }}>
                    Views: {collage.views || 0}
                  </Typography>
  
                  <Typography variant="body2" sx={{ color: "#f0f0f0" }}>
                    Likes: {collage.likes || 0}
                  </Typography>
  
                  <Typography variant="body2" sx={{ color: "#f0f0f0" }}>
                    Shares: {collage.shares || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
  
      <Dialog open={showDeleteDialog} onClose={handleDeleteCancel} PaperProps={{ sx: { backgroundColor: "#214224", color: "#f0f0f0" }}}>
        <DialogTitle sx={{ fontFamily: "'TanPearl', sans-serif" }}>
          Delete Collage
        </DialogTitle>
  
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "'TanPearl', sans-serif", color: "#f0f0f0" }}>
            Are you sure you want to delete this collage? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
  
        <DialogActions>
          <Button onClick={handleDeleteCancel} sx={{ fontFamily: "'TanPearl', sans-serif", color: "#f0f0f0" }}>
            Cancel
          </Button>
  
          <Button onClick={handleDeleteConfirm} sx={{ fontFamily: "'TanPearl', sans-serif", backgroundColor: "#ff5757", color: "#f0f0f0", "&:hover": { backgroundColor: "#e04a4a" }}}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
  
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserDashboardPage;