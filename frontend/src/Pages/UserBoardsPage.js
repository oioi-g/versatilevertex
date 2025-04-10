// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { doc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
// import { auth, db } from "../firebase";

// const UserBoardsPage = () => {
//   const [boards, setBoards] = useState([]);
//   const [error, setError] = useState(null);
//   const [editingBoardId, setEditingBoardId] = useState(null);
//   const [newBoardName, setNewBoardName] = useState("");
//   const [newBoardDescription, setNewBoardDescription] = useState("");

//   useEffect(() => {
//     const fetchBoards = async () => {
//       try {
//         const user = auth.currentUser;
//         if (!user) {
//           setError("You need to be logged in to view your boards.");
//           return;
//         }

//         const userRef = doc(db, "user", user.uid);
//         const boardsRef = collection(userRef, "boards");
//         const querySnapshot = await getDocs(boardsRef);

//         const boardsData = [];
//         querySnapshot.forEach((doc) => {
//           boardsData.push({
//             id: doc.id,
//             ...doc.data(),
//           });
//         });
//         setBoards(boardsData);
//       }
//       catch (error) {
//         console.error(error);
//         setError("Failed to fetch your boards. Please try again later.");
//       }
//     };
//     fetchBoards();
//   }, []);

//   const handleDeleteBoard = async (boardId) => {
//     try {
//       const user = auth.currentUser;
//       if (!user) {
//         setError("You need to be logged in to delete boards.");
//         return;
//       }

//       const boardRef = doc(db, "user", user.uid, "boards", boardId);
//       await deleteDoc(boardRef);

//       setBoards((prevBoards) => prevBoards.filter((board) => board.id !== boardId));
//     } catch (error) {
//       console.error(error);
//       setError("Failed to delete the board. Please try again later.");
//     }
//   };

//   const handleUpdateBoard = async (boardId) => {
//     try {
//       const user = auth.currentUser;
//       if (!user) {
//         setError("You need to be logged in to update boards.");
//         return;
//       }

//       const updates = {};
//       if (newBoardName) updates.name = newBoardName;
//       if (newBoardDescription) updates.description = newBoardDescription;

//       if (Object.keys(updates).length === 0) return;

//       const boardRef = doc(db, "user", user.uid, "boards", boardId);
//       await updateDoc(boardRef, updates);

//       setBoards((prevBoards) =>
//         prevBoards.map((board) =>
//           board.id === boardId ? { ...board, ...updates } : board
//         )
//       );
//       setEditingBoardId(null);
//       setNewBoardName("");
//       setNewBoardDescription("");
//     }
//     catch (error) {
//       console.error(error);
//       setError("Failed to update the board. Please try again later.");
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <h1 style={styles.title}>My Boards</h1>

//       {error && <p style={styles.errorMessage}>{error}</p>}

//       <div style={styles.boardGallery}>
//         {boards.length === 0 ? (
//           <p style={{ textAlign: "center" }}>No boards found. Create one to start!</p>
//         ) : (
//           boards.map((board) => (
//             <div key={board.id} style={styles.boardContainer}>
//               {editingBoardId === board.id ? (
//                 <div style={{ textAlign: "center" }}>
//                   <input type="text" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Enter new name" style={styles.input} />
//                   <input type="text" value={newBoardDescription} onChange={(e) => setNewBoardDescription(e.target.value)} placeholder="Enter new description" style={styles.input} />
//                   <button onClick={() => handleUpdateBoard(board.id)} style={styles.editButton}>Save</button>
//                   <div style={{ padding: "5px" }}>
//                     <button onClick={() => setEditingBoardId(null)} style={styles.editButton}>Cancel</button>
//                   </div>
//                 </div>
//               ) : (
//                 <>
//                   <Link to={`/userboardspage/${board.id}`} style={styles.boardTitle}>
//                     <h3 style={{ textAlign: "center" }}>{board.name}</h3>
//                   </Link>
//                   <p style={{ textAlign: "center" }}>{board.description}</p>
//                 </>
//               )}

//               <div style={styles.boardActions}>
//                 <button onClick={() => setEditingBoardId(board.id)} style={styles.editButton}>Edit</button>
//                 <div style={{padding: "5px"}}>
//                   <button onClick={() => handleDeleteBoard(board.id)} style={styles.deleteButton}>Delete</button>
//                 </div>
//               </div>
              
