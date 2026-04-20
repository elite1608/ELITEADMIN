"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldAlert, UserCheck, ChevronRight, Activity, 
  Users, LayoutDashboard, UserPlus, Wallet, CreditCard, 
  Briefcase, CalendarCheck, LogOut, Menu, X, ArrowRight, Trophy,
  FileText, Send
} from "lucide-react";

// --- IMPORTACIÓN DE TUS NUEVOS MÓDULOS ---
import Dashboard from "./components/Dashboard"; 
import DirectorioModulo from "./components/DirectorioModulo";
import Inscripciones from "./components/Inscripciones";
import AsistenciaModulo from "./components/AsistenciaModulo";
import FinanzasModulo from "./components/FinanzasModulo";
import StaffModulo from "./components/StaffModulo";
import PerfilGimnasta from "./components/PerfilGimnasta";
import LoginAdmin from "./components/LoginAdmin";
import NominaModulo from "./components/NominaModulo";
import CompetenciasModulo from "./components/CompetenciasModulo";
import MensajesModulo from "./components/MensajesModulo";
import RevisionPagos from "./components/RevisionPagos";

import { enviarReciboPago, enviarRecordatorioPago } from '../utils/whatsapp';

// --- CONEXIÓN DIRECTA ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONSTANTES Y UTILIDADES ---
const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]; 
const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const obtenerFechaColombia = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
};

const obtenerNombreDia = (fechaStr: string) => {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const d = new Date(fechaStr + "T12:00:00");
  return dias[d.getDay()];
};

