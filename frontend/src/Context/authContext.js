import React, { createContext, useContext, useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail,
  updateEmail, updatePassword, deleteUser } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } 
    catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } 
    catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } 
    catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } 
    catch (error) {
      throw error;
    }
  };

  const updateUserEmail = async (email) => {
    try {
      await updateEmail(currentUser, email);
    } 
    catch (error) {
      throw error;
    }
  };

  const updateUserPassword = async (password) => {
    try {
      await updatePassword(currentUser, password);
    } 
    catch (error) {
      throw error
    }
  };

  const deleteUserAccount = async () => {
    try {
      await deleteUser(currentUser);
    } 
    catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, signup, login, logout, resetPassword, updateUserEmail, updateUserPassword, deleteUserAccount };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}