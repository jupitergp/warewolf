import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; 
import { getAuth } from "firebase/auth";         

const firebaseConfig = {
  apiKey: "AIzaSyAckEgM5l9ZP-fUpsQcBJqimKkhjKsnPVw",
  authDomain: "warewolf-27b27.firebaseapp.com",
  databaseURL: "https://warewolf-27b27-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "warewolf-27b27",
  storageBucket: "warewolf-27b27.firebasestorage.app",
  messagingSenderId: "293676794050",
  appId: "1:293676794050:web:65887dcd4e891887a0bb5b",
  measurementId: "G-XQFH39C7VF"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);