import HomeClient from "./HomeClient"; 

// ส่วนนี้จะทำงานได้แล้ว เพราะหน้านี้ไม่มี "use client"
export const metadata = {
  title: 'Werewolf Board Game Helper - แอพช่วยเล่นเกมมนุษย์หมาป่า',
  description: 'อุปกรณ์ช่วยเล่นบอร์ดเกม Werewolf (มนุษย์หมาป่า) ใช้งานฟรี ไม่ต้องโหลดแอพ สุ่มบทบาทและจับเวลาได้ทันที',
  keywords: ['werewolf', 'board game', 'แอพช่วยเล่น', 'บอร์ดเกม', 'มนุษย์หมาป่า'],
};

export default function Page() {
  // หน้านี้ทำหน้าที่แค่ส่งต่อ (Render) ไปยัง Client Component
  return <HomeClient />;
}