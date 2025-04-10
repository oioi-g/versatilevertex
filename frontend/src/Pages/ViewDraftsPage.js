import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Link } from "react-router-dom";
import { Box, Typography, Grid, Card, CardMedia, CardContent, CardActionArea, CircularProgress, Alert, Paper, styled } from "@mui/material";

const ViewDraftsPage = () => {
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("You need to be logged in to view drafts.");
          setLoading(false);
          return;
        }
        const draftsRef = collection(db, "user", user.uid, "drafts");
        const querySnapshot = await getDocs(draftsRef);
        const draftsData = [];
        querySnapshot.forEach((doc) => {
          draftsData.push({ id: doc.id, ...doc.data() });
        });

        setDrafts(draftsData);
      } 
      catch (error) {
        console.error(error);
        setError("Failed to fetch drafts. Please try again later.");
      } 
      finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, []);

  const StyledCard = styled(Card)(({ theme }) => ({
    transition: "transform 0.2s ease-in-out",
    "&:hover": {
      transform: "scale(1.03)",
      boxShadow: theme.shadows[6]
    }
  }));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, minHeight: "70vh" }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: "primary.main", textAlign: "center" }}>
        My Drafts
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {drafts.length === 0 && !error ? (
        <Typography variant="body1" color="text.secondary">
          No drafts found.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {drafts.map((draft) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={draft.id}>
              <StyledCard>
                <CardActionArea component={Link} to={`/draftdetailspage/${draft.id}`}>
                  {draft.collage && draft.collage.length > 0 && (
                    <CardMedia component="img" height="160" image={draft.collage[0].imageUrl} alt="Draft Thumbnail" />
                  )}
                  
                  <CardContent sx={{ backgroundColor: "primary.main", color: "primary.contrastText" }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {draft.name}
                    </Typography>

                    <Typography variant="caption" display="block">
                      Created: {new Date(draft.createdAt?.toDate()).toLocaleString()}
                    </Typography>

                    <Typography variant="caption" display="block">
                      Updated: {new Date(draft.updatedAt?.toDate()).toLocaleString()}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

export default ViewDraftsPage;