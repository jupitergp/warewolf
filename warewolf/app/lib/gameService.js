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

// ฟังก์ชันดักฟังข้อมูลห้อง (Real-time Listener)
export const subscribeToRoom = (roomId, callback) => {
  const safeRoomId = roomId.toUpperCase();
  const roomRef = ref(db, `rooms/${safeRoomId}`);

  // onValue จะทำงานทุกครั้งที่ข้อมูลใน Database เปลี่ยน
  const unsubscribe = onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    callback(data); // ส่งข้อมูลล่าสุดกลับไปให้หน้าเว็บ
  });

  // ส่ง function สำหรับยกเลิกการดักฟังกลับไป (เผื่อคนปิดหน้าเว็บ)
  return unsubscribe;
};

// ฟังก์ชันเริ่มเกม (Host only)
export const startGame = async (roomId, playersData, config) => {
  // playersData คือ object ของผู้เล่นทั้งหมดในห้อง
  // config คือจำนวน role เช่น { werewolf: 2, seer: 1, villager: 3 }

  const playerIds = Object.keys(playersData);
  const totalPlayers = playerIds.length;
  
  // 1. สร้างกองไพ่ (Deck Construction)
  let deck = [];
  deck.push(...Array(config.werewolf).fill("werewolf"));
  deck.push(...Array(config.seer).fill("seer"));
  deck.push(...Array(config.villager).fill("villager"));
  // (ถ้ามี role อื่นเพิ่ม ก็มาเพิ่มบรรทัดตรงนี้)

  // Validation: เช็คว่าการ์ดครบคนไหม
  if (deck.length !== totalPlayers) {
    throw new Error(`จำนวนคน (${totalPlayers}) ไม่เท่ากับจำนวนการ์ด (${deck.length})`);
  }

  // 2. สับไพ่ (Fisher-Yates Shuffle Algorithm)
  // นี่คือสูตรสลับตำแหน่ง array ที่ได้มาตรฐานโลก
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // 3. แจกไพ่ (เตรียมข้อมูล Update)
  const updates = {};
  
  // เปลี่ยนสถานะห้องเป็น playing
  updates[`rooms/${roomId}/status`] = "playing";

  // วนลูปยัด role ให้แต่ละคน
  playerIds.forEach((uid, index) => {
    updates[`rooms/${roomId}/players/${uid}/role`] = deck[index];
  });

  // ยิงขึ้น Firebase ทีเดียว (Atomic Update)
  await update(ref(db), updates);
};