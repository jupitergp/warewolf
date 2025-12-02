// app/lobby/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { subscribeToRoom, getCurrentUser, startGame } from "./../../lib/gameService"; // ถอยหลัง 3 ชั้นเพื่อหา lib

export default function LobbyPage() {
  const { id } = useParams(); // ดึงรหัสห้องจาก URL
  const router = useRouter();
  const [roomData, setRoomData] = useState<any>(null);
  const currentUser = getCurrentUser();
  const [config, setConfig] = useState({
    werewolf: 1,
    seer: 1,
    villager: 1
  });

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
  const totalCards = config.werewolf + config.seer + config.villager;
  const totalPlayers = players.length;
  const isReadyToStart = totalCards === totalPlayers && totalPlayers > 0;

  const handleStartGame = async () => {
    if (!isReadyToStart) return alert("จำนวนการ์ดไม่เท่ากับจำนวนคนครับ!");
    try {
      await startGame(id as string, roomData.players, config);
      // ไม่ต้องสั่งเปลี่ยนหน้า เพราะพอ status ใน DB เปลี่ยนเป็น 'playing'
      // เดี๋ยวเราจะเขียน code ดักจับให้มันเปลี่ยนหน้าเองใน Phase หน้า
    } catch (error: any) {
      alert(error.message);
    }
  };

  // ฟังก์ชันปรับตัวเลข
  const updateConfig = (role: string, value: number) => {
      if (value < 0) return; // ห้ามติดลบ
      setConfig(prev => ({ ...prev, [role]: value }));
  }

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
          <div className="space-y-4">
             <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                <h3 className="text-center font-bold mb-4 text-gray-300">ตั้งค่าจำนวนการ์ด</h3>
                {/* ตัวปรับ Werewolf */}
                <div className="flex justify-between items-center mb-2">
                    <span className="text-red-500 font-bold">Werewolf 🐺</span>
                    <div className="flex items-center gap-3">
                        <button onClick={() => updateConfig('werewolf', config.werewolf - 1)} className="w-8 h-8 bg-zinc-700 rounded hover:bg-zinc-600">-</button>
                        <span className="w-4 text-center">{config.werewolf}</span>
                        <button onClick={() => updateConfig('werewolf', config.werewolf + 1)} className="w-8 h-8 bg-zinc-700 rounded hover:bg-zinc-600">+</button>
                    </div>
                </div>

                {/* ตัวปรับ Seer */}
                <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-400 font-bold">Seer 🔮</span>
                    <div className="flex items-center gap-3">
                        <button onClick={() => updateConfig('seer', config.seer - 1)} className="w-8 h-8 bg-zinc-700 rounded hover:bg-zinc-600">-</button>
                        <span className="w-4 text-center">{config.seer}</span>
                        <button onClick={() => updateConfig('seer', config.seer + 1)} className="w-8 h-8 bg-zinc-700 rounded hover:bg-zinc-600">+</button>
                    </div>
                </div>

                {/* ตัวปรับ Villager */}
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 font-bold">Villager 👨‍🌾</span>
                    <div className="flex items-center gap-3">
                        <button onClick={() => updateConfig('villager', config.villager - 1)} className="w-8 h-8 bg-zinc-700 rounded hover:bg-zinc-600">-</button>
                        <span className="w-4 text-center">{config.villager}</span>
                        <button onClick={() => updateConfig('villager', config.villager + 1)} className="w-8 h-8 bg-zinc-700 rounded hover:bg-zinc-600">+</button>
                    </div>
                </div>

                {/* สรุปยอด */}
                <div className={`text-center text-sm mt-4 py-1 rounded ${isReadyToStart ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    การ์ด {totalCards} ใบ / ผู้เล่น {totalPlayers} คน
                </div>

             </div>
             
             <button 
                  onClick={handleStartGame}
                  disabled={!isReadyToStart}
                  className={`w-full py-4 rounded-lg font-bold text-xl shadow-lg transition-all
                      ${isReadyToStart 
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/50' 
                          : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
              >
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