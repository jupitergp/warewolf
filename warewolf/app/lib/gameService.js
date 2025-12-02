import { auth, db } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { ref, set, push, onValue, update } from "firebase/database";

export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth);
    console.log("Logged in as:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onUserChanged = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

