// app/lobby/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { subscribeToRoom, getCurrentUser } from "./../../lib/gameService"; // ถอยหลัง 3 ชั้นเพื่อหา lib

export default function LobbyPage() {
  const { id } = useParams(); // ดึงรหัสห้องจาก URL
  const router = useRouter();
  const [roomData, setRoomData] = useState<any>(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    // ถ้าไม่มี User (เช่น แอบเข้าผ่าน Link โดยไม่ login) ให้ดีดกลับหน้าแรก
    if (!currentUser) {
      router.push("/");
      return;
    }

    // เริ่มดักฟังข้อมูลห้อง
    // subscribeToRoom จะส่งตัว unsubscribe กลับมาให้เราใช้ตอนปิดหน้าเว็บ
    const unsubscribe = subscribeToRoom(id as string, (data) => {
      if (data) {
        setRoomData(data);
      } else {
        alert("ไม่พบห้องนี้!");
        router.push("/");
      }
    });

    // Cleanup: เลิกดักฟังเมื่อเปลี่ยนหน้า
    return () => unsubscribe();
  }, [id, router, currentUser]);

  if (!roomData) return <div className="text-white text-center mt-10">กำลังโหลดข้อมูลห้อง...</div>;

  const players = Object.values(roomData.players || {});
  const isHost = roomData.players[currentUser?.uid || ""]?.isHost;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-gray-400">ROOM ID</p>
          <h1 className="text-5xl font-bold tracking-widest text-red-500 mb-2">{id}</h1>
          <div className="inline-block bg-zinc-800 px-3 py-1 rounded text-sm">
            Status: <span className="text-green-400">{roomData.status}</span>
          </div>
        </div>

        {/* Player List */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-4 border-b border-zinc-700 pb-2">
            ผู้เล่น ({players.length} คน)
          </h2>
          <div className="space-y-2">
            {players.map((p: any, index) => (
              <div key={index} className="flex items-center justify-between bg-zinc-700 p-3 rounded">
                <span className="font-medium">{p.name}</span>
                {p.isHost && <span className="text-xs bg-yellow-600 px-2 py-1 rounded text-black font-bold">HOST</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Control Panel (เฉพาะ Host ถึงจะเห็น) */}
        {isHost ? (
          <div className="space-y-3">
             <div className="bg-zinc-800 p-4 rounded-lg mb-4">
                <p className="text-center text-gray-500 text-sm mb-2">Game Config (Coming Soon)</p>
                {/* เดี๋ยวมาใส่ปุ่มปรับจำนวนหมาป่าตรงนี้ */}
             </div>
             
             <button className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold text-xl shadow-lg shadow-red-900/50">
                START GAME 🐺
             </button>
          </div>
        ) : (
          <div className="text-center text-gray-400 animate-pulse">
            รอหัวหน้าห้องเริ่มเกม...
          </div>
        )}
      </div>
    </div>
  );
}