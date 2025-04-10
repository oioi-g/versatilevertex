import React, { createContext, useContext, useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail,
  updateEmail, updatePassword, deleteUser } from "firebase/auth";
import { auth } from "../firebase"; // Import your Firebase auth instance

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use the AuthContext
export function useAuth() {
  return useContext(AuthContext);
}

// AuthProvider component to wrap your app
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // Current authenticated user
  const [loading, setLoading] = useState(true); // Loading state for initial auth check

  // Sign up a new user
  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user; // Return the newly created user
    } catch (error) {
      throw error; // Throw error for handling in the component
    }
  };

  // Log in an existing user
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user; // Return the logged-in user
    } catch (error) {
      throw error; // Throw error for handling in the component
    }
  };

  // Log out the current user
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error; // Throw error for handling in the component
    }
  };

  // Reset the user's password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error; // Throw error for handling in the component
    }
  };

  // Update the user's email
  const updateUserEmail = async (email) => {
    try {
      await updateEmail(currentUser, email);
    } catch (error) {
      throw error; // Throw error for handling in the component
    }
  };

  // Update the user's password
  const updateUserPassword = async (password) => {
    try {
      await updatePassword(currentUser, password);
    } catch (error) {
      throw error; // Throw error for handling in the component
    }
  };

  // Delete the user's account
  const deleteUserAccount = async () => {
    try {
      await deleteUser(currentUser);
    } catch (error) {
      throw error; // Throw error for handling in the component
    }
  };

  // Listen for changes in the user's authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // Set the current user
      setLoading(false); // Set loading to false after the initial check
    });

    return unsubscribe; // Cleanup the listener on unmount
  }, []);

  // Value to provide to the context
  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    updateUserEmail,
    updateUserPassword,
    deleteUserAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Render children only after initial auth check */}
    </AuthContext.Provider>
  );
}