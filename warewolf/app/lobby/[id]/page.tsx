"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { subscribeToRoom, getCurrentUser, startGame, resetGame } from "./../../lib/gameService";

export default function LobbyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [roomData, setRoomData] = useState<any>(null);
  const currentUser = getCurrentUser();

  // Config สำหรับสร้างห้อง
  const [config, setConfig] = useState({ werewolf: 1, seer: 1, villager: 1 });

  useEffect(() => {
    if (!currentUser) { router.push("/"); return; }

    const unsubscribe = subscribeToRoom(id as string, (data) => {
      if (data) setRoomData(data);
      else { alert("ไม่พบห้องนี้!"); router.push("/"); }
    });

    return () => unsubscribe();
  }, [id, router, currentUser]);

  if (!roomData) return <div className="text-white text-center mt-10">กำลังโหลด...</div>;

  const players = Object.values(roomData.players || {});
  const myData: any = roomData.players[currentUser?.uid || ""];
  const isHost = myData?.isHost;

  // --- LOGIC สลับหน้าจอ ---
  if (roomData.status === 'playing') {
    return <GameView myRole={myData.role} isHost={isHost} roomId={id as string} />;
  }

  // --- LOGIC หน้า LOBBY (เหมือนเดิม) ---
  const totalCards = config.werewolf + config.seer + config.villager;
  const isReadyToStart = totalCards === players.length && players.length > 0;

  const updateConfig = (role: string, value: number) => {
    if (value < 0) return;
    setConfig(prev => ({ ...prev, [role]: value }));
  }

  const handleStartGame = async () => {
    if (!isReadyToStart) return alert("จำนวนการ์ดไม่เท่ากับจำนวนคน!");
    try { await startGame(id as string, roomData.players, config); } 
    catch (e: any) { alert(e.message); }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 pb-20">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-gray-400">ROOM ID</p>
          <h1 className="text-5xl font-bold tracking-widest text-red-500 mb-2">{id}</h1>
          <div className="inline-block bg-zinc-800 px-3 py-1 rounded text-sm text-green-400">Waiting for players...</div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-4 border-b border-zinc-700 pb-2">ผู้เล่น ({players.length} คน)</h2>
          <div className="space-y-2">
            {players.map((p: any, index) => (
              <div key={index} className="flex justify-between bg-zinc-700 p-3 rounded">
                <span>{p.name}</span>
                {p.isHost && <span className="text-xs bg-yellow-600 px-2 py-1 rounded text-black font-bold">HOST</span>}
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <div className="space-y-4">
             <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                <h3 className="text-center font-bold mb-4 text-gray-300">ตั้งค่าจำนวนการ์ด</h3>
                {['werewolf', 'seer', 'villager'].map(role => (
                    <div key={role} className="flex justify-between items-center mb-2">
                        <span className="capitalize font-bold text-gray-300">{role}</span>
                        <div className="flex items-center gap-3">
                            <button onClick={() => updateConfig(role, (config as any)[role] - 1)} className="w-8 h-8 bg-zinc-700 rounded hover:bg-zinc-600">-</button>
                            <span className="w-4 text-center">{(config as any)[role]}</span>
                            <button onClick={() => updateConfig(role, (config as any)[role] + 1)} className="w-8 h-8 bg-zinc-700 rounded hover:bg-zinc-600">+</button>
                        </div>
                    </div>
                ))}
                <div className={`text-center text-sm mt-4 py-1 rounded ${isReadyToStart ? 'text-green-400' : 'text-red-400'}`}>
                    การ์ด {totalCards} ใบ / ผู้เล่น {players.length} คน
                </div>
             </div>
             <button onClick={handleStartGame} disabled={!isReadyToStart} 
                className={`w-full py-4 rounded-lg font-bold text-xl shadow-lg transition-all ${isReadyToStart ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-zinc-700 text-zinc-500'}`}>
                START GAME 🐺
             </button>
          </div>
        ) : (
          <div className="text-center text-gray-400 animate-pulse mt-10">รอหัวหน้าห้องเริ่มเกม...</div>
        )}
      </div>
    </div>
  );
}

// --- COMPONENT หน้าเล่นเกม (Game View) ---
function GameView({ myRole, isHost, roomId }: { myRole: string, isHost: boolean, roomId: string }) {
  const [isRevealed, setIsRevealed] = useState(false);

  // ข้อมูล Role และรูปภาพ (Emoji)
  const roleDetails: any = {
    werewolf: { name: "Werewolf", icon: "🐺", color: "text-red-500", desc: "กินชาวบ้านตอนกลางคืน!" },
    seer: { name: "Seer", icon: "🔮", color: "text-purple-400", desc: "ดูบทบาทคนอื่นได้คืนละคน" },
    villager: { name: "Villager", icon: "👨‍🌾", color: "text-green-400", desc: "ช่วยกันจับหมาป่าให้ได้" },
  };

  const role = roleDetails[myRole] || { name: "Unknown", icon: "❓", color: "text-gray-400", desc: "..." };

  const handleReset = async () => {
    if (confirm("ต้องการจบเกมรอบนี้ใช่ไหม?")) {
      await resetGame(roomId);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white relative">
      {/* Header */}
      <div className="absolute top-6 left-0 right-0 text-center">
         <h1 className="text-2xl font-bold text-gray-500">ROLE CARD</h1>
         <p className="text-xs text-gray-600">กดค้างที่การ์ดเพื่อดูบทบาท</p>
      </div>

      {/* The Card */}
      <div 
        className="w-full max-w-xs aspect-[3/4] cursor-pointer perspective-1000 select-none touch-none"
        onMouseDown={() => setIsRevealed(true)}
        onMouseUp={() => setIsRevealed(false)}
        onMouseLeave={() => setIsRevealed(false)}
        onTouchStart={() => setIsRevealed(true)}
        onTouchEnd={() => setIsRevealed(false)}
      >
        <div className={`relative w-full h-full duration-500 transition-all transform ${isRevealed ? "" : "rotate-y-180"}`}>
            
            {/* Front (ด้านหน้า - แสดง Role) */}
            {isRevealed ? (
                <div className="absolute inset-0 bg-zinc-800 rounded-xl border-4 border-white flex flex-col items-center justify-center p-4 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    <div className="text-9xl mb-4 animate-bounce">{role.icon}</div>
                    <h2 className={`text-4xl font-bold uppercase mb-2 ${role.color}`}>{role.name}</h2>
                    <p className="text-center text-gray-300">{role.desc}</p>
                </div>
            ) : (
            /* Back (ด้านหลัง - ลายปก) */
                <div className="absolute inset-0 bg-gradient-to-br from-red-900 to-black rounded-xl border-4 border-zinc-700 flex items-center justify-center shadow-2xl">
                     <div className="text-center opacity-50">
                        <span className="text-6xl">🐺</span>
                        <p className="font-bold tracking-widest mt-2">TAP & HOLD</p>
                     </div>
                </div>
            )}

        </div>
      </div>

      {/* Footer / Reset Button */}
      <div className="absolute bottom-10 w-full max-w-md px-6">
        {isHost && (
            <button 
                onClick={handleReset}
                className="w-full bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 text-gray-300 py-3 rounded-lg font-bold"
            >
                🔄 จบเกม / เริ่มรอบใหม่
            </button>
        )}
        <p className="text-center text-gray-600 text-xs mt-4">ห้ามแอบดูจอเพื่อนนะจ๊ะ</p>
      </div>
    </div>
  );
}