//               <div style={styles.pinGallery}>
//                 {board.pins && board.pins.length > 0 ? (
//                   <div style={styles.pinGallery}>
//                     <img src={board.pins[0].imageUrl} alt="Thumbnail" style={styles.pinImage} />
//                   </div>
//                 ) : (
//                   <p>No pins added yet.</p>
//                 )}
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//       <div style={{ padding: "40px" }}></div>
//     </div>
//   );
// };

// const styles = {
//   container: {
//     textAlign: "center",
//     padding: "20px",
//     backgroundColor: "#f0f0f0"
//   },
//   title: {
//     fontSize: "20px",
//     fontWeight: "bold",
//     marginBottom: "20px",
//     color: "#214224"
//   },
//   errorMessage: { 
//     color: "#ff5757", 
//     textAlign: "center" 
//   },
//   boardGallery: { 
//     display: "grid", 
//     gridTemplateColumns: "repeat(3, 1fr)", 
//     gap: "16px", 
//     marginTop: "20px" 
//   },
//   boardContainer: { 
//     padding: "10px", 
//     borderRadius: "8px", 
//     border: "1px solid #ccc", 
//     boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
//     backgroundColor: "#FFFFFF"
//   },
//   boardTitle: { 
//     textAlign: "center", 
//     textDecoration: "none", 
//     color: "#214224", 
//     fontSize: "18px", 
//     fontWeight: "bold" 
//   },
//   boardDescription: { 
//     textAlign: "center" 
//   },
//   boardActions: { 
//     textAlign: "center", 
//     marginTop: "10px" 
//   },
//   pinGallery: { 
//     gap: "8px",
//     marginTop: "10px",
//     justtifyContent: "center",
//     alignItems: "center"
//   },
//   pinContainer: { 
//     border: "1px solid #ccc", 
//     borderRadius: "8px", 
//     padding: "8px", 
//     textAlign: "center",
//     backgroundColor: "#214224"
//   },
//   pinImage: { 
//     width: "150px", 
//     height: "150px", 
//     objectFit: "cover", 
//     borderRadius: "8px", 
//     marginBottom: "8px"
//   },
//   input: {
//     width: '100%',
//     padding: '8px',
//     border: '1px solid #214224',
//     borderRadius: '4px'
//   },
//   editButton: { 
//     backgroundColor: "#214224", 
//     color: "#f0f0f0", 
//     padding: "8px 16px", 
//     border: "none", 
//     borderRadius: "5px", 
//     cursor: "pointer", 
//     fontSize: "14px" 
//   },
//   deleteButton: { 
//     backgroundColor: "#FF5757", 
//     color: "#f0f0f0", 
//     padding: "8px 16px", 
//     border: "none", 
//     borderRadius: "5px", 
//     cursor: "pointer", 
//     fontSize: "14px" 
//   },
//   switch: { 
//     position: "relative", 
//     height: "1.5rem", 
//     width: "3rem", 
//     cursor: "pointer", 
//     appearance: "none", 
//     borderRadius: "9999px", 
//     backgroundColor: "#214224", 
//     transition: "all .3s ease"
//   },
//   switchChecked: { 
//     backgroundColor: "#214224" 
//   },
//   switchBefore: { 
//     position: "absolute", 
//     content: "\"\"",
//     left: "calc(1.5rem - 1.6rem)", 
//     top: "calc(1.5rem - 1.6rem)", 
//     display: "block", 
//     height: "1.6rem", 
//     width: "1.6rem", 
//     cursor: "pointer", 
//     borderRadius: "9999px", 
//     backgroundColor: "#f0f0f0"
//   }
// };

