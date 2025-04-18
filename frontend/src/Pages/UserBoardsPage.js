import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, TextField, Snackbar, IconButton } from "@mui/material";
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
      } 
      catch (error) {
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
    } 
    catch (error) {
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
    } 
    catch (error) {
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