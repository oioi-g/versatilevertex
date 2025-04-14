import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc } from "firebase/firestore";
import { auth, db, storage } from "../firebase";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { Paper, IconButton, Container, Typography, Button, Box, Slider, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Alert, TextField } from "@mui/material";
import { styled } from "@mui/system";
import { Close } from "@mui/icons-material";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

const DraftDetailsPage = () => {
  const { draftId } = useParams();
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [collageItems, setCollageItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [showDraftNameModal, setShowDraftNameModal] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [showPostCollageModal, setShowPostCollageModal] = useState(false);
  const [collageName, setCollageName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const collageRef = useRef(null);

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("You need to be logged in to view the draft.");
          return;
        }
        const draftRef = doc(db, "user", user.uid, "drafts", draftId);
        const draftSnap = await getDoc(draftRef);
        if (draftSnap.exists()) {
          const draftData = draftSnap.data();
          setDraft(draftData);
          setCollageItems(draftData.collage || []);
          setHistory([{ collageItems: draftData.collage || [] }]);
        } 
        else {
          setError("Draft not found.");
        }
      } 
      catch (error) {
        console.error(error);
        setError("Failed to fetch the draft. Please try again later.");
      }
    };
    fetchDraft();
  }, [draftId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectedItem !== null && !e.target.closest(".pinContainer")) {
        setSelectedItem(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [selectedItem]);

  const saveToHistory = (newState) => {
    setCollageItems(newState.collageItems);
    setHistory((prev) => [...prev, { collageItems: newState.collageItems }]);
    setRedoStack([]);
  };

  const handleDragStop = (index, e, data) => {
    const updatedCollage = [...collageItems];
    updatedCollage[index] = { ...updatedCollage[index], x: data.x, y: data.y };
    saveToHistory({ collageItems: updatedCollage });
  };

  const handleResizeStop = (index, e, data) => {
    const updatedCollage = [...collageItems];
    updatedCollage[index] = {
      ...updatedCollage[index],
      width: data.size.width,
      height: data.size.height,
    };
    saveToHistory({ collageItems: updatedCollage });
  };

  const undo = () => {
    if (history.length > 1) {
      const previousState = history[history.length - 2];
      setRedoStack((prev) => [...prev, { collageItems }]);
      setHistory(history.slice(0, -1));
      setCollageItems(previousState.collageItems);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setHistory((prev) => [...prev, { collageItems }]);
      setRedoStack(redoStack.slice(0, -1));
      setCollageItems(nextState.collageItems);
    }
  };

  const flipImage = (index) => {
    const updatedCollage = [...collageItems];
    updatedCollage[index].flipped = !updatedCollage[index].flipped;
    saveToHistory({ collageItems: updatedCollage });
  };

  const rotateImage = (index) => {
    const updatedCollage = [...collageItems];
    updatedCollage[index].rotation = (updatedCollage[index].rotation || 0) + 90;
    saveToHistory({ collageItems: updatedCollage });
  };

  const changeOpacity = (index, value) => {
    const updatedCollage = [...collageItems];
    updatedCollage[index].opacity = value;
    saveToHistory({ collageItems: updatedCollage });
  };

  const removeImage = (index) => {
    const updatedCollage = collageItems.filter((_, i) => i !== index);
    saveToHistory({ collageItems: updatedCollage });
    setSelectedItem(null);
  };

  const removeBackground = async (index) => {
    try {
      const selectedImage = collageItems[index];
      const imageUrl = selectedImage.imageUrl;
      const formData = new FormData();
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      formData.append("image_file", blob);
      const apiResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": "sDn1LfWPbDRmoRHCRhM4f8vY",
        },
        body: formData,
      });
      if (!apiResponse.ok) {
        throw new Error("Failed to remove background");
      }
      const resultBlob = await apiResponse.blob();
      const storageRef = ref(storage, `processed-images/${Date.now()}.png`);
      await uploadBytes(storageRef, resultBlob);
      const downloadUrl = await getDownloadURL(storageRef);
      const updatedCollage = [...collageItems];
      updatedCollage[index].imageUrl = downloadUrl;
      saveToHistory({ collageItems: updatedCollage });
      const user = auth.currentUser;
      if (user && draftId) {
        const draftRef = doc(db, "user", user.uid, "drafts", draftId);
        await updateDoc(draftRef, {
          collage: updatedCollage,
        });
      }
      setSnackbarMessage("Background removed successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage("Failed to remove the background. Please try again later.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You need to be logged in to save the draft.");
        return;
      }
      if (!draftName.trim()) {
        setError("Please enter a name for the draft.");
        return;
      }
      const draftData = {
        name: draftName,
        collage: collageItems,
        updatedAt: new Date(),
      };
      if (draftId) {
        const draftRef = doc(db, "user", user.uid, "drafts", draftId);
        await updateDoc(draftRef, draftData);
      } else {
        const draftRef = collection(db, "user", user.uid, "drafts");
        await addDoc(draftRef, { ...draftData, createdAt: new Date() });
      }
      setSnackbarMessage("Draft saved successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setShowDraftNameModal(false);
      setDraftName("");
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage("Failed to save the draft. Please try again later.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handlePostCollage = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You need to be logged in to post the collage.");
        return;
      }
      if (!collageName.trim()) {
        setShowPostCollageModal(true);
        return;
      }
      const userDocRef = doc(db, "user", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        setError("User data not found.");
        return;
      }
      const userData = userDocSnap.data();
      const username = userData.username;
      const formattedCollageItems = collageItems.map((item) => ({
        imageUrl: item.imageUrl,
        layout: {
          x: item.x || 0,
          y: item.y || 0,
          width: item.width || 100,
          height: item.height || 100,
          rotation: item.rotation || 0,
          zIndex: item.zIndex || 0,
        },
        opacity: item.opacity !== undefined ? item.opacity : 1,
        flipped: item.flipped || false,
        hasTransparency: item.hasTransparency || false
      }));
      const publicCollageRef = collection(db, "publicCollages");
      await addDoc(publicCollageRef, {
        name: collageName,
        collage: formattedCollageItems,
        createdAt: new Date(),
        updatedAt: new Date(),
        postedBy: user.uid,
        postedByUsername: username,
        likes: 0,
        comments: [],
      });
      if (draftId) {
        const draftRef = doc(db, "user", user.uid, "drafts", draftId);
        await deleteDoc(draftRef);
      }
      setSnackbarMessage("Collage posted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setShowPostCollageModal(false);
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage("Failed to post the collage. Please try again later.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };
  
  const handleDeleteDraft = async () => {
    try {
      const user = auth.currentUser ;
      if (!user) {
        setError("You need to be logged in to delete the draft.");
        return;
      }
      const draftRef = doc(db, "user", user.uid, "drafts", draftId);
      await deleteDoc(draftRef);
      setSnackbarMessage("Draft deleted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setShowDeleteModal(false);
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage("Failed to delete the draft. Please try again later.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container sx={styles.container}>
      {error && <Typography color="error" align="center">{error}</Typography>}

      {draft && (
        <StyledPaper>
          <Typography variant="h4" align="center" gutterBottom>
            {draft.name}
          </Typography>

          {/* <Box ref={collageRef} sx={styles.collageArea} >
            {collageItems.map((item, index) => (
              <Draggable key={`${index}-${item.imageUrl}`} position={{ x: item.x || 0, y: item.y || 0 }} onStop={(e, data) => handleDragStop(index, e, data)} cancel=".react-resizable-handle"
                sx={{ 
                  position: "absolute", 
                  left: `${item.x || 0}px`, 
                  top: `${item.y || 0}px`, 
                  width: `${item.width || 100}px`, 
                  height: `${item.height || 100}px`, 
                  transform: `rotate(${item.rotation || 0}deg)`, 
                  zIndex: selectedItem === index ? 1000 : 1, 
                  overflow: "hidden" 
                }}>
                <div className="pinContainer">
                  <ResizableBox width={item.width || 100} height={item.height || 100} minConstraints={[50, 50]} maxConstraints={[300, 300]} onResizeStop={(e, data) => handleResizeStop(index, e, data)} >
                    <img src={item.imageUrl} alt={item.title} onClick={() => setSelectedItem(index)} 
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "5px", transform: `${item.flipped ? "scaleX(-1)" : ""}`, opacity: item.opacity || 1 }} 
                    />
                  </ResizableBox>
                </div>
              </Draggable>
            ))}
          </Box> */}

<Box ref={collageRef} sx={styles.collageArea}>
  {collageItems.map((item, index) => (
    <Draggable 
      key={`${index}-${item.imageUrl}`} 
      position={{ x: item.x || 0, y: item.y || 0 }} 
      onStop={(e, data) => handleDragStop(index, e, data)} 
      cancel=".react-resizable-handle"
    >
      <div className="pinContainer">
        <ResizableBox 
          width={item.width || 100} 
          height={item.height || 100}
          minConstraints={[50, 50]}
          maxConstraints={[300, 300]} 
          onResizeStop={(e, data) => handleResizeStop(index, e, data)}
        >
          <img 
            src={item.imageUrl} 
            alt={item.title} 
            onClick={() => setSelectedItem(index)}
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              borderRadius: "5px",
              transform: `${item.flipped ? "scaleX(-1)" : ""} rotate(${item.rotation || 0}deg)`,
              opacity: item.opacity !== undefined ? item.opacity : 1,
              backgroundColor: item.hasTransparency ? "transparent" : undefined
            }} 
          />
        </ResizableBox>
      </div>
    </Draggable>
  ))}
</Box>

          <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
            <Button variant="contained" onClick={undo}>
              Undo
            </Button>
            
            <Button variant="contained" onClick={redo}>
              Redo
            </Button>

            {selectedItem !== null && (
              <>
                <Button variant="contained" onClick={() => flipImage(selectedItem)}>
                  Flip
                </Button>

                <Button variant="contained" onClick={() => rotateImage(selectedItem)}>
                  Rotate
                </Button>

                <Slider value={collageItems[selectedItem]?.opacity || 1} onChange={(e, value) => changeOpacity(selectedItem, value)} min={0} max={1} step={0.1} sx={{ width: 100 }} />
                
                <Button variant="contained" onClick={() => removeBackground(selectedItem)}>
                  Remove Background
                </Button>

                <Button variant="contained" color="error" onClick={() => removeImage(selectedItem)}>
                  Remove
                </Button>
              </>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
            <Button variant="contained" onClick={() => setShowDraftNameModal(true)}>
              Save Draft
            </Button>

            <Button variant="contained" color="secondary" onClick={handlePostCollage}>
              Post Collage
            </Button>

            <Button variant="contained" color="error" onClick={() => setShowDeleteModal(true)}>
              Delete Draft
            </Button>
          </Box>
        </StyledPaper>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>

        <DialogContent>
          <Typography>Are you sure you want to delete this draft? This action cannot be undone.</Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button onClick={handleDeleteDraft} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDraftNameModal} onClose={() => setShowDraftNameModal(false)} PaperProps={{ style: { borderRadius: "10px", padding: "20px", width: "400px", textAlign: "center" }}} >
        <DialogTitle>
          <Typography variant="h6" style={{ fontWeight: "bold", color: "#494949" }}>
            Name Your Draft
          </Typography>

          <IconButton style={{ position: "absolute", right: "10px", top: "10px" }} onClick={() => setShowDraftNameModal(false)} >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <TextField fullWidth value={draftName} placeholder="Enter Draft Name" onChange={(e) => setDraftName(e.target.value)} />
        </DialogContent>

        <DialogActions style={{ justifyContent: "center", padding: "20px" }}>
          <Button variant="contained" onClick={handleSaveDraft} style={{ backgroundColor: "#214224", color: "#fff", borderRadius: "5px", padding: "10px 20px" }} >
            Save Draft
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showPostCollageModal} onClose={() => setShowPostCollageModal(false)}>
        <DialogTitle>
          Name Your Collage
          <IconButton style={{ position: "absolute", right: "10px", top: "10px" }} onClick={() => setShowPostCollageModal(false)} >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <TextField type="text" fullWidth value={collageName} placeholder="Enter Collage Name" onChange={(e) => setCollageName(e.target.value)} />
        </DialogContent>

        <DialogActions>
          <Button onClick={handlePostCollage}>Done</Button>
        </DialogActions>
      </Dialog>
    </Container>
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
    fontFamily: "'TanPearl', sans-serif",
  },
  errorMessage: {
    color: "#FF5757",
    textAlign: "center",
    marginBottom: "20px",
  },
  collageContainer: {
    position: "relative",
    backgroundColor: "#FFFFFF",
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
    fontFamily: "'TanPearl', sans-serif",
  },
  collageArea: {
    position: "relative",
    width: "100%",
    height: "800px",
    backgroundColor: "#808080",
    marginBottom: 2,
    overflow: "hidden"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "20px",
    width: "400px",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  closeButton: {
    position: "absolute",
    right: "10px",
    top: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: "#494949",
  },
  input: {
    width: "100%",
    marginBottom: "20px",
  },
  editButton: {
    backgroundColor: "#214224",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default DraftDetailsPage;