// export default UserBoardsPage;

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Snackbar,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const UserBoardsPage = () => {
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState(null);
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("You need to be logged in to view your boards.");
          return;
        }

        const userRef = doc(db, "user", user.uid);
        const boardsRef = collection(userRef, "boards");
        const querySnapshot = await getDocs(boardsRef);

        const boardsData = [];
        querySnapshot.forEach((doc) => {
          boardsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setBoards(boardsData);
      } catch (error) {
        console.error(error);
        setError("Failed to fetch your boards. Please try again later.");
        setSnackbarOpen(true);
      }
    };
    fetchBoards();
  }, []);

  const handleDeleteBoard = async (boardId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You need to be logged in to delete boards.");
        setSnackbarOpen(true);
        return;
      }

      const boardRef = doc(db, "user", user.uid, "boards", boardId);
      await deleteDoc(boardRef);

      setBoards((prevBoards) => prevBoards.filter((board) => board.id !== boardId));
    } catch (error) {
      console.error(error);
      setError("Failed to delete the board. Please try again later.");
      setSnackbarOpen(true);
    }
  };

  const handleUpdateBoard = async (boardId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You need to be logged in to update boards.");
        setSnackbarOpen(true);
        return;
      }

      const updates = {};
      if (newBoardName) updates.name = newBoardName;
      if (newBoardDescription) updates.description = newBoardDescription;

      if (Object.keys(updates).length === 0) return;

      const boardRef = doc(db, "user", user.uid, "boards", boardId);
      await updateDoc(boardRef, updates);

      setBoards((prevBoards) =>
        prevBoards.map((board) =>
          board.id === boardId ? { ...board, ...updates } : board
        )
      );
      setEditingBoardId(null);
      setNewBoardName("");
      setNewBoardDescription("");
    } catch (error) {
      console.error(error);
      setError("Failed to update the board. Please try again later.");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: "#f0f0f0" }}>

      {error && (
        <Snackbar
          open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} message={error} action={
            <IconButton size="small" color="inherit" onClick={handleCloseSnackbar}>
              <CloseIcon fontSize="small" />
            </IconButton>
          } />
        )}

      <Grid container spacing={3}>
        {boards.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: "center", width: "100%", fontFamily: "'TanPearl', sans-serif" }}>
            No boards found. Create one to start!
          </Typography>
        ) : (
          boards.map((board) => (
            <Grid item key={board.id} xs={12} sm={6} md={4}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: "#214224" }}>
                <CardContent>
                  {editingBoardId === board.id ? (
                    <Box sx={{ textAlign: "center" }}>
                      <TextField fullWidth value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Enter new name" sx={{ marginBottom: '16px', '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#f0f0f0', }, '&:hover fieldset': { borderColor: '#f0f0f0', }, '&.Mui-focused fieldset': { borderColor: '#f0f0f0' }}, '& .MuiInputBase-input': { color: '#f0f0f0', fontFamily: "'TanPearl', sans-serif" }}} />
                      <TextField fullWidth value={newBoardDescription} onChange={(e) => setNewBoardDescription(e.target.value)} placeholder="Enter new description" sx={{ marginBottom: '16px', '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#f0f0f0', }, '&:hover fieldset': { borderColor: '#f0f0f0', }, '&.Mui-focused fieldset': { borderColor: '#f0f0f0' }}, '& .MuiInputBase-input': { color: '#f0f0f0', fontFamily: "'TanPearl', sans-serif" }}} />
                      <Button variant="contained" onClick={() => handleUpdateBoard(board.id)} sx={{ marginRight: 1, backgroundColor: "#f0f0f0", color: "#214224", fontFamily: "'TanPearl',sans-serif" }} >
                        Save
                      </Button>
                      <Button variant="outlined" onClick={() => setEditingBoardId(null)} sx={{ color: "#f0f0f0", borderColor: "#f0f0f0", fontFamily: "'TanPearl',sans-serif" }} >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Link to={`/userboardspage/${board.id}`} style={{ textDecoration: "none" }}>
                        <Typography variant="h6" sx={{ textAlign: "center", color: "#f0f0f0", fontFamily: "'TanPearl',sans-serif" }}>
                          {board.name}
                        </Typography>
                      </Link>
                      <Typography variant="body2" sx={{ textAlign: "center", fontFamily: "'TanPearl',sans-serif", color: "#f0f0f0" }}>
                        {board.description}
                      </Typography>
                    </>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: "center" }}>
                  <Button variant="contained" onClick={() => setEditingBoardId(board.id)} sx={{ backgroundColor: "#f0f0f0", fontFamily: "'TanPearl',sans-serif", color: "#214224" }} >
                    Edit
                  </Button>
                  <Button variant="contained" onClick={() => handleDeleteBoard(board.id)} sx={{ backgroundColor: "#FF5757", marginLeft: 1, fontFamily: "'TanPearl',sans-serif" }} >
                    Delete
                  </Button>
                </CardActions>

                <Box sx={{ padding: 2 }}>
                  {board.pins && board.pins.length > 0 ? (
                    <img src={board.pins[0].imageUrl} alt="Thumbnail" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    <Typography variant="body2" sx={{ textAlign: "center", fontFamily: "'TanPearl',sans-serif" }}>
                      No pins added yet.
                    </Typography>
                  )}
                </Box>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default UserBoardsPage;