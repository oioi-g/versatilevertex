import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, increment, deleteDoc, collection, setDoc, addDoc, query, onSnapshot, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getAuth } from "firebase/auth";
import { Box, Typography, Paper, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, Alert, IconButton, TextField, List, ListItem, ListItemText, Avatar } from "@mui/material";
import { Favorite, Share, Download, ThumbUp, Delete } from "@mui/icons-material";

const CollageDetailsPage = () => {
  const { collageId } = useParams();
  const [collage, setCollage] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [likedCollages, setLikedCollages] = useState([]);
  const collageAreaRef = useRef(null);

  useEffect(() => {
    const fetchCollage = async () => {
      try {
        const collageRef = doc(db, "publicCollages", collageId);
        const collageSnap = await getDoc(collageRef);
        if (collageSnap.exists()) {
          const collageData = collageSnap.data();
          console.log("Fetched collage data:", collageData);
          const validatedCollage = collageData.collage.map((item) => ({
            ...item,
            layout: {
              x: item.layout?.x !== undefined ? item.layout.x : 0,
              y: item.layout?.y !== undefined ? item.layout.y : 0,
              width: item.layout?.width !== undefined ? item.layout.width : 100,
              height: item.layout?.height !== undefined ? item.layout.height : 100,
              rotation: item.layout?.rotation !== undefined ? item.layout.rotation : 0,
              zIndex: item.layout?.zIndex !== undefined ? item.layout.zIndex : 0,
            },
          }));
          console.log("Validated collage data:", validatedCollage);
          setCollage({ ...collageData, collage: validatedCollage });
          await updateDoc(collageRef, {
            views: increment(1),
          });
          const commentsRef = collection(db, "publicCollages", collageId, "comments");
          const q = query(commentsRef);
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setComments(commentsData);
          });
          return () => unsubscribe();
        } 
        else {
          setError("Collage not found.");
        }
      } 
      catch (error) {
        console.error(error);
        setError("Failed to fetch the collage. Please try again later.");
      }
    };
    fetchCollage();
  }, [collageId]);

  useEffect(() => {
    const fetchLikedCollages = async () => {
      const user = getAuth().currentUser;
      if (!user) return;
      try {
        const likedCollagesCollection = collection(db, "user", user.uid, "liked_collages");
        const snapshot = await getDocs(likedCollagesCollection);
        const likedCollagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLikedCollages(likedCollagesData);
      } 
      catch (error) {
        console.error(error);
      }
    };
    fetchLikedCollages();
  }, []);

  const handleDeleteCollage = async () => {
    try {
      const collageRef = doc(db, "publicCollages", collageId);
      await deleteDoc(collageRef);
      setSnackbarMessage("Collage deleted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setTimeout(() => {
        window.location.href = "/homepage";
      }, 2000);
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage("Failed to delete the collage. Please try again later.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleLikeCollage = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setSnackbarMessage("Please log in to like collages");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      const userLikeRef = doc(db, "user", user.uid, "liked_collages", collageId);
      const collageRef = doc(db, "publicCollages", collageId);
      if (likedCollages.some((likedCollage) => likedCollage.id === collageId)) {
        await deleteDoc(userLikeRef);
        await updateDoc(collageRef, {
          likes: increment(-1),
        });
        setLikedCollages((prev) => prev.filter(liked => liked.id !== collageId));
      } 
      else {
        await setDoc(userLikeRef, {
          liked: true,
          name: collage.name,
          collage: collage.collage,
          timestamp: new Date(),
        });
        await updateDoc(collageRef, {
          likes: increment(1),
        });
        setLikedCollages((prev) => [...prev, { id: collageId, ...collage }]);
      }
      const updatedCollageSnap = await getDoc(collageRef);
      setCollage(updatedCollageSnap.data());
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage("Failed to update like status");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleShareCollage = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const sharesRef = collection(db, "publicCollages", collageId, "shares");
    const shareDoc = doc(sharesRef, user.uid);
    const shareSnapshot = await getDoc(shareDoc);
    if (!shareSnapshot.exists()) {
      await setDoc(shareDoc, { sharedAt: new Date() });
      await updateDoc(doc(db, "publicCollages", collageId), {
        shares: increment(1),
      });
    }
  };

  const handleNativeShareCollage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this collage!",
          text: "Here's an amazing collage I found.",
          url: `${window.location.origin}/collagedetailspage/${collageId}`,
        });
        console.log("Successfully shared");
        handleShareCollage();
      } 
      catch (error) {
        console.error("Error sharing:", error);
      }
    } 
    else {
      console.error("Web Share API not supported");
    }
  };

  const handleDownloadCollage = async () => {
    const collageArea = collageAreaRef.current;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = collageArea.offsetWidth;
    canvas.height = collageArea.offsetHeight;
    const images = collageArea.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise((resolve, reject) => {
            if (img.complete) {
              resolve();
            } 
            else {
              img.onload = resolve;
              img.onerror = reject;
            }
          })
      )
    );
    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const collageRect = collageArea.getBoundingClientRect();
      const x = rect.left - collageRect.left;
      const y = rect.top - collageRect.top;
      context.drawImage(img, x, y, rect.width, rect.height);
    });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `${collage.name || "collage"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePostComment = async () => {
    const user = auth.currentUser;
    if (!user || !newComment.trim()) return;
    try {
      const userDocRef = doc(db, "user", user.uid);
      const userDocSnap = await getDoc(userDocRef); 
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const username = userData.username || user.email;
        const commentsRef = collection(db, "publicCollages", collageId, "comments");
        await addDoc(commentsRef, {
          text: newComment,
          postedBy: user.uid,
          postedByUsername: username,
          postedAt: new Date(),
          likes: 0,
        });
        setNewComment("");
      } 
      else {
        console.error("User document not found in Firestore.");
        setSnackbarMessage("Failed to post comment. User data not found.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } 
    catch (error) {
      console.error("Error posting comment:", error);
      setSnackbarMessage("Failed to post comment. Please try again later.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };
  
  const handleLikeComment = async (commentId) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const commentRef = doc(db, "publicCollages", collageId, "comments", commentId);
      const likesRef = collection(db, "publicCollages", collageId, "comments", commentId, "likes");
      const likeDoc = doc(likesRef, user.uid);
      const likeSnapshot = await getDoc(likeDoc);
      if (likeSnapshot.exists()) {
        await deleteDoc(likeDoc);
        await updateDoc(commentRef, {
          likes: increment(-1),
        });
      } 
      else {
        await setDoc(likeDoc, { likedAt: new Date() });
        await updateDoc(commentRef, {
          likes: increment(1),
        });
      }
    } 
    catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId, postedBy) => {
    const user = auth.currentUser;
    if (!user) return;
    if (user.uid === postedBy || user.uid === collage?.postedBy) {
      try {
        const commentRef = doc(db, "publicCollages", collageId, "comments", commentId);
        await deleteDoc(commentRef);
        setSnackbarMessage("Comment deleted successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } 
      catch (error) {
        console.error("Error deleting comment:", error);
        setSnackbarMessage("Failed to delete the comment. Please try again later.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } 
    else {
      setSnackbarMessage("You do not have permission to delete this comment.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const isLiked = likedCollages.some((likedCollage) => likedCollage.id === collageId);

  return (
    <Box sx={styles.container}>
      <Typography variant="h4" sx={styles.title}>
        Collage Details
      </Typography>

      {error && (
        <Typography variant="body1" sx={styles.errorMessage}>
          {error}
        </Typography>
      )}

      {collage && (
        <Paper elevation={3} sx={styles.collageContainer}>
          <Typography variant="h5" sx={styles.collageTitle}>
            {collage.name}
          </Typography>

          <Box sx={styles.collageArea} ref={collageAreaRef}>
            {collage.collage.map((item, index) => (
              <Box key={index}
                sx={{
                  position: "absolute",
                  left: `${item.layout?.x ?? 0}px`,
                  top: `${item.layout?.y ?? 0}px`,
                  width: `${item.layout?.width ?? 100}px`,
                  height: `${item.layout?.height ?? 100}px`,
                  transform: `rotate(${item.layout?.rotation ?? 0}deg)`,
                  zIndex: item.layout?.zIndex ?? 0,
                  overflow: "hidden" 
                }}>
                <img src={item.imageUrl} alt={`Collage item ${index}`} crossOrigin="anonymous" style={{ width: `${item.layout.width}px`, height: `${item.layout.height}px`, objectFit: "cover" }} />
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography variant="body1" sx={styles.viewsCount}>
              Likes: {collage.likes || 0}
            </Typography>
          </Box>

          <IconButton onClick={handleLikeCollage} sx={{ color: isLiked ? "#ff5757" : "#f0f0f0", fontSize: "30px" }}>
            <Favorite />
          </IconButton>

          {collage && auth.currentUser && collage.postedBy === auth.currentUser.uid && (
            <>
              <Button variant="contained" onClick={() => setShowConfirmationModal(true)} sx={{ marginTop: "10px", fontFamily: "'TanPearl', sans-serif", backgroundColor: "#ff5757", color: "#f0f0f0", marginLeft: "10px" }} >
                Delete Collage
              </Button>

              <IconButton onClick={handleDownloadCollage} sx={{ marginTop: "10px", backgroundColor: "transparent", color: "#214224", marginLeft: "10px" }} >
                <Download />
              </IconButton>
            </>
          )}
          
          <IconButton onClick={handleNativeShareCollage} sx={{ marginTop: "10px", backgroundColor: "transparent", color: "#214224", marginLeft: "10px" }} >
            <Share />
          </IconButton>
        </Paper>
      )}

      <Box sx={{ marginTop: "20px", textAlign: "left" }}>
        <Typography variant="h6" sx={{ marginBottom: "10px" }}>
          Comments
        </Typography>

        <TextField fullWidth variant="outlined" placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} sx={{ marginBottom: "10px" }} />
        
        <Button variant="contained" onClick={handlePostComment} sx={{ marginBottom: "20px" }} >
          Post Comment
        </Button>

        <List>
          {comments.map((comment) => (
            <ListItem key={comment.id}>
              <Avatar sx={{ marginRight: "10px" }}>
                {comment.postedByUsername.charAt(0)}
              </Avatar>

              <ListItemText primary={comment.postedByUsername} secondary={comment.text} />

              <IconButton onClick={() => handleLikeComment(comment.id)}>
                <ThumbUp />
                <Typography sx={{ marginLeft: "5px" }}>{comment.likes}</Typography>
              </IconButton>

              {(auth.currentUser?.uid === comment.postedBy || auth.currentUser?.uid === collage?.postedBy) && (
                <IconButton onClick={() => handleDeleteComment(comment.id, comment.postedBy)}>
                  <Delete />
                </IconButton>
              )}
            </ListItem>
          ))}
        </List>
      </Box>

      <Dialog open={showConfirmationModal} onClose={() => setShowConfirmationModal(false)} PaperProps={{ sx: { backgroundColor: "#214224", color: "#f0f0f0"}}}>
        <DialogTitle sx={{ fontFamily: "'TanPearl', sans-serif", color: "#f0f0f0" }}>Are you sure?</DialogTitle>
        
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "'TanPearl', sans-serif", color: "#f0f0f0" }}>
            This action cannot be undone. The collage will be permanently deleted.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowConfirmationModal(false)} sx={{ fontFamily: "'TanPearl', sans-serif", color: "#f0f0f0" }}>Cancel</Button>
          
          <Button onClick={handleDeleteCollage} sx={{ fontFamily: "'TanPearl', sans-serif", backgroundColor: "#ff5757", color: "#f0f0f0" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f0f0",
    padding: "20px",
    textAlign: "center",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#214224",
    fontFamily: "'TanPearl', sans-serif"
  },
  errorMessage: {
    color: "#FF5757",
    textAlign: "center",
    marginBottom: "20px",
  },
  collageContainer: {
    position: "relative",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    padding: "20px",
    textAlign: "center",
  },
  collageTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#214224",
    fontFamily: "'TanPearl', sans-serif"
  },
  collageArea: {
    position: "relative",
    width: "100%",
    height: "800px",
    backgroundColor: "#808080",
    marginBottom: 2,
    overflow: "hidden"
  },
  viewsCount: {
    marginTop: "10px",
    color: "#214224",
    fontFamily: "'TanPearl', sans-serif"
  },
};

export default CollageDetailsPage;