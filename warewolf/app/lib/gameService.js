import { auth, db } from "./firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { ref, set, push, onValue, update, get, child } from "firebase/database";

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

const generateRoomId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createRoom = async (playerName) => {
  const user = auth.currentUser;
  if (!user) throw new Error("ต้องล็อกอินก่อนสร้างห้อง");

  const roomId = generateRoomId();
  const roomRef = ref(db, `rooms/${roomId}`);

  // เตรียมข้อมูลห้องเริ่มต้น
  const initialRoomData = {
    status: "waiting", // สถานะ: รอคนครบ
    createdAt: Date.now(),
    players: {
      [user.uid]: {
        name: playerName,
        isHost: true,    // คนสร้างคือ Host
        role: "unknown", // ยังไม่ได้แจกบท
        ready: true
      }
    },
    config: {
        werewolf: 1, // ค่าเริ่มต้น
        seer: 1,
        villager: 1
    }
  };

  // บันทึกลง Firebase
  await set(roomRef, initialRoomData);
  
  return roomId; // ส่งเลขห้องกลับไปให้หน้าเว็บ
};