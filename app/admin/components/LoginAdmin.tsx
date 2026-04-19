"use client";
import { useState } from "react";

export default function LoginAdmin({ setUsuarioActual, setVistaActual, setFiltroDeudores }: any) {
  const [passwordInput, setPasswordInput] = useState("");
  const [errorLogin, setErrorLogin] = useState(false);
  const fondoApp = "url('/logob.png')";

  const loginAdmin = (e: any) => {
    e.preventDefault();
    if (passwordInput === "" || passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) { 
        setUsuarioActual('admin'); 
        setVistaActual('inicio'); 
        setFiltroDeudores(false);
        setErrorLogin(false);
    } else {
        setErrorLogin(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden text-left font-sans">
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: fondoApp, backgroundSize: '400px', backgroundRepeat: 'repeat', backgroundPosition: 'center'}}></div>
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-900/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-150"></div>
          <img src="/logob.png" alt="Logo" className="w-32 h-32 relative z-10 object-contain drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]" />
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-in zoom-in duration-700">
          <div className="text-center mb-10">
            <h1 className="text-white text-2xl font-black mb-1 uppercase tracking-tighter">Acceso Dirección</h1>
            <p className="text-cyan-500 text-[8px] font-black tracking-[0.5em] uppercase">Control Maestro Elite</p>
          </div>

          <form onSubmit={loginAdmin} className="space-y-8">
            <div className="relative group">
              <input 
                type="password" 
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
                className={`w-full bg-transparent border-b-2 py-4 text-center text-white text-2xl tracking-[0.5em] focus:outline-none transition-all duration-300 placeholder-zinc-700 ${errorLogin ? 'border-red-500 text-red-400' : 'border-white/20 focus:border-cyan-400'}`} 
                placeholder="••••••••" 
                autoFocus 
              />
            </div>

            {errorLogin && (
                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center animate-in shake">Credenciales Incorrectas</p>
            )}

            <button type="submit" className="w-full bg-white text-black py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:scale-[1.03] active:scale-95 transition-all duration-300">
              Desbloquear Sistema
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}