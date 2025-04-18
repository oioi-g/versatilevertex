import React, { useEffect, useState } from "react";
import { useAuth } from "../Context/authContext";
import { doc, getDoc, deleteDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, storage } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Box, Typography, Button, Avatar, Modal, CircularProgress, List, ListItem, ListItemText, Snackbar, Alert } from "@mui/material";
import { ArrowForward, AdminPanelSettings } from "@mui/icons-material";

const UserProfilePage = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [imageURL, setImageURL] = useState("");
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const userRef = doc(db, "user", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData(userData);
          setIsAdmin(userData.username === "admin");
          if (userData.profileImage) {
            setImageURL(userData.profileImage);
          }
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const userRef = doc(db, "user", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData(userData);
          if (userData.profileImage) {
            setImageURL(userData.profileImage);
          }
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const fetchUserData = async (userId) => {
    const userRef = doc(db, "user", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data().username;
    }
    return userId;
  };

  const fetchFollowers = async (currentUserId) => {
    try {
      const usersRef = collection(db, "user");
      const usersSnapshot = await getDocs(usersRef);
      const followers = [];  
      for (const userDoc of usersSnapshot.docs) {
        try {
          const relationshipsRef = collection(db, "user", userDoc.id, "relationships");
          const followersQuery = query(
            relationshipsRef,
            where("targetUserId", "==", currentUserId),
            where("type", "==", "follow")
          );
          const followersSnapshot = await getDocs(followersQuery);
          if (!followersSnapshot.empty) {
            followers.push(userDoc.id);
          }
        } 
        catch (innerError) {
          if (innerError.code === "permission-denied") {
            console.warn(`Permission denied reading relationships for user ${userDoc.id}`);
            continue;
          } 
          else {
            throw innerError;
          }
        }
      }  
      return followers;
    } 
    catch (error) {
      console.error("Error fetching followers:", error);
      return [];
    }
  };
  
  
  const fetchFollowing = async (currentUserId) => {
    try {
      const relationshipsRef = collection(db, "user", currentUserId, "relationships");
      const followingQuery = query(relationshipsRef, where("type", "==", "follow"));
      const followingSnapshot = await getDocs(followingQuery);
      const following = followingSnapshot.docs.map((doc) => doc.data().targetUserId);
      return following;
    } 
    catch (error) {
      console.error("Error fetching following:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchRelationships = async () => {
      if (!currentUser) return;
      try {
        const followers = await fetchFollowers(currentUser.uid);
        const following = await fetchFollowing(currentUser.uid);
        const followersWithUsernames = await Promise.all(
          followers.map(async (followerId) => {
            const username = await fetchUserData(followerId);
            return { id: followerId, username };
          })
        );
        const followingWithUsernames = await Promise.all(
          following.map(async (followingId) => {
            const username = await fetchUserData(followingId);
            return { id: followingId, username };
          })
        );
        setFollowers(followersWithUsernames);
        setFollowing(followingWithUsernames);
      } 
      catch (error) {
        console.error(error);
      } 
      finally {
        setLoading(false);
      }
    };
    fetchRelationships();
  }, [currentUser]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !currentUser) return;
    try {
      const storageRef = ref(storage, `profileImage/${currentUser.uid}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "user", currentUser.uid), {
        profileImage: downloadURL,
      });
      setImageURL(downloadURL);
      setShowImageUploadModal(false);
      setSelectedFile(null);
      setPreviewURL("");
      setSnackbarMessage("Profile image updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage("Failed to upload image. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "user", currentUser.uid));
        setSnackbarMessage("Your account has been deleted.");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        navigate("/");
      } 
      catch (error) {
        console.error(error);
        setSnackbarMessage("Failed to delete account.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ backgroundColor: "#f0f0f0", minHeight: "100vh", padding: "20px" }}>
      <Box sx={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <Avatar src={imageURL || '/defaultimage.png' } alt="Profile" sx={{ width: 150, height: 150, cursor: "pointer" }} onClick={() => setShowImageUploadModal(true)} />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: "20px" }}>
        <Button variant="contained" sx={{ backgroundColor: "#214224", color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif" }} onClick={() => setShowFollowersModal(true)} >
          Followers ({followers.length})
        </Button>

        <Button variant="contained" sx={{ backgroundColor: "#214224", color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif" }} onClick={() => setShowFollowingModal(true)} >
          Following ({following.length})
        </Button>
      </Box>

      {userData && (
        <Box sx={{ textAlign: "center", marginBottom: "20px" }}>
          <Typography variant="h6" sx={{ color: "#214224", fontFamily: "'TanPearl', sans-serif" }}>
            @{userData.username}
          </Typography>

          <Typography variant="body1" sx={{ color: "#214224", fontFamily: "'TanPearl', sans-serif" }}>
            {userData.bio || "No bio yet."}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
        <Button variant="contained" sx={{ backgroundColor: "transparent", color: "#214224", fontFamily: "'TanPearl', sans-serif", width: "80%", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => navigate("/changedetailspage")} >
          Change Details
          <ArrowForward />
        </Button>

        <Button variant="contained" sx={{ backgroundColor: "transparent", color: "#214224", fontFamily: "'TanPearl', sans-serif", width: "80%", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => navigate("/likedpage")} >
          View Likes
          <ArrowForward />
        </Button>

        <Button variant="contained" sx={{ backgroundColor: "transparent", color: "#214224", fontFamily: "'TanPearl', sans-serif", width: "80%", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => navigate("/viewdraftspage")} >
          View Drafts
          <ArrowForward />
        </Button>

        {isAdmin && (
          <Button variant="contained" sx={{ backgroundColor: "transparent", color: "#214224", fontFamily: "'TanPearl', sans-serif", width: "80%", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => navigate("/admin/viewreportspage")} >
            View Reports
            <AdminPanelSettings />
          </Button>
        )}

        {isAdmin && (
          <Button variant="contained" sx={{ backgroundColor: "transparent", color: "#214224", fontFamily: "'TanPearl', sans-serif", width: "80%", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => navigate("/admin/viewfeedbackspage")} >
            View Feedbacks
            <AdminPanelSettings />
          </Button>
        )}

        {!isAdmin && (
          <Button variant="contained" sx={{ backgroundColor: "transparent", color: "#214224", fontFamily: "'TanPearl', sans-serif", width: "80%", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => navigate("/feedbackpage")} >
            Give Feedback
            <ArrowForward />
          </Button>
        )}

        {!isAdmin && (
          <Button variant="contained" sx={{ backgroundColor: "#ff5757", color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif", width: "80%", display: "flex", justifyContent: "center", alignItems: "center" }} onClick={handleDeleteAccount} >
            Delete Account
          </Button>
        )}
      </Box>

      <Modal open={showFollowersModal} onClose={() => setShowFollowersModal(false)}>
        <Box sx={{ backgroundColor: "#214224", padding: "20px", borderRadius: "8px", width: "400px", margin: "auto", marginTop: "10%", color: "#f0f0f0" }}>
          <Typography variant="h6" sx={{ textAlign: "center", marginBottom: "10px" }}>
            Followers
          </Typography>

          <List>
            {followers.length === 0 ? (
              <Typography sx={{ textAlign: "center" }}>No followers yet.</Typography>
            ) : (
              followers.map((follower) => (
                <ListItem key={follower.id}>
                  <Link to={`/user/${follower.id}`} style={{ textDecoration: "underline", color: "#f0f0f0" }}>
                    <ListItemText primary={follower.username} />
                  </Link>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Modal>

      <Modal open={showFollowingModal} onClose={() => setShowFollowingModal(false)}>
        <Box sx={{ backgroundColor: "#214224", padding: "20px", borderRadius: "8px", width: "400px", margin: "auto", marginTop: "10%", color: "#f0f0f0" }}>
          <Typography variant="h6" sx={{ textAlign: "center", marginBottom: "10px" }}>
            Following
          </Typography>

          <List>
            {following.length === 0 ? (
              <Typography sx={{ textAlign: "center" }}>Not following anyone yet.</Typography>
            ) : (
              following.map((followingUser) => (
                <ListItem key={followingUser.id}>
                  <Link to={`/user/${followingUser.id}`} style={{ textDecoration: "underline", color: "#f0f0f0" }}>
                    <ListItemText primary={followingUser.username} />
                  </Link>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Modal>

      <Modal open={showImageUploadModal} onClose={() => setShowImageUploadModal(false)}>
        <Box sx={{ backgroundColor: "#214224", padding: "20px", borderRadius: "8px", width: "400px", margin: "auto", marginTop: "10%", color: "#f0f0f0" }}>
          <Typography variant="h6" sx={{ textAlign: "center", marginBottom: "10px" }}>
            Upload Profile Image
          </Typography>

          <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginBottom: "10px" }} />

          {previewURL && <img src={previewURL} alt="Preview" style={{ width: "100%", borderRadius: "8px", marginBottom: "10px" }} />}
          
          <Button variant="contained" sx={{ backgroundColor: "#f0f0f0", color: "#214224", fontFamily: "'TanPearl', sans-serif", width: "100%" }} onClick={handleConfirmUpload} disabled={!selectedFile}>
            Confirm Upload
          </Button>
        </Box>
      </Modal>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%", backgroundColor: "#f0f0f0", color: "#214224" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserProfilePage;