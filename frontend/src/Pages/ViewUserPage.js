import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { followUser, blockUser, unfollowUser, unblockUser } from "../Utils/userRelationships";
import { Box, Typography, Grid, Card, CardContent, CardMedia, Button, CircularProgress, Snackbar, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const ViewUserPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByUser, setIsBlockedByUser] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const currentUser = auth.currentUser;

  const fetchUserData = async (userId) => {
    const userRef = doc(db, "user", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data();
    } 
    else {
      throw new Error("User not found");
    }
  };
  
  const fetchUserBoards = async (userId) => {
    const boardsRef = collection(db, "user", userId, "boards");
    const querySnapshot = await getDocs(boardsRef);
    const boards = [];
    querySnapshot.forEach((doc) => {
      boards.push({ id: doc.id, ...doc.data() });
    });
    return boards;
  };

  const fetchRelationship = async (currentUserId, targetUserId) => {
    const relationshipRef = doc(db, "user", currentUserId, "relationships", targetUserId);
    const relationshipDoc = await getDoc(relationshipRef);
    if (relationshipDoc.exists()) {
      return relationshipDoc.data();
    } 
    else {
      return null;
    }
  };

  useEffect(() => {
    const checkIfBlockedByUser = async () => {
      if (!currentUser) return false;
      const blockRef = doc(db, `user/${userId}/relationships/${currentUser.uid}`);
      const blockDoc = await getDoc(blockRef);
      return blockDoc.exists() && blockDoc.data().type === "block";
    };
  
    const loadUserData = async () => {
      try {
        const blocked = await checkIfBlockedByUser();
        if (blocked) {
          setIsBlockedByUser(true);
          return;
        }
  
        const [userData, userBoards] = await Promise.all([
          fetchUserData(userId),
          fetchUserBoards(userId)
        ]);
        
        setUserData(userData);
        setBoards(userBoards);
  
        if (currentUser) {
          const relationship = await fetchRelationship(currentUser.uid, userId);
          if (relationship) {
            setIsFollowing(relationship.type === "follow");
            setIsBlocked(relationship.type === "block");
          }
        }
      } 
      catch (err) {
        setError(err.message);
        setSnackbarOpen(true);
      }
    };
    
    loadUserData();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (currentUser) {
      if (isFollowing) {
        await unfollowUser(currentUser.uid, userId);
        setIsFollowing(false);
      } 
      else {
        await followUser(currentUser.uid, userId);
        setIsFollowing(true);
      }
    } 
    else {
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
      }
    } catch (err) {
      console.error("Error blocking/unblocking user:", err);
      setError("Failed to update block status.");
      setSnackbarOpen(true);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

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

  if (error) {
    return (
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} message={error}
        action={
          <IconButton size="small" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton> 
        } 
      />
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
        <Typography variant="h5" sx={{ marginBottom: 2, color: "#214224", fontFamily: "'TanPearl', sans-serif" }}>
          Boards
        </Typography>

        <Grid container spacing={3}>
          {boards.map((board) => (
            <Grid item key={board.id} xs={12} sm={6} md={4}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: "#214224" }}>
                {board.pins.length > 0 && (
                  <CardMedia component="img" image={board.pins[0].imageUrl} alt="Thumbnail" sx={{ height: 200, borderRadius: "8px 8px 0 0", objectFit: "cover" }} />
                )}

                <CardContent>
                  <Typography variant="h6" sx={{ marginBottom: 2, color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif" }}>
                    {board.name}
                  </Typography>

                  <Typography variant="body2" sx={{ marginTop: 2, color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif" }}>
                    {board.pins.length} Pins
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default ViewUserPage;