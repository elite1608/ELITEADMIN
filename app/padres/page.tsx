"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
    Lock, User, LogOut, CheckCircle2, AlertCircle, 
    Medal, CalendarDays, Wallet, MessageSquare, Bell, ChevronLeft, TrendingUp, Send, RefreshCw
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);


const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function PortalPadres() {
    const [nombreBusqueda, setNombreBusqueda] = useState("");
    const [clave, setClave] = useState("");
    const [errorLogin, setErrorLogin] = useState(false);
    
    const [gimnasta, setGimnasta] = useState<any>(null);
    const [asistencias, setAsistencias] = useState<any[]>([]);
    const [resultados, setResultados] = useState<any[]>([]);
    const [cargando, setCargando] = useState(false);
    const [actualizandoMensajes, setActualizandoMensajes] = useState(false);

    const [mensajesChat, setMensajesChat] = useState<any[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const mensajesEndRef = useRef<HTMLDivElement>(null);
    const [necesitaCambiarClave, setNecesitaCambiarClave] = useState(false);
    const [nuevaClave, setNuevaClave] = useState("");
    const [confirmarClave, setConfirmarClave] = useState("");
    const [gimnastaTemporal, setGimnastaTemporal] = useState<any>(null);

    const [vistaPadre, setVistaPadre] = useState<'inicio' | 'finanzas' | 'asistencia' | 'torneos' | 'mensajes'>('inicio');

    const loginPadres = async (e: any) => {
        e.preventDefault();
        setCargando(true);
        setErrorLogin(false);

        // Busca a la niña por nombre y verifica que la clave sea exacta
        const { data } = await supabase
            .from('gimnastas')
            .select('*, paquetes(*)')
            .ilike('nombre', `%${nombreBusqueda.trim()}%`)
            .eq('clave_acceso', clave.trim())
            .single();
        
        if (data) {
            if (data.requiere_cambio_clave) {
                // Si es el primer ingreso, lo mandamos a la pantalla de cambio de clave
                setGimnastaTemporal(data);
                setNecesitaCambiarClave(true);
            } else {
                // Si ya la había cambiado antes, entra normal
                setGimnasta(data);
                await refrescarDatosSilencioso(data.id);
                setVistaPadre('inicio');
            }
        } else {
            setErrorLogin(true);
        }
        setCargando(false);
    };

    const guardarNuevaClave = async (e: any) => {
        e.preventDefault();
        if (nuevaClave.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");
        if (nuevaClave !== confirmarClave) return alert("Las contraseñas no coinciden. Intenta de nuevo.");

        setCargando(true);
        // Actualizamos la clave en la base de datos y quitamos la bandera de primer ingreso
        const { error } = await supabase
            .from('gimnastas')
            .update({ 
                clave_acceso: nuevaClave, 
                requiere_cambio_clave: false 
            })
            .eq('id', gimnastaTemporal.id);

        if (!error) {
            alert("¡Contraseña actualizada con éxito!");
            // Lo dejamos entrar al portal
            setGimnasta(gimnastaTemporal);
            await refrescarDatosSilencioso(gimnastaTemporal.id);
            setVistaPadre('inicio');
            setNecesitaCambiarClave(false);
        } else {
            alert("Hubo un error al guardar. Intenta de nuevo.");
        }
        setCargando(false);
    };

    const refrescarDatosSilencioso = async (idGimnasta: number) => {
        const { data: asis } = await supabase.from('asistencias').select('*').eq('gimnasta_id', idGimnasta).order('fecha', { ascending: false });
        if (asis) setAsistencias(asis);

        const { data: res } = await supabase.from('resultados_usag').select('*, competencias(nombre, fecha)').eq('gimnasta_id', idGimnasta).order('created_at', { ascending: false });
        if (res) setResultados(res);

        await cargarMensajesManual(idGimnasta);
    };

    // Función específica para cargar mensajes manualmente
    const cargarMensajesManual = async (idGimnasta: number) => {
        setActualizandoMensajes(true);
        const { data: msjs } = await supabase.from('mensajes').select('*').eq('gimnasta_id', idGimnasta).order('created_at', { ascending: true });
        if (msjs) setMensajesChat(msjs);
        setActualizandoMensajes(false);
    };

    // Marcar como leídos automáticamente al entrar al chat
    useEffect(() => {
        const marcarComoLeidos = async () => {
            if (vistaPadre === 'mensajes' && gimnasta) {
                const noLeidos = mensajesChat.filter(m => m.remitente === 'admin' && !m.leido);
                if (noLeidos.length > 0) {
                    await supabase.from('mensajes').update({ leido: true }).eq('gimnasta_id', gimnasta.id).eq('remitente', 'admin').eq('leido', false);
                    cargarMensajesManual(gimnasta.id); // Usamos la carga manual aquí
                }
            }
        };
        marcarComoLeidos();
        mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [vistaPadre, mensajesChat.length]);

    const enviarMensaje = async (e: any) => {
        e.preventDefault();
        if (!nuevoMensaje.trim()) return;

        const textoMensaje = nuevoMensaje;
        setNuevoMensaje("");

        // Mostrar instantáneamente
        const mensajeTemporal = {
            id: Date.now(), gimnasta_id: gimnasta.id, remitente: 'padre',
            mensaje: textoMensaje, leido: false, created_at: new Date().toISOString()
        };
        setMensajesChat((prev) => [...prev, mensajeTemporal]);

        const { error } = await supabase.from('mensajes').insert([{ 
            gimnasta_id: gimnasta.id, remitente: 'padre', mensaje: textoMensaje, leido: false
        }]);

        if (error) {
            console.error("Error al enviar:", error);
            alert("⚠️ Error al enviar. Intenta de nuevo.");
        }
    };

    const calcularMora = (gimnastaActual: any) => {
        const hoy = new Date();
        const venc = new Date(gimnastaActual.proximo_vencimiento);
        if (venc >= hoy) return { meses: 0, deudaTotal: 0 };
        
        let meses = 0;
        let temp = new Date(venc);
        while (temp < hoy) { meses++; temp.setMonth(temp.getMonth() + 1); }
        
        let precioPlan = gimnastaActual.paquetes?.precio || 0;
        if (gimnastaActual.es_hermana) precioPlan = precioPlan / 2;
        return { meses, deudaTotal: meses * precioPlan };
    };

    const obtenerDiaFormateado = (fechaStr: string) => {
        const fecha = new Date(fechaStr + "T12:00:00"); 
        const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
        const diaNum = fecha.getDate();
        const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
        return { diaSemana, diaNum, mes };
    };

    // --- CÁLCULO DE MENSAJES SIN LEER ---
    const mensajesSinLeer = mensajesChat.filter(m => m.remitente === 'admin' && !m.leido).length;

    const fondoApp = "url('/logob.png')";

    if (!gimnasta) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden font-sans">
                {/* ... (Tus fondos y decoraciones se quedan igual) ... */}
                <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: fondoApp, backgroundSize: '400px', backgroundPosition: 'center'}}></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-sm bg-zinc-900/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl animate-in fade-in duration-500 text-center">
                    <img src="/logob.png" alt="Logo" className="w-20 h-20 mx-auto mb-6 drop-shadow-2xl" />
                    
                    {!necesitaCambiarClave ? (
                        <>
                            <div className="mb-8">
                                <h1 className="text-white text-3xl font-black mb-2 uppercase tracking-tighter">Familia Elite</h1>
                                <p className="text-zinc-400 text-xs font-medium leading-relaxed">Accede a tu portal digital para seguir de cerca el progreso de tu campeona.</p>
                            </div>

                            {/* TU FORMULARIO DE LOGIN ACTUAL */}
                            <form onSubmit={loginPadres} className="space-y-4">
                                <div className="relative text-left">
                                    <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                                    <input type="text" value={nombreBusqueda} onChange={e => setNombreBusqueda(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950 text-white text-sm uppercase font-bold focus:border-red-500 outline-none border border-white/10 transition-all" placeholder="Nombre de la Alumna" required />
                                </div>
                                <div className="relative text-left">
                                    <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                                    <input type="password" value={clave} onChange={e => setClave(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950 text-white text-sm uppercase font-bold focus:border-red-500 outline-none border border-white/10 transition-all" placeholder="Clave de Acceso" required />
                                </div>

                                {errorLogin && (
                                    <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-[10px] font-black text-red-400 uppercase tracking-widest animate-in shake">Credenciales incorrectas</div>
                                )}

                                <button type="submit" disabled={cargando} className="w-full bg-gradient-to-r from-red-700 to-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-900/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                                    {cargando ? 'Verificando...' : 'Entrar al Portal'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            {/* NUEVO FORMULARIO DE CAMBIO DE CLAVE */}
                            <div className="mb-8 animate-in slide-in-from-right-4">
                                <h1 className="text-white text-2xl font-black mb-2 uppercase tracking-tighter">Seguridad</h1>
                                <p className="text-cyan-400 text-xs font-bold leading-relaxed">Por seguridad, debes crear una contraseña propia y secreta para el perfil de {gimnastaTemporal?.nombre}.</p>
                            </div>

                            <form onSubmit={guardarNuevaClave} className="space-y-4 animate-in slide-in-from-right-4">
                                <div className="relative text-left">
                                    <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                                    <input type="password" value={nuevaClave} onChange={e => setNuevaClave(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950 text-white text-sm font-bold focus:border-cyan-500 outline-none border border-white/10 transition-all" placeholder="Nueva Contraseña" required />
                                </div>
                                <div className="relative text-left">
                                    <CheckCircle2 size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                                    <input type="password" value={confirmarClave} onChange={e => setConfirmarClave(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950 text-white text-sm font-bold focus:border-cyan-500 outline-none border border-white/10 transition-all" placeholder="Repite la Contraseña" required />
                                </div>

                                <button type="submit" disabled={cargando} className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-cyan-900/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">
                                    {cargando ? 'Guardando...' : 'Guardar y Entrar'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const mora = calcularMora(gimnasta);
    const hoy = new Date();
    const asistenciasMesActual = asistencias.filter(a => {
        const fechaA = new Date(a.fecha + "T12:00:00");
        return fechaA.getMonth() === hoy.getMonth() && fechaA.getFullYear() === hoy.getFullYear();
    });
    const diasPorSemana = gimnasta.dias?.length || 2; 
    const clasesEstimadasMes = diasPorSemana * 4;
    const porcentajeAsistencia = Math.min((asistenciasMesActual.length / clasesEstimadasMes) * 100, 100);

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans relative pb-20 flex flex-col">
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: fondoApp, backgroundSize: '300px', backgroundPosition: 'center'}}></div>
            
            <div className="bg-zinc-900/90 backdrop-blur-xl border-b border-white/10 p-5 sticky top-0 z-50 shadow-2xl shrink-0">
                <div className="max-w-md mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-red-900 rounded-full flex items-center justify-center border border-red-500/30 shadow-lg overflow-hidden">
                            <User size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-tighter text-white truncate max-w-[200px] leading-tight">{gimnasta.nombre}</h1>
                            <p className="text-[9px] text-red-400 font-black uppercase tracking-widest">{gimnasta.paquetes?.nombre}</p>
                        </div>
                    </div>
                    <button onClick={() => setGimnasta(null)} className="p-3 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            <div className="max-w-md mx-auto p-4 relative z-10 mt-4 flex-1 flex flex-col w-full">
                
                {vistaPadre === 'inicio' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                        <div className="bg-gradient-to-r from-red-900/40 to-red-600/10 border border-red-500/30 p-5 rounded-[2rem] shadow-xl flex items-start gap-4 mb-6">
                            <div className="bg-red-500/20 p-2 rounded-xl shrink-0">
                                <Bell size={20} className="text-red-400 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-1">Aviso de Dirección</h3>
                                <p className="text-zinc-300 text-[11px] leading-relaxed">Bienvenido al nuevo portal de familias Elite. Por este medio estaremos notificando eventos, resultados y circulares importantes.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setVistaPadre('finanzas')} className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-left hover:border-red-500/50 transition-all shadow-xl group relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-7xl group-hover:scale-110 transition-transform"><Wallet /></div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border shadow-inner ${mora.meses > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                                    <Wallet size={24} />
                                </div>
                                <h2 className="text-xs font-black uppercase text-white mb-1">Estado Cuenta</h2>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${mora.meses > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {mora.meses > 0 ? 'Pago Pendiente' : 'Al Día'}
                                </p>
                            </button>

                            <button onClick={() => setVistaPadre('asistencia')} className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-left hover:border-cyan-500/50 transition-all shadow-xl group relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-7xl group-hover:scale-110 transition-transform"><CalendarDays /></div>
                                <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mb-4 border border-cyan-500/30 shadow-inner">
                                    <CalendarDays size={24} />
                                </div>
                                <h2 className="text-xs font-black uppercase text-white mb-1">Asistencia</h2>
                                <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Ver Calendario</p>
                            </button>

                            <button onClick={() => setVistaPadre('torneos')} className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-left hover:border-yellow-500/50 transition-all shadow-xl group relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-7xl group-hover:scale-110 transition-transform"><Medal /></div>
                                <div className="w-12 h-12 bg-yellow-500/20 text-yellow-500 rounded-2xl flex items-center justify-center mb-4 border border-yellow-500/30 shadow-inner">
                                    <Medal size={24} />
                                </div>
                                <h2 className="text-xs font-black uppercase text-white mb-1">Competencias</h2>
                                <p className="text-[9px] font-black uppercase tracking-widest text-yellow-500">Resultados USAG</p>
                            </button>

                            {/* 👉 BOTÓN DE CHAT CON NOTIFICACIÓN 🔴 */}
                            <button onClick={() => setVistaPadre('mensajes')} className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-left hover:border-purple-500/50 transition-all shadow-xl group relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-7xl group-hover:scale-110 transition-transform"><MessageSquare /></div>
                                <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-4 border border-purple-500/30 shadow-inner relative">
                                    <MessageSquare size={24} />
                                    {mensajesSinLeer > 0 && (
                                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-zinc-900 flex items-center justify-center animate-bounce shadow-lg">
                                            {mensajesSinLeer}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-xs font-black uppercase text-white mb-1">Buzón / Chat</h2>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${mensajesSinLeer > 0 ? 'text-red-400' : 'text-purple-400'}`}>
                                    {mensajesSinLeer > 0 ? '¡Mensaje Nuevo!' : 'Atención Directa'}
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {vistaPadre !== 'inicio' && (
                    <button onClick={() => setVistaPadre('inicio')} className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full inline-flex self-start shrink-0">
                        <ChevronLeft size={14} /> Volver al Menú
                    </button>
                )}

                {/* --- VISTAS EXISTENTES (Finanzas, Asistencia, Torneos) --- */}
                {vistaPadre === 'finanzas' && (
                    <div className={`p-8 rounded-[2rem] border relative overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-300 ${mora.meses > 0 ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h2 className="text-xs font-black uppercase tracking-widest text-white">Resumen Financiero</h2>
                            {mora.meses > 0 ? <AlertCircle className="text-red-400" size={24} /> : <CheckCircle2 className="text-green-400" size={24} />}
                        </div>
                        <div className="relative z-10">
                            {mora.meses > 0 ? (
                                <>
                                    <p className="text-3xl font-black text-red-400 tracking-tighter mb-2">${mora.deudaTotal.toLocaleString()}</p>
                                    <div className="bg-red-950/50 p-4 rounded-xl border border-red-500/20">
                                        <div className="bg-red-950/50 p-5 rounded-xl border border-red-500/20 space-y-4">
                                        <p className="text-[10px] uppercase font-bold text-red-200 leading-relaxed text-justify">
                                            ¡Hola! Esperamos que estés muy bien. Hasta la fecha presentas <span className="text-white font-black">{mora.meses} mes(es)</span> pendiente en tu estado de cuenta. Tu apoyo es fundamental para que sigamos brindando la mejor formación y alegría a nuestras gimnastas en sus entrenamientos.
                                        </p>

                                        <div className="bg-red-1200/30 p-3 rounded-lg border border-red-600/10">
                                            <p className="text-[10px] uppercase font-black text-white mb-2">Puedes realizar tu pago a través de:</p>
                                            <p className="text-[11px] uppercase font-bold text-red-100 flex items-center gap-2 mb-1.5">
                                                <span>📲</span> Nequi / Daviplata: <span className="text-white font-black tracking-widest">3022142158</span>
                                            </p>
                                            <p className="text-[11px] uppercase font-bold text-red-100 flex items-center gap-2">
                                                <span>🏦</span> Efectivo (Directo en la clase)
                                            </p>
                                        </div>

                                        <p className="text-[9px] uppercase font-black text-red-300 text-center tracking-widest mt-2">
                                            ¡Muchas gracias por ser parte de nuestra familia deportiva!
                                        </p>
                                    </div>
                                         
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-3xl font-black text-green-400 tracking-tighter mb-2">AL DÍA</p>
                                    <div className="bg-green-950/50 p-4 rounded-xl border border-green-500/20">
                                        <p className="text-[10px] uppercase font-bold text-green-200">Gracias por tu puntualidad. Tu próximo corte de pago es el: <br/><span className="text-white font-black text-xs mt-1 block">{new Date(gimnasta.proximo_vencimiento).toLocaleDateString()}</span></p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {vistaPadre === 'asistencia' && (
                    <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                        <div className="bg-zinc-900/80 p-6 rounded-[2rem] border border-white/10 shadow-xl">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h2 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">Progreso del Mes</h2>
                                    <p className="text-xs font-bold text-white uppercase">{nombresMeses[hoy.getMonth()]}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-white leading-none">{asistenciasMesActual.length}<span className="text-sm text-zinc-500">/{clasesEstimadasMes}</span></p>
                                    <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Clases</p>
                                </div>
                            </div>
                            <div className="w-full bg-black rounded-full h-3 mb-2 border border-white/5 overflow-hidden">
                                <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-3 rounded-full transition-all duration-1000 relative" style={{ width: `${porcentajeAsistencia}%` }}>
                                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                                </div>
                            </div>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase text-center mt-3 flex items-center justify-center gap-1"><TrendingUp size={12}/> {Math.round(porcentajeAsistencia)}% de cumplimiento estimado</p>
                        </div>

                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-2">Historial de Ingreso</h2>
                        <div className="space-y-3">
                            {asistencias.length === 0 ? (
                                <p className="text-[10px] text-zinc-500 font-bold uppercase text-center py-4 bg-zinc-900/40 rounded-2xl">Sin registros.</p>
                            ) : (
                                asistencias.map((a, i) => {
                                    const fechaFormat = obtenerDiaFormateado(a.fecha);
                                    return (
                                        <div key={i} className="bg-zinc-900/80 p-4 rounded-2xl border border-white/5 flex items-center gap-4 shadow-sm">
                                            <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-xl flex flex-col items-center justify-center border border-cyan-500/20 shrink-0">
                                                <span className="text-lg font-black leading-none">{fechaFormat.diaNum}</span>
                                                <span className="text-[8px] font-black uppercase tracking-widest">{fechaFormat.mes}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white uppercase">{fechaFormat.diaSemana}</p>
                                                <p className="text-[9px] text-zinc-400 font-bold uppercase flex items-center gap-1 mt-0.5"><CheckCircle2 size={10} className="text-green-500"/> Asistencia Confirmada</p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}

                {vistaPadre === 'torneos' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 ml-2">Historial Deportivo (USAG)</h2>
                        {resultados.length === 0 ? (
                            <div className="bg-zinc-900/60 p-8 rounded-[2rem] border border-white/5 text-center">
                                <Medal size={32} className="mx-auto text-zinc-700 mb-3" />
                                <p className="text-[10px] font-bold uppercase text-zinc-500">Aún no hay torneos registrados.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {resultados.map(res => (
                                    <div key={res.id} className="bg-zinc-900/80 p-6 rounded-[2rem] border border-white/10 shadow-xl relative overflow-hidden">
                                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-8xl text-yellow-500 pointer-events-none rotate-12"><Medal /></div>
                                        <div className="mb-6">
                                            <h3 className="text-sm font-black uppercase text-white tracking-tighter">{res.competencias?.nombre}</h3>
                                            <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">{res.nivel} • {new Date(res.competencias?.fecha).toLocaleDateString()}</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-4 gap-2 mb-4 relative z-10">
                                            <div className="bg-black/50 p-2 rounded-xl text-center border border-white/5"><p className="text-[8px] text-blue-400 font-black mb-1">SA</p><p className="text-xs font-bold text-white">{res.puntaje_salto.toFixed(2)}</p></div>
                                            <div className="bg-black/50 p-2 rounded-xl text-center border border-white/5"><p className="text-[8px] text-green-400 font-black mb-1">BA</p><p className="text-xs font-bold text-white">{res.puntaje_barras.toFixed(2)}</p></div>
                                            <div className="bg-black/50 p-2 rounded-xl text-center border border-white/5"><p className="text-[8px] text-purple-400 font-black mb-1">VI</p><p className="text-xs font-bold text-white">{res.puntaje_viga.toFixed(2)}</p></div>
                                            <div className="bg-black/50 p-2 rounded-xl text-center border border-white/5"><p className="text-[8px] text-rose-400 font-black mb-1">PI</p><p className="text-xs font-bold text-white">{res.puntaje_piso.toFixed(2)}</p></div>
                                        </div>
                                        <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 flex justify-between items-center relative z-10">
                                            <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest">All-Around Total</span>
                                            <span className="text-lg font-black text-yellow-400">{res.all_around.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- VISTA CHAT / BUZÓN --- */}
                {vistaPadre === 'mensajes' && (
                    <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col h-full bg-zinc-900/50 rounded-[2rem] border border-white/10 overflow-hidden relative">
                        
                        <div className="p-3 bg-zinc-900 border-b border-white/10 flex justify-between items-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Chat con Dirección</p>
                            <button 
                                onClick={() => cargarMensajesManual(gimnasta.id)} 
                                disabled={actualizandoMensajes}
                                className={`p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all ${actualizandoMensajes ? 'animate-spin text-cyan-500' : ''}`}
                                title="Actualizar Mensajes"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4 min-h-[300px] max-h-[500px]">
                            {mensajesChat.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <MessageSquare size={32} className="mx-auto text-zinc-600 mb-3" />
                                    <p className="text-[10px] font-bold uppercase text-zinc-400">Envíanos un mensaje si tienes <br/>alguna duda o novedad.</p>
                                </div>
                            ) : (
                                mensajesChat.map((msg, index) => {
                                    const esMio = msg.remitente === 'padre';
                                    return (
                                        <div key={msg.id || index} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl ${esMio ? 'bg-gradient-to-tr from-red-700 to-red-600 text-white rounded-tr-sm shadow-lg shadow-red-900/20' : 'bg-zinc-800 border border-white/10 text-zinc-200 rounded-tl-sm shadow-md'}`}>
                                                <p className="text-sm">{msg.mensaje}</p>
                                            </div>
                                            <span className="text-[8px] font-bold text-zinc-600 uppercase mt-1 px-1">
                                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={mensajesEndRef} />
                        </div>

                        <div className="p-3 bg-zinc-900 border-t border-white/10 mt-auto shrink-0">
                            <form onSubmit={enviarMensaje} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={nuevoMensaje}
                                    onChange={(e) => setNuevoMensaje(e.target.value)}
                                    placeholder="Escribe tu mensaje aquí..." 
                                    className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-red-500 outline-none transition-colors"
                                />
                                <button type="submit" disabled={!nuevoMensaje.trim()} className="p-3.5 bg-red-600 rounded-xl text-white hover:bg-red-500 disabled:opacity-50 disabled:bg-zinc-800 transition-all flex items-center justify-center shadow-lg active:scale-95">
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}