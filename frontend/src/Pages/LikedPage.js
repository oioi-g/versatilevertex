// import React, { useEffect, useState } from "react";
// import { db } from "../firebase";
// import { collection, query, onSnapshot, deleteDoc, doc } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faHeart } from "@fortawesome/free-solid-svg-icons";

// const LikedImagesPage = () => {
//   const [likedImages, setLikedImages] = useState([]);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const user = getAuth().currentUser;
//     if (!user) {
//       setError("No user found. Please log in.");
//       return;
//     }

//     const imagesQuery = query(
//       collection(db, "user", user.uid, "liked_images")
//     );

//     const unsubscribe = onSnapshot(imagesQuery, (querySnapshot) => {
//       const images = [];
//       querySnapshot.forEach((doc) => {
//         const data = doc.data();
//         images.push({
//           id: doc.id,
//           imageUrl: data.imageUrl,
//           description: data.description
//         });
//       });
//       setLikedImages(images);
//     }, (err) => {
//       console.error(err);
//       setError("Failed to fetch liked images.");
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleUnlikeImage = async (imageId) => {
//     const user = getAuth().currentUser;
//     if (!user) {
//       setError("No user found. Please log in.");
//       return;
//     }
//     try {
//       await deleteDoc(doc(db, "user", user.uid, "liked_images", imageId));
//       setLikedImages((prevImages) => prevImages.filter((image) => image.id !== imageId));
//     }
//     catch (err) {
//       console.error(err);
//       setError("Failed to unlike image.");
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <h1 style={styles.title}>Liked Images</h1>

//       {error && <p style={styles.error}>{error}</p>}

//       <div style={styles.imageGallery}>
//         {likedImages.length > 0 ? (
//           likedImages.map((image, index) => (
//             <div key={index} style={styles.imageContainer}>
//               <img
//               src={image.imageUrl}
//               alt={image.description}
//               style={styles.image} />
//               <div style={styles.overlay}>
//                 <FontAwesomeIcon
//                   icon={faHeart}
//                   style={styles.heartIcon}
//                   onClick={() => handleUnlikeImage(image.id)}
//                 />
//               </div>
//             </div>
//           ))
//         ) : (
//           <p style={styles.noImages}>You haven't liked any images yet!</p>
//         )}
//       </div>
//     </div>
//   );
// };

// const styles = {
//   container: {
//     textAlign: "center",
//     padding: "20px",
//     backgroundColor: "#FDEFE4"
//   },
//   title: {
//     fontSize: "20px",
//     fontWeight: "bold",
//     marginBottom: "20px"
//   },
//   imageGallery: {
//     display: "grid",
//     gridTemplateColumns: "repeat(4, 1fr)",
//     gap: "16px",
//     alignItems: "start",
//     marginTop: "20px",
//   },
//   imageContainer: {
//     position: "relative",
//     borderRadius: "8px",
//     overflow: "hidden",
//     boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
//   },
//   image: {
//     width: "100%",
//     height: "100%",
//     objectFit: "cover",
//     display: "block",
//   },
//   overlay: {
//     position: "absolute",
//     top: "0",
//     right: "0",
//     padding: "10px",
//     background: "rgba(0, 0, 0, 0.6)",
//     borderBottomLeftRadius: "8px",
//     borderTopRightRadius: "8px",
//   },
//   heartIcon: {
//     fontSize: "24px",
//     color: "red",
//     cursor: "pointer",
//   },
//   error: {
//     color: "red",
//     textAlign: "center"
//   },
//   noImages: {
//     textAlign: "center",
//     fontSize: "16px",
//     color: "#555"
//   }
// };

// export default LikedImagesPage;

import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Box, Grid, Typography, IconButton, Card, CardMedia, Snackbar, Alert } from "@mui/material";
import { Favorite } from "@mui/icons-material";

