"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // 🔴 Aquí debes poner el enlace real de tu Instagram
    window.location.href = "https://www.instagram.com/elite_gymnastics_bq"; 
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 font-sans">
        <div className="text-center animate-in fade-in duration-1000">
            <img src="/logob.png" alt="Elite Logo" className="w-20 h-20 mx-auto mb-6 drop-shadow-2xl animate-pulse" />
            <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.3em]">
                Redirigiendo a Instagram...
            </p>
        </div>
    </div>
  );
}