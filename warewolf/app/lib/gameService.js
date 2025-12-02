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

//  ฟังก์ชันเข้าร่วมห้อง
export const joinRoom = async (roomId, playerName) => {
  const user = auth.currentUser;
  if (!user) throw new Error("ต้องล็อกอินก่อน");

  // แปลงรหัสห้องเป็นตัวพิมพ์ใหญ่เสมอ (กันคนพิมพ์ผิด)
  const safeRoomId = roomId.toUpperCase(); 

  // เช็คก่อนว่ามีห้องนี้จริงไหม
  const roomRef = ref(db, `rooms/${safeRoomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error("ไม่พบห้องนี้ครับ เช็ครหัสอีกทีนะ");
  }

  // ถ้าห้องมีอยู่จริง ให้เพิ่มชื่อเราเข้าไป
  const updates = {};
  updates[`rooms/${safeRoomId}/players/${user.uid}`] = {
    name: playerName,
    isHost: false,    // คน join ไม่ใช่ host
    role: "unknown",
    ready: true
  };

  // ใช้ update แทน set เพื่อไม่ให้ไปทับข้อมูลคนอื่นที่อยู่ในห้อง
  await update(ref(db), updates);

  return safeRoomId;
};