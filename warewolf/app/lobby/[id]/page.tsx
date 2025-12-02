// app/lobby/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { subscribeToRoom, getCurrentUser, startGame, resetGame } from "./../../lib/gameService";

// --- 1. ข้อมูลบทบาท (ย้ายมาไว้ข้างนอกเพื่อให้ใช้ร่วมกันได้) ---
const ROLE_DETAILS: any = {
  // ฝั่งชาวบ้าน
  villager: { name: "Villager (ชาวบ้าน)", icon: "👨‍🌾", color: "text-green-400", desc: "ไม่มีพลังพิเศษ ช่วยกันจับผิดหมาป่าให้ได้" },
  seer: { name: "Seer (ผู้หยั่งรู้)", icon: "🔮", color: "text-purple-400", desc: "ตื่นมาดูบทบาทคนอื่นได้คืนละ 1 คน" },
  bodyguard: { name: "Bodyguard (ผู้พิทักษ์)", icon: "🛡️", color: "text-blue-400", desc: "เลือกปกป้องใครก็ได้ 1 คนไม่ให้ถูกฆ่า (ห้ามซ้ำคนเดิม)" },
  hunter: { name: "Hunter (นายพราน)", icon: "🔫", color: "text-orange-400", desc: "ถ้าคุณตาย คุณสามารถลากใครก็ได้ไปตายด้วย 1 คน" },
  witch: { name: "Witch (แม่มด)", icon: "🧙‍♀️", color: "text-fuchsia-400", desc: "มี 2 ยา: ยาชุบชีวิต และ ยาพิษ (ใช้อย่างละครั้งทั้งเกม)" },
  cupid: { name: "Cupid (กามเทพ)", icon: "💘", color: "text-pink-400", desc: "เลือกคน 2 คนให้เป็นคู่รักกัน (ถ้าคนนึงตาย อีกคนตายตาม)" },
  
  // ฝั่งหมาป่า
  werewolf: { name: "Werewolf (หมาป่า)", icon: "🐺", color: "text-red-600", desc: "ตื่นมากินชาวบ้านคืนละ 1 คน เนียนให้รอดถึงเช้า" },
  sorcerer: { name: "Sorcerer (สมุนหมาป่า)", icon: "🧿", color: "text-red-400", desc: "อยู่ฝั่งหมาป่า แต่หมาป่าไม่รู้จักคุณ (หาว่าใครคือ Seer)" },
  
  // ฝั่งอิสระ
  tanner: { name: "Tanner (คนบ้า)", icon: "🤡", color: "text-yellow-400", desc: "ชนะทันทีถ้าคุณถูกโหวตประหารชีวิต!" },
};