// --- COMPONENTES UI COMPARTIDOS ---
const BotonMenu = ({ icono, texto, activo, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${activo ? 'bg-gradient-to-r from-cyan-600 to-cyan-800 text-white shadow-lg shadow-cyan-900/30 border border-cyan-500/30 translate-x-2' : 'text-zinc-500 hover:bg-white/5 hover:text-white border border-transparent'}`}
  >
    <span className={`${activo ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-zinc-500'}`}>{icono}</span> 
    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{texto}</span>
  </button>
);

export default function EliteManager() {
  // === ESTADOS GLOBALES (El cerebro de la app) ===
  const [usuarioActual, setUsuarioActual] = useState<'admin' | null>(null);
  const [vistaActual, setVistaActual] = useState("inicio");
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [modalAlerta, setModalAlerta] = useState<{ titulo: string, mensaje: string, tipo: 'exito'|'error' } | null>(null);
  const [modalInteractivo, setModalInteractivo] = useState<any | null>(null);
  
  // Datos BD
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [listaProfesores, setListaProfesores] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [pagosProfes, setPagosProfes] = useState<any[]>([]);
  const [gastosVarios, setGastosVarios] = useState<any[]>([]);
  const [ingresosExtra, setIngresosExtra] = useState<any[]>([]);
  const [todasAsistencias, setTodasAsistencias] = useState<any[]>([]);
  const [pagosPendientesCount, setPagosPendientesCount] = useState(0);

  // Estados de Vistas Compartidas
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<any | null>(null);
  const [filtroDeudores, setFiltroDeudores] = useState(false);
  const [fechaAdmin, setFechaAdmin] = useState(obtenerFechaColombia());
  const fondoApp = "url('/logob.png')";

  // --- EFECTOS PRINCIPALES ---
  useEffect(() => {
    const cargarBasicos = async () => {
      const { data } = await supabase.from("profesores").select("*").eq('activo', true).order('nombre');
      if (data && data.length > 0) setListaProfesores(data); 
    };
    cargarBasicos();
  }, []);

  useEffect(() => { 
    if (usuarioActual) {
      cargarTodo(); 
      // Websockets y conteo de pagos pendientes
      const canalSincronizacion = supabase
        .channel('cambios-en-vivo')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias' }, (payload) => {
            cargarTodo();
        }).subscribe();

      const checkPagos = async () => {
        const { count } = await supabase.from('comprobantes_revision').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente');
        if (count !== null) setPagosPendientesCount(count);
      };
      checkPagos();

      return () => { supabase.removeChannel(canalSincronizacion); };
    }
  }, [usuarioActual, vistaActual]);

  const cargarTodo = async () => {
    const { data: paq } = await supabase.from("paquetes").select("*").order('precio'); setPaquetes(paq || []);
    const { data: est } = await supabase.from("gimnastas").select(`*, paquetes(*)`).order('nombre'); setEstudiantes(est || []);
    const { data: asis } = await supabase.from("asistencias").select("*").order('fecha', { ascending: false }); setTodasAsistencias(asis || []);
    const { data: pagAlumnas } = await supabase.from("pagos").select(`*, gimnastas(nombre)`).order('created_at', { ascending: false }); setPagos(pagAlumnas || []);
    const { data: pagProf } = await supabase.from("pagos_profesores").select("*").order('created_at', { ascending: false }); setPagosProfes(pagProf || []);
    const { data: gas } = await supabase.from("gastos_varios").select("*").order('created_at', { ascending: false }); setGastosVarios(gas || []);
    const { data: ing } = await supabase.from("ingresos_varios").select("*").order('created_at', { ascending: false }); setIngresosExtra(ing || []);
    const { data: prof } = await supabase.from("profesores").select("*").eq('activo', true).order('nombre'); if (prof) setListaProfesores(prof);
  };

  // Cálculo unificado de grupos para enviárselo a los módulos hijos sin que TS dé error
  const gruposExistentes = Array.from(new Set(estudiantes.map((e: any) => e.grupo_familiar).filter(Boolean)));

  // --- PUERTA DE SEGURIDAD PREMIUM ---
  if (!usuarioActual) {
    return (
        <LoginAdmin 
            setUsuarioActual={setUsuarioActual} 
            setVistaActual={setVistaActual} 
            setFiltroDeudores={setFiltroDeudores} 
        />
    );
  }

  // --- INTERFAZ PRINCIPAL ---
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans relative">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: fondoApp, backgroundSize: '300px', backgroundRepeat: 'repeat', backgroundPosition: 'center'}}></div>
      
      {/* NAVEGACION MOVIL */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-black/80 backdrop-blur-lg p-4 z-40 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2 text-left">
          <img src="/logob.png" className="w-8 h-8 object-contain" />
          <h1 className="text-[10px] font-bold uppercase tracking-tight">Elite Barranquilla</h1>
        </div>
        <button onClick={() => setMenuMovilAbierto(!menuMovilAbierto)} className="p-2 bg-white/5 rounded-lg text-xl text-white">
            {menuMovilAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900/95 backdrop-blur-2xl border-r border-white/10 p-6 transform transition-transform duration-300 ${menuMovilAbierto ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:block text-left shadow-2xl flex flex-col`}>
        <div className="flex items-center gap-3 mb-10 hidden md:flex cursor-pointer hover:scale-105 transition-transform" onClick={() => setVistaActual('inicio')}>
             <img src="/logob.png" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
             <div className="leading-none text-left"><h1 className="text-sm font-black uppercase tracking-tighter text-white">Elite Gymnastics</h1><p className="text-cyan-500 text-[8px] font-black tracking-widest uppercase">Barranquilla</p></div>
        </div>
        
        <nav className="space-y-2 flex-1 mt-12 md:mt-0">
          <BotonMenu icono={<LayoutDashboard size={18} />} texto="Dashboard" activo={vistaActual === 'inicio'} onClick={() => {setVistaActual('inicio'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<Users size={18} />} texto="Directorio" activo={vistaActual === 'directorio'} onClick={() => {setVistaActual('directorio'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<UserPlus size={18} />} texto="Inscripciones" activo={vistaActual === 'inscripciones'} onClick={() => {setVistaActual('inscripciones'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<CalendarCheck size={18} />} texto="Auditoría Asistencia" activo={vistaActual === 'asistencia'} onClick={() => {setVistaActual('asistencia'); setMenuMovilAbierto(false)}} />
          
          <button onClick={() => {setVistaActual('revision_pagos'); setMenuMovilAbierto(false)}} className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${vistaActual === 'revision_pagos' ? 'bg-gradient-to-r from-yellow-600 to-yellow-800 text-white shadow-lg shadow-yellow-900/30 border border-yellow-500/30 translate-x-2' : 'text-zinc-500 hover:bg-white/5 hover:text-white border border-transparent'}`}>
              <div className="flex items-center gap-4">
                  <span className={`${vistaActual === 'revision_pagos' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-zinc-500'}`}><FileText size={18} /></span> 
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Validar Pagos</span>
              </div>
              {pagosPendientesCount > 0 && (
                  <span className="bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                      {pagosPendientesCount}
                  </span>
              )}
          </button>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4"></div>
          <BotonMenu icono={<Wallet size={18} />} texto="Gastos y Caja" activo={vistaActual === 'gastos'} onClick={() => {setVistaActual('gastos'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<CreditCard size={18} />} texto="Nómina Profes" activo={vistaActual === 'nomina'} onClick={() => {setVistaActual('nomina'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<Briefcase size={18} />} texto="Gestión Staff" activo={vistaActual === 'equipo'} onClick={() => {setVistaActual('equipo'); setMenuMovilAbierto(false)}} />
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4"></div>
          <BotonMenu icono={<Send size={18} />} texto="Comunicaciones" activo={vistaActual === 'mensajes'}  onClick={() => {setVistaActual('mensajes'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<Trophy size={18} />} texto="Competencias" activo={vistaActual === 'competencias'} onClick={() => {setVistaActual('competencias'); setMenuMovilAbierto(false)}} />
        </nav>
        
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-white/5 mb-4 text-left shadow-inner">
            <p className="text-[8px] text-zinc-500 uppercase font-black mb-1 flex items-center gap-1"><ShieldAlert size={10} className="text-cyan-500"/> SESIÓN MAESTRA</p>
            <p className="text-xs font-black text-white truncate uppercase tracking-widest">DIRECCIÓN ELITE</p>
        </div>
        <button onClick={() => setUsuarioActual(null)} className="text-zinc-600 flex items-center justify-center gap-2 hover:text-red-400 text-[10px] uppercase font-black tracking-widest pt-4 border-t border-white/5 w-full transition-colors group">
            <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" /> Cerrar Sistema
        </button>
      </aside>

      {/* RENDERIZADO DE MÓDULOS DEPENDIENDO DE LA VISTA */}
      <main className="flex-1 p-4 pt-24 md:p-10 lg:p-14 overflow-x-hidden relative z-10 text-left">
        
        {vistaActual === 'inicio' && (
            <Dashboard 
                estudiantes={estudiantes} 
                pagos={pagos} 
                gastosVarios={gastosVarios} 
                ingresosExtra={ingresosExtra} 
                pagosProfes={pagosProfes}
                setVistaActual={setVistaActual}
                setFiltroDeudores={setFiltroDeudores}
            />
        )}
        
        {vistaActual === 'revision_pagos' && <RevisionPagos />}
        {vistaActual === 'competencias' && <CompetenciasModulo estudiantes={estudiantes} esAdmin={true} />}
        {vistaActual === 'mensajes' && <MensajesModulo estudiantes={estudiantes} />}

        {vistaActual === 'directorio' && (
            <DirectorioModulo 
                estudiantes={estudiantes} 
                filtroDeudores={filtroDeudores} 
                setFiltroDeudores={setFiltroDeudores} 
                setPerfilSeleccionado={setPerfilSeleccionado}
            />
        )}

        {vistaActual === 'equipo' && (
            <StaffModulo 
                listaProfesores={listaProfesores} 
                setModalAlerta={setModalAlerta} 
                setModalInteractivo={setModalInteractivo}
                cargarTodo={cargarTodo} 
            />
        )}

        {vistaActual === 'asistencia' && (
            <AsistenciaModulo 
                estudiantes={estudiantes}
                todasAsistencias={todasAsistencias}
                listaProfesores={listaProfesores}
                fechaAdmin={fechaAdmin}
                setFechaAdmin={setFechaAdmin}
                cargarTodo={cargarTodo}
            />
        )}

        {vistaActual === 'inscripciones' && (
            <Inscripciones 
                estudiantes={estudiantes}
                paquetes={paquetes}
                listaProfesores={listaProfesores}
                setModalAlerta={setModalAlerta}
                cargarTodo={cargarTodo}
                setVistaActual={setVistaActual}
                gruposExistentes={gruposExistentes}
            />
        )}

        {/* --- AQUÍ ESTÁN LAS DOS LÍNEAS NUEVAS AÑADIDAS --- */}
        {vistaActual === 'gastos' && (
            <FinanzasModulo 
                ingresosExtra={ingresosExtra}
                gastosVarios={gastosVarios}
                pagos={pagos}
                pagosProfes={pagosProfes}
                setModalAlerta={setModalAlerta}
                cargarTodo={cargarTodo}
            />
        )}

        {vistaActual === 'nomina' && (
            <NominaModulo 
                listaProfesores={listaProfesores} 
                pagosProfes={pagosProfes} 
                todasAsistencias={todasAsistencias} 
                estudiantes={estudiantes} 
                setModalAlerta={setModalAlerta} 
                setModalInteractivo={setModalInteractivo} 
                cargarTodo={cargarTodo} 
            />
        )}

        {/* MODAL PERFIL GIMNASTA */}
        {perfilSeleccionado && (
            <PerfilGimnasta 
                perfilSeleccionado={perfilSeleccionado}
                setPerfilSeleccionado={setPerfilSeleccionado}
                estudiantes={estudiantes}
                paquetes={paquetes}
                listaProfesores={listaProfesores}
                pagos={pagos}
                todasAsistencias={todasAsistencias}
                cargarTodo={cargarTodo}
                setModalAlerta={setModalAlerta}
                setModalInteractivo={setModalInteractivo}
                gruposExistentes={gruposExistentes}
            />
        )}

        {/* ================= MODALES GLOBALES DE ALERTA Y CONFIRMACIÓN ================= */}
        {modalAlerta && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${modalAlerta.tipo === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                        {modalAlerta.tipo === 'error' ? <ShieldAlert size={32}/> : <UserCheck size={32}/>}
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2">{modalAlerta.titulo}</h3>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-8">{modalAlerta.mensaje}</p>
                    <button onClick={() => setModalAlerta(null)} className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Entendido</button>
                </div>
            </div>
        )}

        {modalInteractivo && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2">{modalInteractivo.titulo}</h3>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-6">{modalInteractivo.mensaje}</p>
                    
                    {modalInteractivo.tipo === 'prompt' && (
                        <input 
                            type="text" 
                            id="promptInput"
                            placeholder={modalInteractivo.placeholder} 
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 mb-6 text-white text-center font-black uppercase text-xs outline-none focus:border-cyan-500"
                        />
                    )}

                    <div className="flex gap-3">
                        <button onClick={() => setModalInteractivo(null)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Cancelar</button>
                        <button 
                            onClick={() => {
                                const val = modalInteractivo.tipo === 'prompt' ? (document.getElementById('promptInput') as HTMLInputElement)?.value : undefined;
                                modalInteractivo.accionConfirmar(val);
                                setModalInteractivo(null);
                            }} 
                            className={`flex-1 py-4 rounded-xl text-[10px] text-white font-black uppercase tracking-widest transition-all shadow-lg ${modalInteractivo.tipo === 'peligro' ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        )}
        {/* ============================================================================== */}

      </main>
    </div>
  );
}