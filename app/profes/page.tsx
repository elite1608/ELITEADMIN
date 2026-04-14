"use client";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { UserCheck, Lock, LogOut, CheckCircle2, ChevronRight, CalendarCheck, Trophy, Key } from "lucide-react";

import CompetenciasModulo from "@/app/admin/Competencias"; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const obtenerDiaActual = () => {
    const formatter = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', weekday: 'long' });
    let dia = formatter.format(new Date());
    return dia.charAt(0).toUpperCase() + dia.slice(1);
};

const obtenerFechaColombia = () => {
    const formatter = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' 
    });
    return formatter.format(new Date()); 
};

export default function PortalProfesores() {
    const [listaProfesores, setListaProfesores] = useState<any[]>([]);
    const [profeSeleccionado, setProfeSeleccionado] = useState<any>(null);
    const [profeLogueado, setProfeLogueado] = useState<any>(null);
    
    // Estados para el cambio de PIN
    const [pidiendoCambioPin, setPidiendoCambioPin] = useState(false);
    const [nuevoPin1, setNuevoPin1] = useState("");
    const [nuevoPin2, setNuevoPin2] = useState("");

    const [vistaActiva, setVistaActiva] = useState<'asistencia' | 'competencias'>('asistencia');
    const [pinInput, setPinInput] = useState("");
    const [modalAlerta, setModalAlerta] = useState<{ titulo: string, mensaje: string, tipo: 'exito'|'error' } | null>(null);
    const [estudiantes, setEstudiantes] = useState<any[]>([]);
    const [asistenciasHoy, setAsistenciasHoy] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    const diaHoy = obtenerDiaActual();
    const fechaHoyStr = obtenerFechaColombia();
    const fondoApp = "url('/logob.png')";

    useEffect(() => {
        const cargarProfes = async () => {
            const { data } = await supabase.from("profesores").select("*").eq('activo', true).order('nombre');
            if (data) setListaProfesores(data);
            setCargando(false);
        };
        cargarProfes();
    }, []);

    const cargarDatosClase = async () => {
        const { data: est } = await supabase.from("gimnastas").select("*, paquetes(nombre)").order('nombre');
        const { data: asis } = await supabase.from("asistencias").select("*").eq('fecha', fechaHoyStr);
        if (est) setEstudiantes(est);
        if (asis) setAsistenciasHoy(asis);
    };

    useEffect(() => { if (profeLogueado) cargarDatosClase(); }, [profeLogueado]);

    // LÓGICA DE LOGIN CON INTERCEPTOR DE SEGURIDAD
    const procesarLogin = async (e: any) => {
        e.preventDefault();
        if (pinInput === profeSeleccionado.pin_acceso) {
            // Si el perfil requiere cambio o el PIN es el genérico 1234
            if (profeSeleccionado.requiere_cambio_pin || pinInput === '1234') {
                setPidiendoCambioPin(true);
            } else {
                setProfeLogueado(profeSeleccionado); 
                setProfeSeleccionado(null); 
                setPinInput("");
            }
        } else {
            setModalAlerta({ titulo: "Acceso Denegado", mensaje: "PIN incorrecto.", tipo: "error" });
        }
    };

    // GUARDAR EL NUEVO PIN
    const guardarNuevoPin = async (e: any) => {
        e.preventDefault();
        if (nuevoPin1 !== nuevoPin2) return setModalAlerta({ titulo: "Error", mensaje: "Las contraseñas no coinciden.", tipo: "error" });
        if (nuevoPin1.length < 4) return setModalAlerta({ titulo: "Error", mensaje: "El PIN debe tener al menos 4 caracteres.", tipo: "error" });

        const { error } = await supabase.from("profesores").update({ pin_acceso: nuevoPin1, requiere_cambio_pin: false }).eq('id', profeSeleccionado.id);
        
        if (error) {
            setModalAlerta({ titulo: "Error", mensaje: "No se pudo actualizar el PIN.", tipo: "error" });
        } else {
            setModalAlerta({ titulo: "¡Seguridad Actualizada!", mensaje: "Tu nuevo PIN ha sido guardado.", tipo: "exito" });
            setProfeLogueado({ ...profeSeleccionado, pin_acceso: nuevoPin1, requiere_cambio_pin: false });
            setPidiendoCambioPin(false);
            setProfeSeleccionado(null);
            setPinInput("");
            setNuevoPin1("");
            setNuevoPin2("");
        }
    };

    const toggleAsistencia = async (gimnastaId: number) => {
        const asistido = asistenciasHoy.find(a => a.gimnasta_id === gimnastaId);
        if (asistido) { 
            setAsistenciasHoy(prev => prev.filter(a => a.id !== asistido.id));
            await supabase.from("asistencias").delete().eq('id', asistido.id); 
        } else { 
            const profeResponsable = profeLogueado.nombre; // ✅ REGLA DE ORO RESTAURADA
            const tempId = Math.random();
            const nuevaAsisTemp = { id: tempId, gimnasta_id: gimnastaId, fecha: fechaHoyStr, presente: true, profesor_turno: profeResponsable };
            setAsistenciasHoy(prev => [...prev, nuevaAsisTemp]);
            
            const { data: realAsis } = await supabase.from("asistencias")
                .insert({ gimnasta_id: gimnastaId, fecha: fechaHoyStr, presente: true, profesor_turno: profeResponsable })
                .select().single();
            
            if (realAsis) {
                setAsistenciasHoy(prev => prev.map(a => a.id === tempId ? realAsis : a));
            }
        }
    };

    const alumnasHoy = estudiantes.filter(e => (e.dias || []).includes(diaHoy));
    alumnasHoy.sort((a, b) => {
        if (a.profesor === profeLogueado?.nombre && b.profesor !== profeLogueado?.nombre) return -1;
        return a.nombre.localeCompare(b.nombre);
    });

    if (cargando) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-cyan-400 font-black animate-pulse uppercase tracking-[0.5em] text-xs">Cargando Sistema...</div>;

    if (!profeLogueado) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 relative overflow-hidden font-sans text-left">
                <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: fondoApp, backgroundSize: '400px'}}></div>
                <div className="relative z-10 w-full max-w-sm bg-zinc-900/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <img src="/logob.png" className="w-20 h-20 mb-4" />
                        <h1 className="text-white text-xl font-black uppercase tracking-tighter italic">Elite Staff</h1>
                    </div>
                    
                    {!profeSeleccionado ? (
                        <div className="space-y-3">
                            {listaProfesores.map(p => (
                                <button key={p.id} onClick={() => setProfeSeleccionado(p)} className="w-full bg-white/5 text-zinc-300 py-4 px-6 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group">
                                    <div className="flex items-center gap-3"><UserCheck size={18} className="text-cyan-500" /> <span className="text-xs font-bold uppercase">{p.nombre}</span></div>
                                    <ChevronRight size={16} />
                                </button>
                            ))}
                        </div>
                    ) : pidiendoCambioPin ? (
                        // 🔒 PANTALLA DE CAMBIO DE PIN OBLIGATORIO
                        <form onSubmit={guardarNuevoPin} className="space-y-4 animate-in fade-in zoom-in-95">
                            <div className="flex justify-center mb-2"><Key size={24} className="text-cyan-400"/></div>
                            <p className="text-center text-white text-[10px] font-black uppercase mb-6 tracking-widest leading-relaxed">Por seguridad, debes crear <br/>una nueva contraseña</p>
                            
                            <input type="password" value={nuevoPin1} onChange={e => setNuevoPin1(e.target.value)} className="w-full p-4 rounded-2xl bg-zinc-950 text-white text-center tracking-[0.8em] font-black border border-white/10 focus:border-cyan-500 outline-none" placeholder="NUEVO PIN" autoFocus />
                            <input type="password" value={nuevoPin2} onChange={e => setNuevoPin2(e.target.value)} className="w-full p-4 rounded-2xl bg-zinc-950 text-white text-center tracking-[0.8em] font-black border border-white/10 focus:border-cyan-500 outline-none" placeholder="REPETIR PIN" />
                            
                            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all mt-4">Guardar y Entrar</button>
                            <button type="button" onClick={() => {setPidiendoCambioPin(false); setProfeSeleccionado(null);}} className="w-full text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] pt-2 hover:text-white transition-colors">← Cancelar</button>
                        </form>
                    ) : (
                        <form onSubmit={procesarLogin} className="space-y-4 animate-in fade-in">
                            <p className="text-center text-white text-xs font-bold uppercase mb-4 tracking-widest">{profeSeleccionado.nombre}</p>
                            <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} className="w-full p-4 rounded-2xl bg-zinc-950 text-white text-center tracking-[0.8em] font-black border border-white/10 focus:border-cyan-500 outline-none" placeholder="****" autoFocus />
                            <button type="submit" className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95">Ingresar</button>
                            <button type="button" onClick={() => setProfeSeleccionado(null)} className="w-full text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] pt-2">← Cambiar</button>
                        </form>
                    )}
                </div>
                
                {modalAlerta && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-sm animate-in fade-in">
                        <div className={`bg-zinc-900 border ${modalAlerta.tipo === 'exito' ? 'border-emerald-500/20' : 'border-red-500/20'} rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl animate-in zoom-in-95`}>
                            <h3 className={`text-xl font-black uppercase tracking-tighter mb-2 ${modalAlerta.tipo === 'exito' ? 'text-emerald-400' : 'text-red-400'}`}>{modalAlerta.titulo}</h3>
                            <p className="text-xs text-zinc-400 font-bold uppercase mb-6">{modalAlerta.mensaje}</p>
                            <button onClick={() => setModalAlerta(null)} className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-xl uppercase text-[10px] transition-all">Continuar</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans relative pb-20 overflow-x-hidden text-left">
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: fondoApp, backgroundSize: '300px'}}></div>
            
            <header className="sticky top-0 bg-zinc-900/80 backdrop-blur-xl border-b border-white/5 p-4 z-50 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-900/30 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/30 shadow-lg"><UserCheck size={18} /></div>
                    <div><p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">En Turno</p><p className="text-sm font-bold uppercase tracking-tighter italic">{profeLogueado.nombre}</p></div>
                </div>
                <button onClick={() => setProfeLogueado(null)} className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 active:scale-90 transition-all"><LogOut size={16} /></button>
            </header>

            <main className={`p-4 mx-auto relative z-10 animate-in fade-in duration-700 ${vistaActiva === 'asistencia' ? 'max-w-md' : 'max-w-7xl'}`}>
                
                <div className="max-w-md mx-auto flex gap-2 p-1.5 bg-black/40 rounded-[2rem] border border-white/5 mb-8 shadow-inner backdrop-blur-md">
                    <button onClick={() => setVistaActiva('asistencia')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${vistaActiva === 'asistencia' ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-900/30' : 'text-zinc-500'}`}><CalendarCheck size={14} /> Asistencia</button>
                    <button onClick={() => setVistaActiva('competencias')} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${vistaActiva === 'competencias' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/30' : 'text-zinc-500'}`}><Trophy size={14} /> Torneos</button>
                </div>

                {vistaActiva === 'asistencia' ? (
                    <div className="animate-in slide-in-from-left-4 duration-500">
                        <div className="mb-8 px-2">
                            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none italic">Clases <br/><span className="text-cyan-500">de Hoy</span></h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span> {diaHoy} • {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                        <div className="space-y-3">
                            {alumnasHoy.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-white/10 rounded-[2rem] bg-white/5 backdrop-blur-sm">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">No hay clases programadas para hoy.</p>
                                </div>
                            ) : (
                                alumnasHoy.map(alumna => {
                                    const asistio = asistenciasHoy.some(a => a.gimnasta_id === alumna.id);
                                    const esMiAlumna = alumna.profesor === profeLogueado.nombre;
                                    return (
                                        <div key={alumna.id} onClick={() => toggleAsistencia(alumna.id)} className={`relative overflow-hidden p-5 rounded-[2rem] flex items-center gap-5 transition-all duration-300 active:scale-95 cursor-pointer border ${asistio ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_10px_40px_rgba(6,182,212,0.15)]' : 'bg-zinc-900/60 border-white/5 hover:border-white/10'}`}>
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${asistio ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50 rotate-[360deg]' : 'bg-zinc-800 text-zinc-600'}`}>{asistio ? <CheckCircle2 size={28} /> : <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>}</div>
                                            <div className="flex-1 overflow-hidden"><p className={`font-black text-sm uppercase truncate ${asistio ? 'text-white' : 'text-zinc-300'}`}>{alumna.nombre}</p><div className="flex items-center gap-2 mt-1">{esMiAlumna ? <span className="text-[8px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-lg font-black uppercase border border-purple-500/20">Tu Alumna</span> : <span className="text-[8px] text-zinc-600 font-bold uppercase truncate italic">Profe: {alumna.profesor}</span>}</div></div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-right-4 duration-500 w-full">
                        <CompetenciasModulo estudiantes={estudiantes} esAdmin={false} puedenCalificar={true} />
                    </div>
                )}
            </main>
        </div>
    );
}