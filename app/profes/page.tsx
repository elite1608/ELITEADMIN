"use client";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { UserCheck, Lock, LogOut, CheckCircle2, ChevronRight, CalendarCheck, Trophy, Key, DollarSign, Activity, FileText } from "lucide-react";
import CompetenciasModulo from "../admin/components/CompetenciasModulo";


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

    const [vistaActiva, setVistaActiva] = useState<'asistencia' | 'competencias' | 'finanzas'>('asistencia');
    const [subVistaFinanzas, setSubVistaFinanzas] = useState<'resumen' | 'historial'>('resumen');
    
    const [pinInput, setPinInput] = useState("");
    const [modalAlerta, setModalAlerta] = useState<{ titulo: string, mensaje: string, tipo: 'exito'|'error' } | null>(null);
    
    // Datos BD
    const [estudiantes, setEstudiantes] = useState<any[]>([]);
    const [asistenciasHoy, setAsistenciasHoy] = useState<any[]>([]);
    const [asistenciasMesProfesor, setAsistenciasMesProfesor] = useState<any[]>([]);
    const [historialPagosProfesor, setHistorialPagosProfesor] = useState<any[]>([]);
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
        const { data: asisHoy } = await supabase.from("asistencias").select("*").eq('fecha', fechaHoyStr);
        
        // --- LÓGICA QUINCENAL (CADA 2 SEMANAS) ---
        const hoy = new Date();
        const diaActual = hoy.getDate();
        let fechaInicioCorte, fechaFinCorte;

        if (diaActual <= 15) {
            fechaInicioCorte = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
            fechaFinCorte = new Date(hoy.getFullYear(), hoy.getMonth(), 15).toISOString().split('T')[0];
        } else {
            fechaInicioCorte = new Date(hoy.getFullYear(), hoy.getMonth(), 16).toISOString().split('T')[0];
            fechaFinCorte = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
        }

        const { data: asisCorte } = await supabase.from("asistencias")
            .select("*")
            .gte('fecha', fechaInicioCorte)
            .lte('fecha', fechaFinCorte)
            .eq('profesor_turno', profeLogueado.nombre);

        // Obtener historial de pagos del profe
        const { data: pagos } = await supabase.from("pagos_profesores")
            .select("*")
            .eq('profesor', profeLogueado.nombre)
            .order('created_at', { ascending: false });

        if (est) setEstudiantes(est);
        if (asisHoy) setAsistenciasHoy(asisHoy);
        if (asisCorte) setAsistenciasMesProfesor(asisCorte); // Reutilizamos el estado para no quebrar el resto del app
        if (pagos) setHistorialPagosProfesor(pagos);
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
            setAsistenciasMesProfesor(prev => prev.filter(a => a.id !== asistido.id)); // Actualiza contador finanzas
            await supabase.from("asistencias").delete().eq('id', asistido.id); 
        } else { 
            const profeResponsable = profeLogueado.nombre; // ✅ REGLA DE ORO RESTAURADA
            const tempId = Math.random();
            const nuevaAsisTemp = { id: tempId, gimnasta_id: gimnastaId, fecha: fechaHoyStr, presente: true, profesor_turno: profeResponsable };
            setAsistenciasHoy(prev => [...prev, nuevaAsisTemp]);
            setAsistenciasMesProfesor(prev => [...prev, nuevaAsisTemp]); // Actualiza contador finanzas
            
            const { data: realAsis } = await supabase.from("asistencias")
                .insert({ gimnasta_id: gimnastaId, fecha: fechaHoyStr, presente: true, profesor_turno: profeResponsable })
                .select().single();
            
            if (realAsis) {
                setAsistenciasHoy(prev => prev.map(a => a.id === tempId ? realAsis : a));
                setAsistenciasMesProfesor(prev => prev.map(a => a.id === tempId ? realAsis : a));
            }
        }
    };

    const alumnasHoy = estudiantes.filter(e => (e.dias || []).includes(diaHoy));
    alumnasHoy.sort((a, b) => {
        if (a.profesor === profeLogueado?.nombre && b.profesor !== profeLogueado?.nombre) return -1;
        return a.nombre.localeCompare(b.nombre);
    });

    // Cálculos Financieros Quincenales
    const diasUnicosTrabajados = profeLogueado ? Array.from(new Set(asistenciasMesProfesor.map(a => a.fecha))).length : 0;
    const tarifaPorClase = 45000;
    const saldoAcumulado = diasUnicosTrabajados * tarifaPorClase;

    const fechaCorteCalculada = new Date();
    if (fechaCorteCalculada.getDate() <= 15) {
        fechaCorteCalculada.setDate(15); // El corte es el 15
    } else {
        fechaCorteCalculada.setMonth(fechaCorteCalculada.getMonth() + 1, 0); // El corte es fin de mes
    }

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

            <main className={`p-4 mx-auto relative z-10 animate-in fade-in duration-700 ${vistaActiva === 'competencias' ? 'max-w-7xl' : 'max-w-md'}`}>
                
                <div className="max-w-md mx-auto flex gap-1 p-1.5 bg-black/40 rounded-[2rem] border border-white/5 mb-8 shadow-inner backdrop-blur-md overflow-x-auto custom-scrollbar">
                    <button onClick={() => setVistaActiva('asistencia')} className={`min-w-[110px] flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${vistaActiva === 'asistencia' ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-900/30' : 'text-zinc-500'}`}><CalendarCheck size={14} /> Clases</button>
                    <button onClick={() => setVistaActiva('finanzas')} className={`min-w-[110px] flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${vistaActiva === 'finanzas' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/30' : 'text-zinc-500'}`}><DollarSign size={14} /> Mi Pago</button>
                    <button onClick={() => setVistaActiva('competencias')} className={`min-w-[110px] flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${vistaActiva === 'competencias' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/30' : 'text-zinc-500'}`}><Trophy size={14} /> Torneos</button>
                </div>

                {vistaActiva === 'asistencia' && (
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
                )}

                {vistaActiva === 'finanzas' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6 px-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none italic text-white">Estado <br/><span className="text-emerald-400">Financiero</span></h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
                                Panel Privado de Entrenador
                            </p>
                        </div>

                        <div className="flex gap-2 mb-6">
                            <button onClick={() => setSubVistaFinanzas('resumen')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${subVistaFinanzas === 'resumen' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-600 border-transparent hover:text-zinc-400'}`}>Mi Pago Quincenal</button>
                            <button onClick={() => setSubVistaFinanzas('historial')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${subVistaFinanzas === 'historial' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-600 border-transparent hover:text-zinc-400'}`}>Recibos Anteriores</button>
                        </div>

                        {subVistaFinanzas === 'resumen' ? (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="bg-emerald-950/20 p-8 rounded-[2rem] border border-emerald-500/20 text-center relative overflow-hidden shadow-2xl">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full"></div>
                                    <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em] mb-2 relative z-10">Saldo Acumulado</p>
                                    <p className="text-5xl font-black text-emerald-400 tracking-tighter relative z-10 drop-shadow-lg">${saldoAcumulado.toLocaleString()}</p>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-4 relative z-10">Tarifa Base: $45.000 / Día</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-900/60 p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                                        <Activity size={20} className="mb-2 text-cyan-400"/>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Clases Dadas</p>
                                        <p className="text-2xl font-black text-white">{diasUnicosTrabajados}</p>
                                        <p className="text-[8px] font-bold text-zinc-500 uppercase mt-1">Esta quincena</p>
                                    </div>
                                    <div className="bg-zinc-900/60 p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                                        <CalendarCheck size={20} className="mb-2 text-purple-400"/>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Corte Oficial</p>
                                        <p className="text-xl font-black text-white leading-none mt-1">{fechaCorteCalculada.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '')}</p>
                                        <p className="text-[8px] font-bold text-zinc-500 uppercase mt-2">Día de Pago</p>
                                    </div>
                                </div>
                                <p className="text-[8px] text-zinc-500 text-center uppercase tracking-widest mt-4">Nota: El saldo se actualiza automáticamente al registrar tu asistencia diaria.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in">
                                {historialPagosProfesor.length === 0 ? (
                                    <div className="text-center py-16 border border-dashed border-white/10 rounded-[2rem] bg-white/5">
                                        <FileText size={32} className="mx-auto mb-3 text-zinc-600 opacity-50" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">No hay pagos registrados en tu historial.</p>
                                    </div>
                                ) : (
                                    historialPagosProfesor.map(pago => (
                                        <div key={pago.id} className="bg-zinc-900/50 p-5 rounded-3xl border border-white/5 flex justify-between items-center group">
                                            <div>
                                                <p className="text-xs font-black uppercase text-white mb-1">Pago de Nómina</p>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><CalendarCheck size={10} className="text-cyan-500"/> {new Date(pago.fecha_pago).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Soporte: {pago.clases_pagadas} clases ({pago.metodo})</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-emerald-400 tracking-tighter">${pago.monto.toLocaleString()}</p>
                                                <div className="inline-flex items-center gap-1 mt-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">
                                                    <CheckCircle2 size={8} strokeWidth={4}/> <span className="text-[7px] font-black uppercase tracking-widest">Aprobado</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {vistaActiva === 'competencias' && (
                    <div className="animate-in slide-in-from-right-4 duration-500 w-full">
                        <CompetenciasModulo estudiantes={estudiantes} esAdmin={false} puedenCalificar={true} />
                    </div>
                )}
            </main>
        </div>
    );
}