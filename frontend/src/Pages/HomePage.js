import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, addDoc, arrayUnion, query, where, getDoc, collectionGroup, onSnapshot, increment } from "firebase/firestore";
import { db, auth } from "../firebase";
import { getAuth } from "firebase/auth";
import { Link } from "react-router-dom";
import { Box, Button, TextField, Typography, Grid, Modal, IconButton, Card, Container, CardMedia, Snackbar, Alert, CardActions, CardContent } from "@mui/material";
import { Favorite, Bookmark, Close, Report } from '@mui/icons-material';
import ImageCard from "../Components/ImageCard";
import ReportDialog from "../Components/ReportDialog";

const HomePage = () => {
  const [images, setImages] = useState([]);
  const [likedImages, setLikedImages] = useState([]);
  const [likedCollages, setLikedCollages] = useState([]);
  const [boards, setBoards] = useState([]);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [activeTab, setActiveTab] = useState("images");
  const [searchQuery, setSearchQuery] = useState("");
  const [showImageCard, setShowImageCard] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [publicCollages, setPublicCollages] = useState([]);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [reportCollageOpen, setReportCollageOpen] = useState(false);
  const [collageToReport, setCollageToReport] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [usersBlockedBy, setUsersBlockedBy] = useState([]);

  useEffect(() => {
    const fetchBlockingRelationships = async () => {
      const user = getAuth().currentUser;
      if (!user) return;
      try {
        const blockedUsersRef = collection(db, 'user', user.uid, 'relationships');
        const blockedUsersQuery = query(blockedUsersRef, where('type', '==', 'block'));
        const blockedUsersSnapshot = await getDocs(blockedUsersQuery);
        const blockedUsersData = blockedUsersSnapshot.docs.map(doc => doc.id);
        setBlockedUsers(blockedUsersData);
        const blockingUsersQuery = query(
          collectionGroup(db, 'relationships'),
          where('targetUserId', '==', user.uid),
          where('type', '==', 'block')
        );
        const blockingUsersSnapshot = await getDocs(blockingUsersQuery);
        const blockingUsersData = blockingUsersSnapshot.docs.map(doc => doc.ref.parent.parent.id);
        setUsersBlockedBy(blockingUsersData);
      } 
      catch (error) {
        console.error("Error fetching blocking relationships:", error);
      }
    };
    fetchBlockingRelationships();
  }, []);

  const fetchImages = async (searchQuery = "") => {
    try {
      let imagesCollection = collection(db, "unsplashImages");
      let snapshot;
      if (searchQuery) {
        const q = query(
          imagesCollection,
          where("description", ">=", searchQuery),
          where("description", "<=", searchQuery + "\uf8ff")
        );
        snapshot = await getDocs(q);
      } 
      else {
        snapshot = await getDocs(imagesCollection);
      }  
      let imagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const shuffledImages = imagesData.sort(() => 0.5 - Math.random());
      const uniqueImages = [];
      const imageUrlSet = new Set();
      for (const image of shuffledImages) {
        if (!imageUrlSet.has(image.imageUrl)) {
          uniqueImages.push(image);
          imageUrlSet.add(image.imageUrl);
        }
      }
      setImages(uniqueImages.slice(0, 30));
    } 
    catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    const fetchBoards = async () => {
      const user = getAuth().currentUser;
      if (!user) return;
      try {
        const userRef = doc(db, "user", user.uid);
        const boardsRef = collection(userRef, "boards");
        const snapshot = await getDocs(boardsRef);
        const boardsData = [];
        snapshot.forEach((doc) => {
          boardsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setBoards(boardsData);
      } 
      catch (error) {
        console.error(error);
      }
    };
    fetchBoards();
  }, []);

  useEffect(() => {
    const fetchLikedImages = async () => {
      const user = getAuth().currentUser;
      if (!user) return;
      try {
        const likedImagesCollection = collection(db, "user", user.uid, "liked_images");
        const snapshot = await getDocs(likedImagesCollection);
        const likedImagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLikedImages(likedImagesData);
      } 
      catch (error) {
        console.error(error);
      }
    };
    fetchLikedImages();
  }, []);

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

  const handleLikeImage = async (image) => {
    const user = getAuth().currentUser;
    if (!user) {
      console.error("User not authenticated.");
      return;
    }
    const userRef = doc(db, "user", user.uid, "liked_images", image.id);
    try {
      if (likedImages.some((likedImage) => likedImage.id === image.id)) {
        await deleteDoc(userRef);
        setLikedImages((prevLikes) => prevLikes.filter((likedImage) => likedImage.id !== image.id));
        await updateDoc(doc(db, "unsplashImages", image.id), {
          likes: (image.likes || 0) - 1,
        });
      } 
      else {
        await setDoc(userRef, {
          liked: true,
          imageUrl: image.imageUrl,
          description: image.description,
          timestamp: new Date(),
        });
        setLikedImages((prevLikes) => [...prevLikes, image]);
        await updateDoc(doc(db, "unsplashImages", image.id), {
          likes: (image.likes || 0) + 1,
        });
      }
      const updatedImageDoc = await getDoc(doc(db, "unsplashImages", image.id));
      const updatedImage = { id: updatedImageDoc.id, ...updatedImageDoc.data() };
      setImages((prevImages) =>
        prevImages.map((img) => (img.id === image.id ? updatedImage : img))
      );
      if (currentImage && currentImage.id === image.id) {
        setCurrentImage(updatedImage);
      }
    } 
    catch (error) {
      console.error(error);
    }
  };
  
  const handleAddToLibrary = (image) => {
    setSelectedItem({
      ...image,
      isCollage: false
    });
    setShowBoardModal(true);
  };

  const handleAddCollageToLibrary = (collage) => {
    setSelectedItem({
      id: collage.id,
      imageUrl: collage.collage[0]?.imageUrl || "",
      description: collage.name,
      isCollage: true,
      collageData: collage
    });
    setShowBoardModal(true);
  };

  const handleCreateBoard = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      console.error("User not authenticated.");
      return;
    }
    if (!newBoardName.trim()) {
      setSnackbarMessage("Please enter a board name");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      const newBoard = {
        name: newBoardName,
        description: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: user.uid,
      };
      if (selectedItem.isCollage) {
        newBoard.collages = [selectedItem.collageData];
      } else {
        newBoard.pins = [selectedItem];
      }
      const userRef = doc(db, "user", user.uid);
      const boardsRef = collection(userRef, "boards");
      const boardRef = await addDoc(boardsRef, newBoard);
      const draftRef = collection(db, "user", user.uid, "drafts");
      const newDraftRef = await addDoc(draftRef, {
        boardId: boardRef.id,
        collage: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await updateDoc(boardRef, {
        draftId: newDraftRef.id,
      });
      setBoards((prevBoards) => [
        ...prevBoards,
        { 
          id: boardRef.id, 
          ...newBoard, 
          draftId: newDraftRef.id 
        },
      ]);
      setSnackbarMessage(`Board "${newBoardName}" created successfully!`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setShowBoardModal(false);
      setNewBoardName("");
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage("Failed to create board. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };
  
  const handleAddToSelectedBoard = async (board) => {
    const user = getAuth().currentUser;
    if (!user) {
      console.error("User not authenticated.");
      return;
    }
    try {
      const boardRef = doc(db, "user", user.uid, "boards", board.id);
      if (selectedItem.isCollage) {
        await updateDoc(boardRef, {
          collages: arrayUnion(selectedItem.collageData),
          updatedAt: new Date(),
        });
        setBoards((prevBoards) =>
          prevBoards.map((b) =>
            b.id === board.id
              ? { 
                  ...b, 
                  collages: [...(b.collages || []), selectedItem.collageData] 
                }
              : b
          )
        );
        setSnackbarMessage(`Collage added successfully to ${board.name}!`);
      } 
      else {
        await updateDoc(boardRef, {
          pins: arrayUnion(selectedItem),
          updatedAt: new Date(),
        });
        setBoards((prevBoards) =>
          prevBoards.map((b) =>
            b.id === board.id
              ? { ...b, pins: [...b.pins, selectedItem] }
              : b
          )
        );
        setSnackbarMessage(`Image added successfully to ${board.name}!`);
      }
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setShowBoardModal(false);
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage(`Failed to add ${selectedItem.isCollage ? 'collage' : 'image'} to board. Please try again.`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleImageClick = (image) => {
    setCurrentImage(image);
    setShowImageCard(true);
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const likedCollagesRef = collection(db, "user", user.uid, "liked_collages");
    const unsubscribe = onSnapshot(likedCollagesRef, (snapshot) => {
      const likedCollagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLikedCollages(likedCollagesData);
    });
    return () => unsubscribe();
  }, []);

  const handleLikeCollage = async (collage) => {
    const user = getAuth().currentUser;
    if (!user) {
      setSnackbarMessage("Please log in to like collages");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      const userLikeRef = doc(db, "user", user.uid, "liked_collages", collage.id);
      const collageRef = doc(db, "publicCollages", collage.id);
      if (likedCollages.some((likedCollage) => likedCollage.id === collage.id)) {
        await deleteDoc(userLikeRef);
        await updateDoc(collageRef, {
          likes: increment(-1),
        });
        setLikedCollages((prev) => prev.filter(liked => liked.id !== collage.id));
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
        setLikedCollages((prev) => [...prev, collage]);
      }
      setPublicCollages(prev => prev.map(c => 
        c.id === collage.id 
          ? {...c, likes: (c.likes || 0) + (likedCollages.some(liked => liked.id === collage.id) ? -1 : 1)}
          : c
      ));
    } 
    catch (error) {
      console.error(error);
      setSnackbarMessage("Failed to update like status");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };
  
  const handleReportImage = async (image, reason) => {
    const user = getAuth().currentUser;
    if (!user) {
      setSnackbarMessage("You need to log in to report content.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      const reportsRef = collection(db, "reports");
      await addDoc(reportsRef, {
        type: "image",
        contentId: image.id,
        reporterId: user.uid,
        reportedUserId: "external api source",
        reason: reason || "Inappropriate content",
        reportedAt: new Date(),
        status: "pending",
      });
      setSnackbarMessage("Image reported successfully. Our team will review it.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } 
    catch (error) {
      console.error("Error reporting image:", error);
      setSnackbarMessage("Failed to report image. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleReportCollage = async (collage, reason) => {
    const user = getAuth().currentUser;
    if (!user) {
      setSnackbarMessage("You need to log in to report content.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      const reportsRef = collection(db, "reports");
      await addDoc(reportsRef, {
        type: "collage",
        contentId: collage.id,
        reporterId: user.uid,
        reportedUserId: collage.createdBy || "unknown",
        reason: reason || "Inappropriate content",
        reportedAt: new Date(),
        status: "pending",
      });
      setSnackbarMessage("Collage reported successfully. Our team will review it.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } 
    catch (error) {
      console.error("Error reporting collage:", error);
      setSnackbarMessage("Failed to report collage. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    const fetchPublicCollages = async () => {
      try {
        const publicCollagesRef = collection(db, "publicCollages");
        const snapshot = await getDocs(publicCollagesRef);
        const allCollages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filteredCollages = allCollages.filter(collage => {
          const isBlocked = blockedUsers.includes(collage.postedBy);
          const isBlockedBy = usersBlockedBy.includes(collage.postedBy);
          return !isBlocked && !isBlockedBy;
        });
        setPublicCollages(filteredCollages);
      } 
      catch (error) {
        console.error("Error fetching collages:", error);
        setError("Failed to fetch collages. Please try again later.");
      }
    };

    fetchPublicCollages();
  }, [blockedUsers, usersBlockedBy]);
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div>
      <Container maxWidth={false} sx={{ backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: "column", gap: "2", padding: "20px" }}>
        
        {error && 
          <Typography sx={{ color: "#FF5757", textAlign: "center" }}> 
            {error} 
          </Typography>
        }

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button variant="contained" sx={{ ...styles.tabButton, backgroundColor: activeTab === "images" ? "#214224" : "#f0f0f0", color: activeTab === "images" ? "#f0f0f0" : "#214224", '&:hover': { backgroundColor: activeTab === "images" ? "#214224" : "#f0f0f0" }}} onClick={() => setActiveTab("images")}>
            Browse Images
          </Button>
          <Button variant="contained" sx={{ ...styles.tabButton, backgroundColor: activeTab === "collages" ? "#214224" : "#f0f0f0", color: activeTab === "collages" ? "#f0f0f0" : "#214224", '&:hover': { backgroundColor: activeTab === "collages" ? "#214224" : "#f0f0f0" }}} onClick={() => setActiveTab("collages")}>
            Browse Collages
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', marginBottom: '10px', marginTop: '20px' }}>
          <TextField type="text" placeholder="Search images" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ width: '300px', '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#214224' }, '&:hover fieldset': { borderColor: '#214224' }}}} variant="outlined" />
          <Button variant="contained" onClick={() => fetchImages(searchQuery)} sx={{ marginLeft: '10px', backgroundColor: '#214224', color: '#f0f0f0', borderRadius: '4px', fontFamily: 'TanPearl, sans-serif', textTransform: 'none', padding: '8px 16px', '&:hover': { backgroundColor: '#f0f0f0', color: '#214224', border: '1px solid #214224' }}}>
            Search
          </Button>
        </Box>

        {activeTab === "images" && (
          <Grid container spacing={2} sx={styles.imageGallery}>
            {images.map((image) => (
              <Grid item key={image.id} xs={12} sm={6} md={4} lg={3}>
                <Card sx={styles.imageContainer} onClick={() => handleImageClick(image)}>
                  <CardMedia component="img" src={image.imageUrl} alt={image.description} sx={styles.image} onError={() => console.log("Failed to load image:", image.imageUrl)} /> 
                  <Box sx={styles.overlay}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeImage(image);
                      }} 
                      sx={{ color: likedImages.some((likedImage) => likedImage.id === image.id) ? "#ff5757" : "#f0f0f0" }}>
                      <Favorite />
                    </IconButton>

                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToLibrary(image);
                      }} 
                      sx={{ color: "#f0f0f0", marginLeft: "10px" }}>
                      <Bookmark />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === "collages" && (
          <Box sx={{ padding: '16px' }}>
            {publicCollages.length === 0 ? (
              <Typography variant="body1" sx={styles.noCollagesMessage}>
                No collages found.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {publicCollages.map((collage) => {
                  const thumbnailImage = collage.collage[0]?.imageUrl || "";
                  return (
                    <Grid item key={collage.id}>
                      <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: "#214224", height: "300px", width: "300px", display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                        {thumbnailImage && (
                          <Box sx={{ padding: 2 }}>
                            <img src={thumbnailImage} alt="Collage Thumbnail" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: 8 }} />
                          </Box>
                        )}

                        <CardContent sx={{ paddingBottom: 0 }}>
                          <Link to={`/collagedetailspage/${collage.id}`} style={{ textDecoration: "none" }} >
                            <Typography variant="h6" sx={{ textAlign: "center", color: "#f0f0f0", fontFamily: "'TanPearl',sans-serif", '&:hover': { textDecoration: 'underline', cursor: 'pointer' }}}>
                              {collage.name}
                            </Typography>
                          </Link>
                        </CardContent>

                        <CardActions sx={{ justifyContent: "center", padding: '8px 0 16px 0', gap: '8px' }}>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeCollage(collage);
                          }}
                          sx={{ color: likedCollages.some((likedCollage) => likedCollage.id === collage.id) ? "#FF5757" : "#f0f0f0" }}>
                          <Favorite />
                        </IconButton>

                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddCollageToLibrary(collage);
                            }}
                            sx={{ color: "#f0f0f0" }}>
                            <Bookmark />
                          </IconButton>

                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollageToReport(collage);
                              setReportCollageOpen(true);
                            }} 
                            sx={{ color: "#f0f0f0" }}>
                            <Report />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}
        
        {showImageCard && currentImage && (
          <ImageCard image={currentImage} onClose={() => setShowImageCard(false)} onLike={() => handleLikeImage(currentImage)} onBookmark={() => handleAddToLibrary(currentImage)} onReport={handleReportImage} isLiked={likedImages.some((likedImage) => likedImage.id === currentImage.id)} likesCount={currentImage.likes || 0} />
        )}

        {showBoardModal && (
          <Modal open={showBoardModal} onClose={() => setShowBoardModal(false)} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box sx={{ backgroundColor: '#214224', borderRadius: '8px', padding: '24px', width: '400px', maxWidth: '90%', position: 'relative', color: '#f0f0f0', fontFamily: "'TanPearl', sans-serif" }}>
              <IconButton sx={{ position: 'absolute', top: '8px', right: '8px', color: '#f0f0f0', '&:hover': { backgroundColor: 'rgba(240, 240, 240, 0.1)' }}} onClick={() => setShowBoardModal(false)}>
                <Close />
              </IconButton>

              <Typography variant="h6" sx={{ color: '#f0f0f0', marginBottom: '16px', fontFamily: "'TanPearl', sans-serif", fontWeight: 'bold' }}>
                Select or Create a Board
              </Typography>

              <TextField fullWidth placeholder="New Board Name" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} sx={{ marginBottom: '16px', '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#f0f0f0' }, '&:hover fieldset': { borderColor: '#f0f0f0' }, '&.Mui-focused fieldset': { borderColor: '#f0f0f0' }}, '& .MuiInputBase-input': { color: '#f0f0f0', fontFamily: "'TanPearl', sans-serif" }}} />
              <Button fullWidth variant="contained" onClick={handleCreateBoard} sx={{ backgroundColor: '#f0f0f0', color: '#214224', fontFamily: "'TanPearl', sans-serif", textTransform: 'none', padding: '8px 16px', borderRadius: '4px', '&:hover': { backgroundColor: '#e0e0e0', color: '#214224', border: '1px solid #214224' }}}>
                Create Board
              </Button>

              <Typography variant="subtitle1" sx={{ color: '#f0f0f0', marginTop: '16px', marginBottom: '8px', fontFamily: "'TanPearl', sans-serif", fontWeight: 'bold' }}>
                Existing Boards
              </Typography>

              <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                {boards.map((board) => (
                  <Button fullWidth key={board.id} onClick={() => handleAddToSelectedBoard(board)} sx={{ color: '#f0f0f0', backgroundColor: '#214224', border: '1px solid #f0f0f0', borderRadius: '40px', marginBottom: '8px', textTransform: 'none', fontFamily: "'TanPearl', sans-serif", padding: '8px 16px', '&:hover': { backgroundColor: '#f0f0f0', color: '#214224', border: '1px solid #214224' }}}>
                    {board.name}
                  </Button> 
                ))}
              </Box>
            </Box>
          </Modal>
        )}

        <ReportDialog open={reportCollageOpen} onClose={() => setReportCollageOpen(false)} onReport={handleReportCollage} content={collageToReport ? { ...collageToReport, isCollage: true } : null} />

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%', backgroundColor: snackbarSeverity === 'error' ? '#FFEBEE' : '#E8F5E9', color: snackbarSeverity === 'error' ? '#C62828' : '#2E7D32', '& .MuiAlert-icon': { color: snackbarSeverity === 'error' ? '#C62828' : '#2E7D32' }, boxShadow: '0px 3px 5px rgba(0,0,0,0.2)' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
        <div style={{ padding: '20px' }}></div>
      </Container>
    </div>
  );
};

const styles = {
  tabButton: { 
    padding: "10px 20px", 
    border: "none", 
    cursor: "pointer",
    fontFamily: "TanPearl, sans-serif",
    alignItems: "center",
    borderRadius: "5px",
    transition: "all 0.3s ease"
  },
  imageGallery: {
    padding: '16px',
  },
  imageContainer: {
    position: 'relative',
    cursor: 'pointer',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
  },
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    }
  },
  overlay: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    display: 'flex',
    alignItems: 'center',
  },
  noCollagesMessage: {
    textAlign: 'center',
    color: '#214224',
    fontFamily: 'TanPearl, sans-serif',
    marginTop: '20px',
  }
};

export default HomePage;