export default function LobbyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [roomData, setRoomData] = useState<any>(null);
  const currentUser = getCurrentUser();

  // State สำหรับ Config จำนวนการ์ด
  const [config, setConfig] = useState<any>({ 
    werewolf: 2, seer: 1, villager: 1,
    bodyguard: 0, hunter: 0, witch: 0, cupid: 0, sorcerer: 0, tanner: 0
  });

  // State สำหรับ Popup ข้อมูล Role (เก็บชื่อ role ที่กำลังกดดู)
  const [selectedRoleInfo, setSelectedRoleInfo] = useState<string | null>(null);

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

  // ถ้าเริ่มเกมแล้ว ให้ไปหน้า GameView
  if (roomData.status === 'playing') {
    return <GameView myRole={myData.role} isHost={isHost} roomId={id as string} />;
  }

  // คำนวณยอดรวม
  const totalCards = Object.values(config).reduce((a: any, b: any) => a + b, 0) as number;
  const isReadyToStart = totalCards === players.length && players.length > 0;

  const updateConfig = (role: string, value: number) => {
    if (value < 0) return;
    setConfig((prev: any) => ({ ...prev, [role]: value }));
  }

  const handleStartGame = async () => {
    if (!isReadyToStart) return alert(`การ์ดมี ${totalCards} ใบ แต่คนมี ${players.length} คน (ต้องเท่ากัน)`);
    try { await startGame(id as string, roomData.players, config); } 
    catch (e: any) { alert(e.message); }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 pb-20 relative">
      
      {/* --- POPUP แสดงข้อมูล Role (เมื่อกด ?) --- */}
      {selectedRoleInfo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6" onClick={() => setSelectedRoleInfo(null)}>
          <div className="bg-zinc-800 border border-zinc-600 p-6 rounded-xl max-w-sm w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedRoleInfo(null)} className="absolute top-2 right-3 text-gray-500 hover:text-white text-xl">✕</button>
            
            <div className="text-6xl mb-4 animate-bounce">
              {ROLE_DETAILS[selectedRoleInfo]?.icon}
            </div>
            <h3 className={`text-2xl font-bold mb-2 uppercase ${ROLE_DETAILS[selectedRoleInfo]?.color}`}>
              {ROLE_DETAILS[selectedRoleInfo]?.name}
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {ROLE_DETAILS[selectedRoleInfo]?.desc}
            </p>
          </div>
        </div>
      )}

      {/* --- LOBBY UI --- */}
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-gray-400">ROOM ID</p>
          <h1 className="text-5xl font-bold tracking-widest text-red-500 mb-2">{id}</h1>
          <div className="inline-block bg-zinc-800 px-3 py-1 rounded text-sm text-green-400">Waiting for players...</div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-4 border-b border-zinc-700 pb-2">ผู้เล่น ({players.length} คน)</h2>
          <div className="grid grid-cols-2 gap-2">
            {players.map((p: any, index) => (
              <div key={index} className="flex items-center justify-between bg-zinc-700 p-2 rounded text-sm">
                <span className="truncate pr-2">{p.name}</span>
                {p.isHost && <span className="text-[10px] bg-yellow-600 px-1 py-0.5 rounded text-black font-bold">HOST</span>}
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <div className="space-y-4">
             <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                <h3 className="text-center font-bold mb-4 text-gray-300">ตั้งค่าจำนวนการ์ด</h3>
                
                <div className="space-y-2">
                    {Object.keys(config).map(role => (
                        <div key={role} className="flex justify-between items-center bg-zinc-900/50 p-2 rounded">
                            {/* ชื่อ Role + ปุ่ม ? */}
                            <div className="flex items-center gap-2">
                                <span className="capitalize font-medium text-gray-300 w-20 truncate">{role}</span>
                                <button 
                                  onClick={() => setSelectedRoleInfo(role)}
                                  className="w-5 h-5 flex items-center justify-center bg-zinc-700 text-gray-400 rounded-full text-xs hover:bg-zinc-600 hover:text-white transition"
                                >
                                  ?
                                </button>
                            </div>

                            {/* ปุ่ม + - */}
                            <div className="flex items-center gap-3">
                                <button onClick={() => updateConfig(role, config[role] - 1)} className="w-8 h-8 bg-zinc-700 rounded hover:bg-zinc-600 text-xl leading-none pb-1">-</button>
                                <span className="w-6 text-center font-bold">{config[role]}</span>
                                <button onClick={() => updateConfig(role, config[role] + 1)} className="w-8 h-8 bg-zinc-700 rounded hover:bg-zinc-600 text-xl leading-none pb-1">+</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`text-center font-bold mt-4 py-2 rounded border ${isReadyToStart ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-red-900/20 border-red-500 text-red-400'}`}>
                    การ์ด {totalCards} ใบ / ผู้เล่น {players.length} คน
                </div>
             </div>
             <button onClick={handleStartGame} disabled={!isReadyToStart} 
                className={`w-full py-4 rounded-lg font-bold text-xl shadow-lg transition-all ${isReadyToStart ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-zinc-700 text-zinc-500'}`}>
                START GAME 🐺
             </button>
          </div>
        ) : (
          <div className="text-center text-gray-400 animate-pulse mt-10">รอหัวหน้าห้องตั้งค่าเกม...</div>
        )}
      </div>
    </div>
  );
}

// --- Game View ---
function GameView({ myRole, isHost, roomId }: { myRole: string, isHost: boolean, roomId: string }) {
  const [isRevealed, setIsRevealed] = useState(false);
  
  // ใช้ ROLE_DETAILS ตัวเดียวกัน
  const role = ROLE_DETAILS[myRole] || { name: "Unknown", icon: "❓", color: "text-gray-400", desc: "..." };

  const handleReset = async () => {
    if (confirm("จบเกมและล้างไพ่ทั้งหมด?")) {
      await resetGame(roomId);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      <div className="absolute top-6 left-0 right-0 text-center z-10">
         <h1 className="text-2xl font-bold text-gray-500">YOUR ROLE</h1>
         <p className="text-xs text-gray-600">กดค้างที่การ์ดเพื่อดู</p>
      </div>

      <div 
        className="w-full max-w-xs aspect-[3/4] cursor-pointer perspective-1000 select-none touch-none z-20"
        onMouseDown={() => setIsRevealed(true)}
        onMouseUp={() => setIsRevealed(false)}
        onMouseLeave={() => setIsRevealed(false)}
        onTouchStart={() => setIsRevealed(true)}
        onTouchEnd={() => setIsRevealed(false)}
      >
        <div className={`relative w-full h-full duration-500 transition-all transform ${isRevealed ? "" : "rotate-y-180"}`}>
            {/* Front */}
            {isRevealed ? (
                <div className="absolute inset-0 bg-zinc-900 rounded-xl border-4 border-white flex flex-col items-center justify-center p-4 text-center shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                    <div className="text-8xl mb-6 animate-pulse">{role.icon}</div>
                    <h2 className={`text-2xl font-bold uppercase mb-4 ${role.color}`}>{role.name}</h2>
                    <p className="text-gray-300 text-sm leading-relaxed">{role.desc}</p>
                </div>
            ) : (
            /* Back */
                <div className="absolute inset-0 bg-gradient-to-br from-red-950 to-black rounded-xl border-4 border-zinc-800 flex items-center justify-center shadow-2xl">
                     <div className="text-center opacity-40">
                        <span className="text-6xl filter grayscale">🐺</span>
                        <p className="font-bold tracking-[0.5em] mt-4 text-xs">TOP SECRET</p>
                     </div>
                </div>
            )}
        </div>
      </div>

      <div className="absolute bottom-10 w-full max-w-md px-6 z-10">
        {isHost && (
            <button onClick={handleReset} className="w-full bg-zinc-800/80 backdrop-blur border border-zinc-600 hover:bg-zinc-700 text-gray-300 py-3 rounded-lg font-bold">
                🔄 จบเกม / เริ่มใหม่
            </button>
        )}
      </div>
    </div>
  );
}