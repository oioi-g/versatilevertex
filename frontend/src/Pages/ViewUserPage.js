import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../firebase";
import { followUser, blockUser, unfollowUser, unblockUser } from "../Utils/userRelationships";
import { Box, Typography, Grid, Card, CardContent, CardMedia, Button, CircularProgress, Snackbar, Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const ViewUserPage = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [collages, setCollages] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByUser, setIsBlockedByUser] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const fetchUserData = async (userId) => {
    try {
      console.log(`Fetching user data for ${userId}`);
      const userRef = doc(db, "user", userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        console.log("User data found:", userDoc.data());
        return userDoc.data();
      } 
      else {
        throw new Error("User not found");
      }
    } 
    catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  };
  
  // const fetchUserBoards = async (userId) => {
  //   try {
  //     console.log(`Fetching boards for user ${userId}`);
  //     const boardsRef = collection(db, "user", userId, "boards");
  //     const querySnapshot = await getDocs(boardsRef);
  //     const boards = [];
  //     querySnapshot.forEach((doc) => {
  //       boards.push({ id: doc.id, ...doc.data() });
  //     });
  //     console.log(`Found ${boards.length} boards`);
  //     return boards;
  //   } catch (error) {
  //     console.error("Error fetching boards:", error);
  //     throw error;
  //   }
  // };

  const fetchUserCollages = async (userId) => {
    try {
      const collagesRef = collection(db, "publicCollages");
      const q = query(collagesRef, where("postedBy", "==", userId));
      const querySnapshot = await getDocs(q);
      const collagesData = [];
      querySnapshot.forEach((doc) => {
        const collage = doc.data();
        collagesData.push({
          id: doc.id,
          ...collage,
        });
      });
      return collagesData;
    } catch (error) {
      console.error("Error fetching collages:", error);
      throw error;
    }
  };

  const fetchRelationship = async (currentUserId, targetUserId) => {
    try {
      console.log(`Checking relationship between ${currentUserId} and ${targetUserId}`);
      const relationshipRef = doc(db, "user", currentUserId, "relationships", targetUserId);
      const relationshipDoc = await getDoc(relationshipRef);
      if (relationshipDoc.exists()) {
        console.log("Relationship found:", relationshipDoc.data());
        return relationshipDoc.data();
      }
      else {
        console.log("No relationship found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching relationship:", error);
      throw error;
    }
  };

  useEffect(() => {
    const checkIfBlockedByUser = async () => {
      if (!currentUser) {
        console.log("No current user - skipping block check");
        return false;
      }
      try {
        console.log(`Checking if current user is blocked by ${userId}`);
        const blockRef = doc(db, `user/${userId}/relationships/${currentUser.uid}`);
        const blockDoc = await getDoc(blockRef);
        const isBlocked = blockDoc.exists() && blockDoc.data().type === "block";
        console.log("Block status:", isBlocked);
        return isBlocked;
      } catch (error) {
        console.error("Error checking block status:", error);
        return false;
      }
    };
  
    // const loadUserData = async () => {
    //   setLoading(true);
    //   try {
    //     const blocked = await checkIfBlockedByUser();
    //     setIsBlockedByUser(blocked);
        
    //     if (blocked) {
    //       console.log("User is blocked by profile owner");
    //       setLoading(false);
    //       return;
    //     }

    //     const [userData, userBoards] = await Promise.all([
    //       fetchUserData(userId),
    //       fetchUserBoards(userId)
    //     ]);
        
    //     setUserData(userData);
    //     setBoards(userBoards);

    //     if (currentUser) {
    //       const relationship = await fetchRelationship(currentUser.uid, userId);
    //       if (relationship) {
    //         setIsFollowing(relationship.type === "follow");
    //         setIsBlocked(relationship.type === "block");
    //       }
    //     }
    //   } catch (err) {
    //     console.error("Error in loadUserData:", err);
    //     setError(err.message || "Failed to load profile");
    //     setSnackbarOpen(true);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    const loadUserData = async () => {
      setLoading(true);
      try {
        const blocked = await checkIfBlockedByUser();
        setIsBlockedByUser(blocked);
        
        if (blocked) {
          setLoading(false);
          return;
        }

        const [userData, userCollages] = await Promise.all([
          fetchUserData(userId),
          fetchUserCollages(userId)
        ]);
        
        setUserData(userData);
        setCollages(userCollages);

        if (currentUser) {
          const relationship = await fetchRelationship(currentUser.uid, userId);
          if (relationship) {
            setIsFollowing(relationship.type === "follow");
            setIsBlocked(relationship.type === "block");
          }
        }
      } catch (err) {
        console.error("Error in loadUserData:", err);
        setError(err.message || "Failed to load profile");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      console.log("Loading data for user ID:", userId);
      loadUserData();
    }
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (currentUser) {
      try {
        if (isFollowing) {
          await unfollowUser(currentUser.uid, userId);
          setIsFollowing(false);
          setSuccess("Unfollowed user.");
        } else {
          await followUser(currentUser.uid, userId);
          setIsFollowing(true);
          setSuccess("You are now following this user!");
        }
        setError("");
        setSnackbarOpen(true);
      } catch (err) {
        setError("Failed to update follow status.");
        setSuccess("");
        setSnackbarOpen(true);
      }
    } else {
      alert("You need to log in to follow users.");
    }
  };

  const handleBlock = async () => {
    if (!currentUser) {
      alert("You need to log in to block users.");
      return;
    }
  
    try {
      const currentUserId = currentUser.uid;
  
      if (isBlocked) {
        await unblockUser(currentUserId, userId);
        setIsBlocked(false);
        setSuccess("User unblocked.");
      } else {
        const rel = await fetchRelationship(currentUserId, userId);
        if (rel?.type === "follow") {
          await unfollowUser(currentUserId, userId);
          setIsFollowing(false);
        }
  
        const reverseRel = await fetchRelationship(userId, currentUserId);
        if (reverseRel?.type === "follow") {
          await unfollowUser(userId, currentUserId);
        }
  
        await blockUser(currentUserId, userId);
        setIsBlocked(true);
        setIsFollowing(false);
        setSuccess("User blocked.");
      }
      setError("");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error blocking/unblocking user:", err);
      setError("Failed to update block status.");
      setSuccess("");
      setSnackbarOpen(true);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isBlockedByUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', textAlign: 'center', padding: 3 }}>
        <Typography variant="h5" sx={{ color: '#214224', fontFamily: "'TanPearl', sans-serif" }}>
          You have been blocked by this user and cannot view their profile.
        </Typography>

        <Button variant="contained" onClick={() => navigate(-1)} sx={{ mt: 2, backgroundColor: "#214224", color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif" }}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!userData && !loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', textAlign: 'center', padding: 3 }}>
        <Typography variant="h5" sx={{ color: '#214224', fontFamily: "'TanPearl', sans-serif" }}>
          User not found
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)} sx={{ mt: 2, backgroundColor: "#214224", color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif" }}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!userData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3, backgroundColor: "#f0f0f0" }}>
      <Box sx={{ textAlign: "center", marginBottom: 4 }}>
        <CardMedia component="img" image={userData.profileImage || "/defaultimage.png"} alt="Profile" sx={{ width: 100, height: 100, borderRadius: "50%", margin: "0 auto" }} />
        
        <Typography variant="h4" sx={{ marginTop: 2, color: "#214224", fontFamily: "'TanPearl', sans-serif" }}>
          @{userData.username}
        </Typography>

        <Typography variant="body1" sx={{ color: "#214224", marginTop: 1, fontFamily: "'TanPearl', sans-serif" }}>
          {userData.bio}
        </Typography>

        {currentUser && currentUser.uid !== userId && (
          <Box sx={{ marginTop: 2 }}>
            <Button variant="contained" onClick={handleFollow} sx={{ backgroundColor: "#214224", color: "#f0f0f0", marginRight: 2, fontFamily: "'TanPearl', sans-serif" }} >
              {isFollowing ? "Following" : "Follow"}
            </Button>

            <Button variant="contained" onClick={handleBlock} sx={{ backgroundColor: "#ff5757", color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif" }} >
              {isBlocked ? "Unblock" : "Block"}
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ marginTop: 4 }}>
        <Typography variant="h5" sx={{ marginBottom: 2, color: "#214224", fontFamily: "'TanPearl', sans-serif", fontWeight: "bold" }}>
          Collages
        </Typography>

        {collages.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: "center", color: "#214224" }}>
            This user hasn't posted any collages yet.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {collages.map((collage) => (
              <Grid item key={collage.id} xs={12} sm={6} md={4}>
                <Card 
                  sx={{ 
                    borderRadius: 2, 
                    boxShadow: 3, 
                    backgroundColor: "#214224",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "scale(1.02)"
                    }
                  }}
                  onClick={() => navigate(`/collagedetailspage/${collage.id}`)}
                >
                  {collage.images && collage.images.length > 0 && (
                    <CardMedia 
                      component="img" 
                      image={collage.images[0].imageUrl} 
                      alt="Collage thumbnail" 
                      sx={{ 
                        height: 200, 
                        borderRadius: "8px 8px 0 0", 
                        objectFit: "cover" 
                      }} 
                    />
                  )}

                  <CardContent>
                    <Typography variant="h6" sx={{ marginBottom: 2, color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif" }}>
                      {collage.name}
                    </Typography>

                    <Typography variant="body2" sx={{ color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif" }}>
                      Views: {collage.views || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif" }}>
                      Likes: {collage.likes || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif" }}>
                      Shares: {collage.shares || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {(error || success) && (
        <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleCloseSnackbar}>
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={error ? "error" : "success"} 
            sx={{ width: "100%", backgroundColor: error ? "#ffcccc" : "#d0f0d0", color: error ? "#900" : "#214224", fontFamily: "'TanPearl', sans-serif" }}
            action={
              <IconButton size="small" onClick={handleCloseSnackbar} color="inherit">
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {error || success}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default ViewUserPage;