const LikedPage = () => {
  const [likedImages, setLikedImages] = useState([]);
  const [likedCollages, setLikedCollages] = useState([]);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) {
      setError("No user found. Please log in.");
      return;
    }
    const imagesQuery = query(collection(db, "user", user.uid, "liked_images"));
    const collagesQuery = query(collection(db, "user", user.uid, "liked_collages"));
    
    const unsubscribeImages = onSnapshot(imagesQuery, (querySnapshot) => {
      const images = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        images.push({
          id: doc.id,
          imageUrl: data.imageUrl,
          description: data.description,
        });
      });
      setLikedImages(images);
    }, (err) => {
      console.error(err);
      setError("Failed to fetch liked images.");
    });
    const unsubscribeCollages = onSnapshot(collagesQuery, (querySnapshot) => {
      const collages = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        collages.push({
          id: doc.id,
          name: data.name,
          thumbnail: data.collage[0]?.imageUrl || "",
        });
      });
      setLikedCollages(collages);
    }, (err) => {
      console.error(err);
      setError("Failed to fetch liked collages.");
    });
    return () => {
      unsubscribeImages();
      unsubscribeCollages();
    };
  }, []);

  const handleUnlikeImage = async (imageId) => {
    const user = getAuth().currentUser;
    if (!user) {
      setError("No user found. Please log in.");
      return;
    }
    try {
      await deleteDoc(doc(db, "user", user.uid, "liked_images", imageId));
      setLikedImages((prevImages) => prevImages.filter((image) => image.id !== imageId));
      setSnackbarMessage("Image unliked successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } 
    catch (err) {
      console.error(err);
      setError("Failed to unlike image.");
      setSnackbarMessage("Failed to unlike image.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleUnlikeCollage = async (collageId) => {
    const user = getAuth().currentUser;
    if (!user) {
      setError("No user found. Please log in.");
      return;
    }
    try {
      await deleteDoc(doc(db, "user", user.uid, "liked_collages", collageId));
      setLikedCollages((prevCollages) => prevCollages.filter((collage) => collage.id !== collageId));
      setSnackbarMessage("Collage unliked successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } 
    catch (err) {
      console.error(err);
      setError("Failed to unlike collage.");
      setSnackbarMessage("Failed to unlike collage.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ backgroundColor: "#f0f0f0", minHeight: "100vh", padding: "20px" }}>
      <Typography variant="h6" sx={{ color: "#214224", textAlign: "center", marginBottom: "20px", fontFamily: "'TanPearl', sans-serif" }}>
        Liked Images
      </Typography>

      {error && (
        <Typography sx={{ color: "#ff5757", textAlign: "center" }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={2} sx={{ padding: "16px" }}>
        {likedImages.map((image) => (
          <Grid item key={image.id} xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ position: "relative", borderRadius: "8px", overflow: "hidden", boxShadow: 3 }}>
              <CardMedia component="img" src={image.imageUrl} alt={image.description} sx={{ width: "100%", height: "200px", objectFit: "cover" }} />
              <Box sx={{ position: "absolute", bottom: "10px", right: "10px", display: "flex", alignItems: "center" }}>
                <IconButton onClick={() => handleUnlikeImage(image.id)} sx={{ color: "#FF5757" }} >
                  <Favorite />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" sx={{ color: "#214224", textAlign: "center", marginTop: "40px", marginBottom: "20px", fontFamily: "'TanPearl', sans-serif" }}>
        Liked Collages
      </Typography>

      <Grid container spacing={2} sx={{ padding: "16px" }}>
        {likedCollages.map((collage) => (
          <Grid item key={collage.id} xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ borderRadius: "8px", boxShadow: 3, backgroundColor: "#214224", height: "300px", width: "100%" }}>
              {collage.thumbnail && (
                <Box sx={{ padding: 2 }}>
                  <img src={collage.thumbnail} alt="Collage Thumbnail" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: 8 }} />
                </Box>
              )}
              
              <Box sx={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                <Typography variant="h6" sx={{ textAlign: "center", color: "#f0f0f0", fontFamily: "'TanPearl', sans-serif", marginTop: "10px" }}>
                  {collage.name}
                </Typography>

                <IconButton onClick={() => handleUnlikeCollage(collage.id)} sx={{ color: "#FF5757" }} >
                  <Favorite />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%", backgroundColor: "#f0f0f0", color: "#214224", "& .MuiAlert-icon": { color: "#214224" }, "& .MuiAlert-message": { color: "#214224" } }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LikedPage;