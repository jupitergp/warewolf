// app/page.tsx
"use client"; // จำเป็นต้องใส่เพราะมีการใช้ Hooks (useEffect)

import { useEffect, useState } from "react";
import { loginAnonymously, onUserChanged } from "./lib/gameService";

export default function Home() {
  const [user, setUser] = useState<any>(null); // เก็บข้อมูล user
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. สั่งให้ล็อกอินทันทีที่เข้าหน้านี้
    loginAnonymously();

    // 2. ตั้งตัวดักฟัง (Listener) ว่าล็อกอินเสร็จหรือยัง
    const unsubscribe = onUserChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      }
    });

    // คืนค่าฟังก์ชันเพื่อยกเลิกการดักฟังเมื่อเปลี่ยนหน้า (Cleanup)
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Werewolf MVP</h1>
      
      <div className="border p-6 rounded-lg bg-zinc-800 text-center">
        {loading ? (
          <p className="text-yellow-400">กำลังเชื่อมต่อระบบ...</p>
        ) : (
          <div>
            <p className="text-green-400 mb-2">✅ เชื่อมต่อสำเร็จ!</p>
            <p className="text-sm text-gray-400">User ID ของคุณคือ:</p>
            <code className="bg-black px-2 py-1 rounded mt-1 block">
              {user?.uid}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}