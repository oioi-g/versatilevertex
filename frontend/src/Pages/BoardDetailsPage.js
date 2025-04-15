import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faTimes } from "@fortawesome/free-solid-svg-icons";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc } from "firebase/firestore";
import { auth, db, storage } from "../firebase";
import { Link, useParams } from "react-router-dom";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { Typography, Button, Grid, Paper, TextField, IconButton, Box, Slider, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, Alert } from "@mui/material";
import { styled } from "@mui/system";

const StyledImageContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  cursor: "pointer",
  margin: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
}));

const StyledDeleteOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  right: 0,
  padding: theme.spacing(1),
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  borderBottomLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
}));

const BoardDetailsPage = () => {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);
  const [collageItems, setCollageItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [draftId, setDraftId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [showDraftNameModal, setShowDraftNameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [showPostCollageModal, setShowPostCollageModal] = useState(false);
  const [collageName, setCollageName] = useState("");
  const [collageNameError, setCollageNameError] = useState("");
  const [collages, setCollages] = useState([]);
  const collageRef = useRef(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("You need to be logged in to view board details.");
          return;
        }
        const boardRef = doc(db, "user", user.uid, "boards", boardId);
        const boardSnap = await getDoc(boardRef);
        if (boardSnap.exists()) {
          const boardData = boardSnap.data();
          setBoard({ id: boardSnap.id, ...boardData });
          if (boardData.draftId) {
            const draftRef = doc(db, "user", user.uid, "drafts", boardData.draftId);
            const draftSnap = await getDoc(draftRef);
            if (draftSnap.exists()) {
              const draftData = draftSnap.data();
              setCollageItems(draftData.collage || []);
              setHistory([{ collageItems: draftData.collage || [] }]);
              setDraftId(boardData.draftId);
              setDraftName(draftData.name || "");
            }
          } 
          else {
            setCollageItems(boardData.collage || []);
            setHistory([{ collageItems: boardData.collage || [] }]);
          }
        } 
        else {
          setError("Board not found.");
        }
      } 
      catch (error) {
        console.error(error);
        setError("Failed to fetch the board. Please try again later.");
      }
    };
    fetchBoard();
  }, [boardId]);

  useEffect(() => {
    const fetchCollages = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        if (board?.collages && Array.isArray(board.collages) && board.collages.length > 0) {
          const collagePromises = board.collages.map(async (collage) => {
            if (typeof collage === 'object' && collage !== null) {
              return collage;
            }
            else if (typeof collage === 'string') {
              const collageRef = doc(db, "publicCollages", collage);
              const collageSnap = await getDoc(collageRef);
              if (collageSnap.exists()) {
                return { id: collageSnap.id, ...collageSnap.data() };
              }
            }
            return null;
          });
          const fetchedCollages = (await Promise.all(collagePromises)).filter(Boolean);
          setCollages(fetchedCollages);
        } 
        else {
          setCollages([]);
        }
      } 
      catch (error) {
        console.error(error);
        setCollages([]);
      }
    };
    if (board) {
      fetchCollages();
    }
  }, [board]);
  
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

  // const handleSaveAsDraft = async () => {
  //   try {
  //     const user = auth.currentUser;
  //     if (!user) {
  //       setError("You need to be logged in to save the collage as a draft.");
  //       return;
  //     }
  //     if (!draftName.trim()) {
  //       setError("Please enter a name for the draft.");
  //       return;
  //     }
  //     const draftData = {
  //       name: draftName,
  //       collage: collageItems.map((item) => ({
  //         ...item,
  //         opacity: item.opacity || 1,
  //       })),
  //       updatedAt: new Date(),
  //     };
  //     if (draftId) {
  //       const draftRef = doc(db, "user", user.uid, "drafts", draftId);
  //       await updateDoc(draftRef, draftData);
  //     } 
  //     else {
  //       const draftRef = collection(db, "user", user.uid, "drafts");
  //       const newDraftRef = await addDoc(draftRef, {
  //         ...draftData,
  //         createdAt: new Date(),
  //       });
  //       setDraftId(newDraftRef.id);
  //       const boardRef = doc(db, "user", user.uid, "boards", boardId);
  //       await updateDoc(boardRef, {
  //         draftId: newDraftRef.id,
  //       });
  //     }
  //     setShowConfirmation(true);
  //     setShowDraftNameModal(false);
  //     setDraftName("");
  //   } 
  //   catch (error) {
  //     console.error(error);
  //     setError("Failed to save the collage as a draft. Please try again later.");
  //   }
  // };

  const handleSaveAsDraft = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You need to be logged in to save the collage as a draft.");
        return;
      }
      if (!draftName.trim()) {
        setError("Please enter a name for the draft.");
        return;
      }
      
      // Format collage items consistently
      const draftData = {
        name: draftName,
        collage: collageItems.map(item => ({
          ...item,
          x: item.x || 0,
          y: item.y || 0,
          width: item.width || 100,
          height: item.height || 100,
          rotation: item.rotation || 0,
          zIndex: item.zIndex || 0,
          opacity: item.opacity !== undefined ? item.opacity : 1,
          flipped: item.flipped || false
        })),
        updatedAt: new Date(),
      };
  
      if (draftId) {
        const draftRef = doc(db, "user", user.uid, "drafts", draftId);
        await updateDoc(draftRef, draftData);
      } else {
        const draftRef = collection(db, "user", user.uid, "drafts");
        const newDraftRef = await addDoc(draftRef, {
          ...draftData,
          createdAt: new Date(),
        });
        setDraftId(newDraftRef.id);
        const boardRef = doc(db, "user", user.uid, "boards", boardId);
        await updateDoc(boardRef, {
          draftId: newDraftRef.id,
        });
      }
      
      setShowConfirmation(true);
      setShowDraftNameModal(false);
      setDraftName("");
    } catch (error) {
      console.error(error);
      setError("Failed to save the collage as a draft. Please try again later.");
    }
  };

  const addCollageToBoard = (collage) => {
    const newCollageItems = [
      ...collageItems,
      ...collage.collage.map(item => ({
        ...item,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }))
    ];
    saveToHistory({ collageItems: newCollageItems });
  };
  
  const deleteCollageFromMoodboard = async (index) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const updatedCollages = [...board.collages];
      updatedCollages.splice(index, 1);
      const boardRef = doc(db, "user", user.uid, "boards", boardId);
      await updateDoc(boardRef, {
        collages: updatedCollages
      });      
      setBoard(prev => ({ ...prev, collages: updatedCollages }));
      setCollages(prev => prev.filter((_, i) => i !== index));
      const collageToRemove = collages[index];
      const updatedCollageItems = collageItems.filter(item => 
        !collageToRemove.collage.some(collageItem => collageItem.imageUrl === item.imageUrl)
      );
      setCollageItems(updatedCollageItems);
    } 
    catch (error) {
      console.error("Error deleting collage:", error);
      setSnackbarMessage("Failed to delete collage");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // const handlePostCollage = async () => {
  //   try {
  //     const user = auth.currentUser;
  //     if (!user) {
  //       setError("You need to be logged in to post the collage.");
  //       return;
  //     }
  //     const userDocRef = doc(db, "user", user.uid);
  //     const userDocSnap = await getDoc(userDocRef);
  //     if (!userDocSnap.exists()) {
  //       setError("User data not found.");
  //       return;
  //     }
  //     const userData = userDocSnap.data();
  //     const username = userData.username || "Anonymous";
  //     const formattedCollageItems = collageItems.map((item) => ({
  //       imageUrl: item.imageUrl,
  //       x: item.x || 0,
  //       y: item.y || 0,
  //       width: item.width || 100,
  //       height: item.height || 100,
  //       rotation: item.rotation || 0,
  //       zIndex: item.zIndex || 0,
  //       opacity: item.opacity || 1,
  //       flipped: item.flipped || false,
  //       layout: {
  //         x: item.x || 0,
  //         y: item.y || 0,
  //         width: item.width || 100,
  //         height: item.height || 100,
  //         rotation: item.rotation || 0,
  //         zIndex: item.zIndex || 0,
  //       },
  //     }));
  //     if (!collageName.trim()) {
  //       setShowPostCollageModal(true);
  //       return;
  //     }
  //     const publicCollageRef = collection(db, "publicCollages");
  //     await addDoc(publicCollageRef, {
  //       name: collageName,
  //       collage: formattedCollageItems,
  //       containerWidth: 1000,
  //       containerHeight: 800,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //       postedBy: user.uid,
  //       postedByUsername: username,
  //       likes: 0,
  //       comments: [],
  //     });
  //     if (draftId) {
  //       const draftRef = doc(db, "user", user.uid, "drafts", draftId);
  //       await deleteDoc(draftRef);
  //       setDraftId(null);
  //     }
  //     setSnackbarMessage("Collage posted successfully!");
  //     setSnackbarSeverity("success");
  //     setSnackbarOpen(true);
  //   } 
  //   catch (error) {
  //     console.error(error);
  //     setError("Failed to post the collage. Please try again later.");
  //   }
  // };

  const handlePostCollage = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You need to be logged in to post the collage.");
        return;
      }
      const userDocRef = doc(db, "user", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        setError("User data not found.");
        return;
      }
      const userData = userDocSnap.data();
      const username = userData.username || "Anonymous";
      
      // Format collage items consistently
      const formattedCollageItems = collageItems.map((item) => ({
        imageUrl: item.imageUrl,
        x: item.x || 0,
        y: item.y || 0,
        width: item.width || 100,
        height: item.height || 100,
        rotation: item.rotation || 0,
        zIndex: item.zIndex || 0,
        opacity: item.opacity !== undefined ? item.opacity : 1,
        flipped: item.flipped || false,
        // Also include the layout object for compatibility
        layout: {
          x: item.x || 0,
          y: item.y || 0,
          width: item.width || 100,
          height: item.height || 100,
          rotation: item.rotation || 0,
          zIndex: item.zIndex || 0,
        }
      }));
  
      if (!collageName.trim()) {
        setShowPostCollageModal(true);
        return;
      }
  
      const publicCollageRef = collection(db, "publicCollages");
      await addDoc(publicCollageRef, {
        name: collageName,
        collage: formattedCollageItems,
        containerWidth: 1000,
        containerHeight: 800,
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
        setDraftId(null);
      }
      
      setSnackbarMessage("Collage posted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setShowPostCollageModal(false);
    } catch (error) {
      console.error(error);
      setError("Failed to post the collage. Please try again later.");
    }
  };
  
  const addImageToCollage = (pin) => {
    const newCollageItems = [
      ...collageItems,
      {
        ...pin,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
    ];
    saveToHistory({ collageItems: newCollageItems });
  };

  // const deleteImageFromMoodboard = (index) => {
  //   const updatedPins = [...board.pins];
  //   const deletedPin = updatedPins.splice(index, 1)[0];
  //   const updatedCollageItems = collageItems.filter((item) => item.imageUrl !== deletedPin.imageUrl);
  //   setBoard((prevBoard) => ({
  //     ...prevBoard,
  //     pins: updatedPins,
  //   }));
  //   setCollageItems(updatedCollageItems);
  // };

  const deleteImageFromMoodboard = async (index) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const boardRef = doc(db, "user", user.uid, "boards", boardId);
      
      if (board.pins?.[index]) {
        // It's a pin
        const updatedPins = [...board.pins];
        const deletedPin = updatedPins.splice(index, 1)[0];
        
        await updateDoc(boardRef, {
          pins: updatedPins
        });
        
        setBoard(prev => ({ ...prev, pins: updatedPins }));
        const updatedCollageItems = collageItems.filter(item => item.imageUrl !== deletedPin.imageUrl);
        setCollageItems(updatedCollageItems);
      }
      
    } catch (error) {
      console.error("Error deleting image:", error);
      setSnackbarMessage("Failed to delete image");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
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
      if (!selectedImage?.imageUrl) {
        throw new Error("No image URL found");
      }
      const response = await fetch(selectedImage.imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();
      if (!blob) {
        throw new Error("Failed to convert image to blob");
      }
      const formData = new FormData();
      formData.append("image_file", blob);
      const apiResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": "sDn1LfWPbDRmoRHCRhM4f8vY",
        },
        body: formData,
      });
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(
          `API Error: ${apiResponse.status} - ${errorData?.errors?.[0]?.title || 'Unknown error'}`
        );
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
        await updateDoc(doc(db, "user", user.uid, "drafts", draftId), {
          collage: updatedCollage,
        });
      }
      setSnackbarMessage("Background removed successfully!");
      setSnackbarSeverity("success");
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage(
        error.message || "Failed to remove the background. Please try again later."
      );
      setSnackbarSeverity("error");
    } 
    finally {
      setSnackbarOpen(true);
    }
  };
  
  const handleDeleteBoard = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You need to be logged in to delete the board.");
        return;
      }
      const boardRef = doc(db, "user", user.uid, "boards", boardId);
      await deleteDoc(boardRef);
      setSnackbarMessage("Board deleted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setTimeout(() => {
        window.location.href = "/homepage";
      }, 2000);
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage("Failed to delete the board. Please try again later.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handlePostCollageClick = () => {
    setShowPostCollageModal(true);
  };

  const handleDoneModal = () => {
    if (!collageName.trim()) {
      setCollageNameError("Collage name cannot be empty.");
      return;
    }
    setCollageNameError("");
    handlePostCollage();
    setShowPostCollageModal(false);
  };

  return (
    <Box sx={styles.container}>
      {error && (
        <Typography variant="body1" sx={styles.errorMessage}>
          {error}
        </Typography>
      )}

      {board && (
        <Paper elevation={3} sx={styles.collageContainer}>
          <Typography variant="h4" align="center" gutterBottom sx={{ color: "#214224" }}>
            {board.name}
          </Typography>
          <Typography variant="body1" align="center" gutterBottom sx={{ color: "#214224" }}>
            {board.description}
          </Typography>

          <Box ref={collageRef} sx={styles.collageArea} >
            {collageItems.map((item, index) => (
              <Draggable
                key={`${index}-${item.imageUrl}`}
                position={{ x: item.x || 0, y: item.y || 0 }}
                onStop={(e, data) => handleDragStop(index, e, data)}
                cancel=".react-resizable-handle"
              >
                <div className="pinContainer" style={{ position: "absolute", zIndex: selectedItem === index ? 1000 : 1 }}>
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
                        transform: `${item.flipped ? "scaleX(-1) " : ""}rotate(${item.rotation || 0}deg)`,
                        opacity: item.opacity || 1,
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
                <Button variant="contained" color="error" onClick={() => removeImage(selectedItem)}>
                  Remove
                </Button>
                <Button variant="contained" onClick={() => removeBackground(selectedItem)}>
                  Remove Background
                </Button>
              </>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
            <Button variant="contained" onClick={() => setShowDraftNameModal(true)}>
              Save as Draft
            </Button>

            <Button variant="contained" color="secondary" onClick={handlePostCollageClick}>
              Post Collage
            </Button>

            <Button variant="contained" color="error" onClick={() => setShowDeleteModal(true)} >
              Delete Board
            </Button>
          </Box>

          <Typography variant="h5" align="center" gutterBottom sx={{ color: "#214224" }}>
            All Images
          </Typography>

          <Grid container spacing={2}>
            {board.pins?.map((pin, index) => (
              <Grid item key={`pin-${index}`} xs={12} sm={6} md={4} lg={3}>
                <StyledImageContainer>
                  <img 
                    src={pin.imageUrl} 
                    alt={pin.title} 
                    style={{ width: "100%", height: "300px", objectFit: "cover", borderRadius: "5px" }} 
                    onClick={() => addImageToCollage(pin)} 
                  />

                  <StyledDeleteOverlay>
                    <IconButton onClick={() => deleteImageFromMoodboard(index)}>
                      <FontAwesomeIcon icon={faTrash} style={{ color: "#F5EDE6" }} />
                    </IconButton>
                  </StyledDeleteOverlay>
                </StyledImageContainer>
              </Grid>
            ))}

            {collages.map((collage, index) => {
              const thumbnailImage = collage.collage[0]?.imageUrl || "";
              return (
                <Grid item key={`collage-${index}`} xs={12} sm={6} md={4} lg={3}>
                  <StyledImageContainer>
                    <img 
                      src={thumbnailImage} 
                      alt={`Collage ${index + 1}`} 
                      style={{ width: "100%", height: "300px", objectFit: "cover", borderRadius: "5px" }} 
                      onClick={() => addCollageToBoard(collage)}
                    />

                    <StyledDeleteOverlay>
                      <IconButton onClick={() => deleteCollageFromMoodboard(index)}>
                        <FontAwesomeIcon icon={faTrash} style={{ color: "#F5EDE6" }} />
                      </IconButton>
                    </StyledDeleteOverlay>

                    <Box sx={{ position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(0, 0, 0, 0.6)", color: "white", padding: "4px 8px", borderRadius: 4 }}>
                      <Typography variant="caption">Collage</Typography>
                    </Box>
                  </StyledImageContainer>
                </Grid>
              );
            })}
          </Grid>
        </Paper> 
      )}

      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} PaperProps={{ sx: { backgroundColor: "#214224", color: "#f0f0f0" }}} >
        <DialogTitle sx={{ fontFamily: "'TanPearl', sans-serif", color: "#f0f0f0" }}>
          Are you sure?
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ fontFamily: "'TanPearl', sans-serif", color: "#f0f0f0" }}>
            This action cannot be undone. The board will be permanently deleted.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDeleteModal(false)} sx={{ fontFamily: "'TanPearl', sans-serif", color: "#f0f0f0" }}>
            Cancel
          </Button>

          <Button onClick={handleDeleteBoard} sx={{ fontFamily: "'TanPearl', sans-serif", backgroundColor: "#ff5757", color: "#f0f0f0" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      <Dialog open={showDraftNameModal} onClose={() => setShowDraftNameModal(false)} PaperProps={{ style: { borderRadius: "10px", padding: "20px", width: "400px", textAlign: "center", backgroundColor: "#214224" }}} >
        <DialogTitle>
          <Typography variant="h6" style={{ fontWeight: "bold", color: "#f0f0f0" }}>
            Name Your Draft
          </Typography>

          <IconButton style={{ position: "absolute", right: "10px", top: "10px", color: "#f0f0f0" }} onClick={() => setShowDraftNameModal(false)} >
            <FontAwesomeIcon icon={faTimes} />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <TextField fullWidth variant="outlined" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Enter draft name" style={{ marginTop: "10px" }} sx={{ input: { color: "#f0f0f0" }, border: "#f0f0f0", '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#f0f0f0' }, '&:hover fieldset': { borderColor: '#f0f0f0' }}}} />
        </DialogContent>

        <DialogActions style={{ justifyContent: "center", padding: "20px" }}>
          <Button variant="contained" onClick={handleSaveAsDraft} style={{ backgroundColor: "#f0f0f0", color: "#214224", borderRadius: "5px", padding: "10px 20px" }} >
            Save Draft
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showConfirmation} onClose={() => setShowConfirmation(false)} PaperProps={{ style: { borderRadius: "10px", padding: "20px", width: "400px", textAlign: "center" }}} >
        <DialogTitle>
          <Typography variant="h6" style={{ fontWeight: "bold", color: "#494949" }}>
            Draft Saved Successfully!
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" style={{ marginBottom: "20px" }}>
            Your draft has been saved.
          </Typography>

          <Link to="/viewdraftspage" style={{ textDecoration: "none" }}>
            <Button variant="contained" style={{ backgroundColor: "#214224", color: "#fff", borderRadius: "5px", padding: "10px 20px", marginBottom: "10px" }} >
              View Drafts
            </Button>
          </Link>
        </DialogContent>

        <DialogActions style={{ justifyContent: "center", padding: "20px" }}>
          <Button variant="outlined" onClick={() => setShowConfirmation(false)} style={{ borderColor: "#214224", color: "#214224", borderRadius: "5px", padding: "10px 20px" }} >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showPostCollageModal} onClose={() => setShowPostCollageModal(false)} PaperProps={{ style: { borderRadius: "10px", padding: "20px", width: "400px", textAlign: "center", backgroundColor: "#214224" }}}>
        <DialogTitle sx={{ color: "#f0f0f0" }}>Name Your Collage</DialogTitle>
        <DialogContent>
          <TextField fullWidth variant="outlined" value={collageName} onChange={(e) => setCollageName(e.target.value)} error={!!collageNameError} helperText={collageNameError} placeholder="Enter Collage Name" sx={{ input: { color: "#f0f0f0" }, border: "#f0f0f0", '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#f0f0f0' }, '&:hover fieldset': { borderColor: '#f0f0f0' }}}} />
        </DialogContent>

        <DialogActions>
          <IconButton style={{ position: "absolute", right: "10px", top: "10px", color: "#f0f0f0" }} onClick={() => setShowPostCollageModal(false)} >
            <FontAwesomeIcon icon={faTimes} />
          </IconButton>

          <Button onClick={handleDoneModal} sx={{ backgroundColor: "#f0f0f0", color: "#214224" }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
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
    fontFamily: "'TanPearl', sans-serif",
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
  confirmationModal: {
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
  confirmationContent: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "20px",
    width: "400px",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  viewDraftsLink: {
    textDecoration: "none",
    color: "#214224",
    fontWeight: "bold",
  },
};

export default BoardDetailsPage;