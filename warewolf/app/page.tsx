"use client";

import { useEffect, useState } from "react";
import { loginAnonymously, onUserChanged, createRoom } from "./lib/gameService";
import { useRouter } from "next/navigation"; // ใช้สำหรับเปลี่ยนหน้า

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState(""); // เก็บชื่อผู้เล่น
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ตัวเปลี่ยนหน้า

  // Auth Logic (เหมือนเดิม)
  useEffect(() => {
    loginAnonymously();
    const unsubscribe = onUserChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ฟังก์ชันเมื่อกดปุ่ม "สร้างห้อง"
  const handleCreateRoom = async () => {
    if (!name) return alert("กรุณาใส่ชื่อก่อน");
    
    try {
      const roomId = await createRoom(name);
      alert(`สร้างห้องสำเร็จ! รหัสห้องคือ: ${roomId}`);
      // เดี๋ยวเราจะให้มันเด้งไปหน้า Lobby ใน Phase ต่อไป
      // router.push(`/lobby/${roomId}`); 
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการสร้างห้อง");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-900 text-white">
      <h1 className="text-4xl font-bold mb-8 text-red-500">WAREWOLF MVP</h1>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <div className="w-full max-w-xs space-y-4">
          {/* ช่องกรอกชื่อ */}
          <div>
            <label className="block text-sm mb-1 text-gray-400">ชื่อของคุณ</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 focus:border-red-500 outline-none"
              placeholder="เช่น จอห์น วิค"
            />
          </div>

          {/* ปุ่มสร้างห้อง */}
          <button
            onClick={handleCreateRoom}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold transition"
          >
            สร้างห้องใหม่
          </button>
          
          <div className="text-center text-sm text-gray-500 my-2">- หรือ -</div>

          {/* ปุ่มจอยห้อง (ยังไม่มีฟังก์ชัน) */}
          <button
            disabled
            className="w-full bg-zinc-700 text-gray-400 py-3 rounded font-bold cursor-not-allowed"
          >
            เข้าร่วมห้อง (Coming Soon)
          </button>
        </div>
      )}
    </div>
  );
}