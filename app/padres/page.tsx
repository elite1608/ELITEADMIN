"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
    Lock, User, LogOut, CheckCircle2, AlertCircle, 
    Medal, CalendarDays, Wallet, MessageSquare, Bell, ChevronLeft, TrendingUp, Send, RefreshCw, X, Upload, Clock
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

    // NUEVOS ESTADOS PARA PAGOS Y HISTORIAL
    const [alertaSeguridad, setAlertaSeguridad] = useState<{msg: string, tipo: 'error' | 'exito'} | null>(null);
    const [archivoPago, setArchivoPago] = useState<File | null>(null);
    const [subiendoPago, setSubiendoPago] = useState(false);
    const [comprobantesHistorial, setComprobantesHistorial] = useState<any[]>([]);

    const [vistaPadre, setVistaPadre] = useState<'inicio' | 'finanzas' | 'asistencia' | 'torneos' | 'mensajes'>('inicio');

    const loginPadres = async (e: any) => {
        e.preventDefault();
        setCargando(true);
        setErrorLogin(false);

        const { data } = await supabase
            .from('gimnastas')
            .select('*, paquetes(*)')
            .ilike('nombre', `%${nombreBusqueda.trim()}%`)
            .eq('clave_acceso', clave.trim())
            .single();
        
        if (data) {
            if (data.requiere_cambio_clave) {
                setGimnastaTemporal(data);
                setNecesitaCambiarClave(true);
            } else {
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
        setAlertaSeguridad(null);

        if (nuevaClave.length < 6) {
            return setAlertaSeguridad({ msg: "La contraseña debe tener al menos 6 caracteres.", tipo: 'error' });
        }
        if (nuevaClave !== confirmarClave) {
            return setAlertaSeguridad({ msg: "Las contraseñas no coinciden. Revisa e intenta de nuevo.", tipo: 'error' });
        }

        setCargando(true);
        const { error } = await supabase
            .from('gimnastas')
            .update({ 
                clave_acceso: nuevaClave, 
                requiere_cambio_clave: false 
            })
            .eq('id', gimnastaTemporal.id);

        if (!error) {
            setAlertaSeguridad({ msg: "¡Contraseña actualizada con éxito!", tipo: 'exito' });
            setTimeout(async () => {
                setGimnasta(gimnastaTemporal);
                await refrescarDatosSilencioso(gimnastaTemporal.id);
                setVistaPadre('inicio');
                setNecesitaCambiarClave(false);
                setAlertaSeguridad(null);
            }, 1500);
        } else {
            setAlertaSeguridad({ msg: "Hubo un error al guardar. Intenta de nuevo.", tipo: 'error' });
        }
        setCargando(false);
    };

    // FUNCIÓN PARA SUBIR COMPROBANTE DE PAGO
    const subirComprobante = async () => {
        if (!archivoPago || !gimnasta) return;
        setSubiendoPago(true);

        try {
            const fileExt = archivoPago.name.split('.').pop();
            const fileName = `${Date.now()}_${gimnasta.id}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('comprobantes')
                .upload(fileName, archivoPago);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(fileName);

            const { error: dbError } = await supabase.from('comprobantes_revision').insert([{
                gimnasta_id: gimnasta.id,
                url_comprobante: urlData.publicUrl,
                monto: mora.deudaTotal,
                estado: 'pendiente'
            }]);

            if (dbError) throw dbError;

            setAlertaSeguridad({ msg: "Comprobante enviado con éxito. Dirección validará tu pago pronto.", tipo: 'exito' });
            setArchivoPago(null);
            // Refrescar historial inmediatamente
            await refrescarDatosSilencioso(gimnasta.id);
        } catch (error) {
            console.error(error);
            setAlertaSeguridad({ msg: "Error al enviar el comprobante. Intenta de nuevo.", tipo: 'error' });
        } finally {
            setSubiendoPago(false);
        }
    };

    const refrescarDatosSilencioso = async (idGimnasta: number) => {
        const { data: asis } = await supabase.from('asistencias').select('*').eq('gimnasta_id', idGimnasta).order('fecha', { ascending: false });
        if (asis) setAsistencias(asis);

        const { data: res } = await supabase.from('resultados_usag').select('*, competencias(nombre, fecha)').eq('gimnasta_id', idGimnasta).order('created_at', { ascending: false });
        if (res) setResultados(res);

        // Cargar historial de comprobantes
        const { data: comp } = await supabase.from('comprobantes_revision').select('*').eq('gimnasta_id', idGimnasta).order('created_at', { ascending: false });
        if (comp) setComprobantesHistorial(comp);

        await cargarMensajesManual(idGimnasta);
    };

    const cargarMensajesManual = async (idGimnasta: number) => {
        setActualizandoMensajes(true);
        const { data: msjs } = await supabase.from('mensajes').select('*').eq('gimnasta_id', idGimnasta).order('created_at', { ascending: true });
        if (msjs) setMensajesChat(msjs);
        setActualizandoMensajes(false);
    };

    useEffect(() => {
        const marcarComoLeidos = async () => {
            if (vistaPadre === 'mensajes' && gimnasta) {
                const noLeidos = mensajesChat.filter(m => m.remitente === 'admin' && !m.leido);
                if (noLeidos.length > 0) {
                    await supabase.from('mensajes').update({ leido: true }).eq('gimnasta_id', gimnasta.id).eq('remitente', 'admin').eq('leido', false);
                    cargarMensajesManual(gimnasta.id);
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

        const mensajeTemporal = {
            id: Date.now(), gimnasta_id: gimnasta.id, remitente: 'padre',
            mensaje: textoMensaje, leido: false, created_at: new Date().toISOString()
        };
        setMensajesChat((prev) => [...prev, mensajeTemporal]);

        const { error } = await supabase.from('mensajes').insert([{ 
            gimnasta_id: gimnasta.id, remitente: 'padre', mensaje: textoMensaje, leido: false
        }]);

        if (error) console.error("Error al enviar:", error);
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

    const mensajesSinLeer = mensajesChat.filter(m => m.remitente === 'admin' && !m.leido).length;
    const fondoApp = "url('/logob.png')";

    if (!gimnasta) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden font-sans">
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

                            <form onSubmit={loginPadres} className="space-y-4">
                                <div className="relative text-left">
                                    <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                                    <input type="text" value={nombreBusqueda} onChange={e => setNombreBusqueda(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950 text-white text-sm uppercase font-bold focus:border-red-500 outline-none border border-white/10 transition-all shadow-inner" placeholder="Nombre de la Alumna" required />
                                </div>
                                <div className="relative text-left">
                                    <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                                    <input type="password" value={clave} onChange={e => setClave(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950 text-white text-sm uppercase font-bold focus:border-red-500 outline-none border border-white/10 transition-all shadow-inner" placeholder="Clave de Acceso" required />
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
                            <div className="mb-8 animate-in slide-in-from-right-4">
                                <h1 className="text-white text-2xl font-black mb-2 uppercase tracking-tighter">Seguridad</h1>
                                <p className="text-cyan-400 text-xs font-bold leading-relaxed">Por seguridad, debes crear una contraseña propia y secreta para el perfil de {gimnastaTemporal?.nombre}.</p>
                            </div>

                            <form onSubmit={guardarNuevaClave} className="space-y-4 animate-in slide-in-from-right-4">
                                <div className="relative text-left">
                                    <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                                    <input type="password" value={nuevaClave} onChange={e => setNuevaClave(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950 text-white text-sm font-bold focus:border-cyan-500 outline-none border border-white/10 transition-all shadow-inner" placeholder="Nueva Contraseña" required />
                                </div>
                                <div className="relative text-left">
                                    <CheckCircle2 size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                                    <input type="password" value={confirmarClave} onChange={e => setConfirmarClave(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950 text-white text-sm font-bold focus:border-cyan-500 outline-none border border-white/10 transition-all shadow-inner" placeholder="Repite la Contraseña" required />
                                </div>

                                {alertaSeguridad && (
                                    <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 flex items-center gap-3 border ${
                                        alertaSeguridad.tipo === 'error' 
                                        ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                                        : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                    }`}>
                                        {alertaSeguridad.tipo === 'error' ? <AlertCircle size={14}/> : <CheckCircle2 size={14}/>}
                                        <span className="flex-1 text-left">{alertaSeguridad.msg}</span>
                                        <button onClick={() => setAlertaSeguridad(null)}><X size={12}/></button>
                                    </div>
                                )}

                                <button type="submit" disabled={cargando} className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-cyan-900/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 border border-cyan-400/20">
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
            
            <div className="bg-zinc-900/90 backdrop-blur-xl border-b border-white/10 p-4 sticky top-0 z-50 shadow-2xl shrink-0">
                <div className="max-w-6xl mx-auto flex justify-between items-center px-2 md:px-4">
                    <div className="flex items-center gap-3">
                        <img src="/logob.png" className="w-8 h-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Portal Familias</span>
                    </div>
                    <button onClick={() => setGimnasta(null)} className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full transition-colors text-[9px] font-black uppercase tracking-widest border border-red-500/20 active:scale-95">
                        <LogOut size={14} /> Salir
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 md:p-8 relative z-10 mt-2 md:mt-8 flex-1 flex flex-col md:flex-row gap-8 w-full items-start">
                
                <div className="w-full md:w-[40%] bg-zinc-900/60 backdrop-blur-2xl p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col items-center text-center shrink-0 animate-in slide-in-from-left-8 duration-500 md:sticky md:top-28 mb-4 md:mb-0">
                    
                    <div className="w-48 h-48 md:w-72 md:h-72 rounded-[3rem] overflow-hidden mb-8 bg-zinc-950 flex items-center justify-center relative group 
                        border-4 border-red-600/50 
                        shadow-[0_0_15px_rgba(239,68,68,0.3),_0_0_40px_rgba(185,28,28,0.2),_inset_0_0_15px_rgba(239,68,68,0.2)]
                        transition-all duration-500 hover:shadow-[0_0_25px_rgba(239,68,68,0.5),_0_0_60px_rgba(185,28,28,0.3),_inset_0_0_20px_rgba(239,68,68,0.3)] hover:scale-[1.01]">
                        
                        <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
                        {gimnasta.foto_url ? (
                            <img src={gimnasta.foto_url} alt={gimnasta.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                            <User size={80} className="text-zinc-700 md:scale-125" />
                        )}
                    </div>

                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white leading-tight mb-4">{gimnasta.nombre}</h1>
                    <span className="text-[10px] md:text-xs text-red-400 font-black uppercase tracking-[0.25em] bg-red-500/10 px-6 py-3 rounded-2xl border border-red-500/20">{gimnasta.paquetes?.nombre}</span>
                </div>

                <div className="w-full md:w-[60%] flex flex-col min-h-[500px]">
                    
                    {vistaPadre === 'inicio' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                            <div className="bg-gradient-to-r from-red-900/40 to-red-600/10 border border-red-500/30 p-6 rounded-[2rem] shadow-xl flex items-start gap-5 mb-8">
                                <div className="bg-red-500/20 p-3 rounded-2xl shrink-0">
                                    <Bell size={24} className="text-red-400 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-white text-xs font-black uppercase tracking-widest mb-1.5">Aviso de Dirección</h3>
                                    <p className="text-zinc-300 text-[11px] leading-relaxed">Bienvenido al nuevo portal de familias Elite. Por este medio estaremos notificando eventos, resultados y circulares importantes.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 md:gap-6">
                                <button onClick={() => setVistaPadre('finanzas')} className="bg-zinc-900/80 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] border border-white/10 text-left hover:border-red-500/50 transition-all shadow-xl group relative overflow-hidden">
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-8xl group-hover:scale-110 transition-transform"><Wallet /></div>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border shadow-inner ${mora.meses > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                                        <Wallet size={28} />
                                    </div>
                                    <h2 className="text-sm font-black uppercase text-white mb-1">Estado Cuenta</h2>
                                    <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${mora.meses > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        {mora.meses > 0 ? 'Pago Pendiente' : 'Al Día'}
                                    </p>
                                </button>

                                <button onClick={() => setVistaPadre('asistencia')} className="bg-zinc-900/80 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] border border-white/10 text-left hover:border-cyan-500/50 transition-all shadow-xl group relative overflow-hidden">
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-8xl group-hover:scale-110 transition-transform"><CalendarDays /></div>
                                    <div className="w-14 h-14 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mb-5 border border-cyan-500/30 shadow-inner">
                                        <CalendarDays size={28} />
                                    </div>
                                    <h2 className="text-sm font-black uppercase text-white mb-1">Asistencia</h2>
                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-cyan-400">Ver Calendario</p>
                                </button>

                                <button onClick={() => setVistaPadre('torneos')} className="bg-zinc-900/80 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] border border-white/10 text-left hover:border-yellow-500/50 transition-all shadow-xl group relative overflow-hidden">
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-8xl group-hover:scale-110 transition-transform"><Medal /></div>
                                    <div className="w-14 h-14 bg-yellow-500/20 text-yellow-500 rounded-2xl flex items-center justify-center mb-5 border border-yellow-500/30 shadow-inner">
                                        <Medal size={28} />
                                    </div>
                                    <h2 className="text-sm font-black uppercase text-white mb-1">Competencias</h2>
                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-yellow-500">Resultados USAG</p>
                                </button>

                                <button onClick={() => setVistaPadre('mensajes')} className="bg-zinc-900/80 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] border border-white/10 text-left hover:border-purple-500/50 transition-all shadow-xl group relative overflow-hidden">
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-8xl group-hover:scale-110 transition-transform"><MessageSquare /></div>
                                    <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-5 border border-purple-500/30 shadow-inner relative">
                                        <MessageSquare size={28} />
                                        {mensajesSinLeer > 0 && (
                                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-zinc-900 flex items-center justify-center animate-bounce shadow-lg">
                                                {mensajesSinLeer}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-sm font-black uppercase text-white mb-1">Buzón / Chat</h2>
                                    <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${mensajesSinLeer > 0 ? 'text-red-400' : 'text-purple-400'}`}>
                                        {mensajesSinLeer > 0 ? '¡Mensaje Nuevo!' : 'Atención Directa'}
                                    </p>
                                </button>
                            </div>
                        </div>
                    )}

                    {vistaPadre !== 'inicio' && (
                        <button onClick={() => setVistaPadre('inicio')} className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/5 px-5 py-3 rounded-full inline-flex self-start shrink-0 active:scale-95">
                            <ChevronLeft size={14} /> Volver al Menú Principal
                        </button>
                    )}

                    {/* --- VISTA DE FINANZAS CON SUBIDA DE COMPROBANTE --- */}
                    {vistaPadre === 'finanzas' && (
                        <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
                            <div className={`p-8 md:p-10 rounded-[3rem] border relative overflow-hidden shadow-2xl ${mora.meses > 0 ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-white">Resumen Financiero</h2>
                                    {mora.meses > 0 ? <AlertCircle className="text-red-400" size={28} /> : <CheckCircle2 className="text-green-400" size={28} />}
                                </div>
                                <div className="relative z-10">
                                    {mora.meses > 0 ? (
                                        <>
                                            <p className="text-4xl md:text-5xl font-black text-red-400 tracking-tighter mb-4">${mora.deudaTotal.toLocaleString()}</p>
                                            <div className="bg-red-950/50 p-6 rounded-[2rem] border border-red-500/20 space-y-5">
                                                <p className="text-[11px] uppercase font-bold text-red-200 leading-relaxed text-justify">
                                                    ¡Hola! Esperamos que estés muy bien. Hasta la fecha presentas <span className="text-white font-black">{mora.meses} mes(es)</span> pendiente en tu estado de cuenta.
                                                </p>

                                                <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20">
                                                    <p className="text-[10px] uppercase font-black text-white mb-3 tracking-widest text-center">Datos de Pago</p>
                                                    <p className="text-xs uppercase font-bold text-red-100 flex items-center gap-3 mb-2">
                                                        <span className="text-lg">📲</span> Nequi / Daviplata: <span className="text-white font-black tracking-widest">3022142158</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-4xl md:text-5xl font-black text-green-400 tracking-tighter mb-4">AL DÍA</p>
                                            <div className="bg-green-950/50 p-6 rounded-[2rem] border border-green-500/20">
                                                <p className="text-xs uppercase font-bold text-green-200 leading-relaxed">Tu próximo corte de pago es el: <br/><span className="text-white text-lg font-black mt-2 block">{new Date(gimnasta.proximo_vencimiento).toLocaleDateString()}</span></p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* --- MÓDULO DE SUBIDA DE COMPROBANTE --- */}
                            <div className="p-8 md:p-10 bg-zinc-900/60 backdrop-blur-md rounded-[3rem] border border-white/10 shadow-xl">
                                <h3 className="text-xs font-black uppercase text-cyan-400 mb-6 tracking-widest flex items-center gap-2">
                                    <Upload size={16}/> Reportar Transferencia
                                </h3>

                                <div className="space-y-6">
                                    <div className="relative">
                                        <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] p-8 transition-all cursor-pointer group ${archivoPago ? 'border-cyan-500 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-zinc-800 hover:border-cyan-500/50 bg-black/20'}`}>
                                            <Upload size={32} className={`mb-3 transition-colors ${archivoPago ? 'text-cyan-400' : 'text-zinc-600 group-hover:text-cyan-500'}`}/>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">
                                                {archivoPago ? archivoPago.name : "Toca para elegir la foto del recibo"}
                                            </span>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setArchivoPago(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>

                                    {alertaSeguridad && (
                                        <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 flex items-center gap-3 border ${
                                            alertaSeguridad.tipo === 'error' 
                                            ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                                            : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                        }`}>
                                            {alertaSeguridad.tipo === 'error' ? <AlertCircle size={14}/> : <CheckCircle2 size={14}/>}
                                            <span className="flex-1">{alertaSeguridad.msg}</span>
                                        </div>
                                    )}

                                    <button 
                                        onClick={subirComprobante} 
                                        disabled={!archivoPago || subiendoPago}
                                        className={`w-full py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${!archivoPago || subiendoPago ? 'bg-zinc-800 text-zinc-600 opacity-50' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95'}`}
                                    >
                                        {subiendoPago ? (
                                            <><RefreshCw size={16} className="animate-spin"/> Enviando...</>
                                        ) : (
                                            <><CheckCircle2 size={16}/> Enviar a Dirección</>
                                        )}
                                    </button>
                                </div>

                                {/* --- HISTORIAL DE COMPROBANTES --- */}
                                {comprobantesHistorial.length > 0 && (
                                    <div className="mt-12 space-y-4 animate-in fade-in duration-700">
                                        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-2 mb-4 flex items-center gap-2">
                                            <Clock size={12}/> Historial de Reportes
                                        </h3>
                                        <div className="space-y-3">
                                            {comprobantesHistorial.map((c) => (
                                                <div key={c.id} className="bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-black/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden border border-white/5 shrink-0">
                                                            <img 
                                                                src={c.url_comprobante} 
                                                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer shadow-inner" 
                                                                onClick={() => window.open(c.url_comprobante, '_blank')} 
                                                                title="Ver comprobante"
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-white uppercase mb-0.5">Reportado: {new Date(c.created_at).toLocaleDateString()}</p>
                                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Monto: ${c.monto.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                                                        c.estado === 'pendiente' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                        c.estado === 'aprobado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                        {c.estado === 'pendiente' && <Clock size={10} className="animate-pulse"/>}
                                                        {c.estado === 'aprobado' && <CheckCircle2 size={10}/>}
                                                        {c.estado === 'pendiente' ? 'En Verificación' : c.estado === 'aprobado' ? 'Validado OK' : 'Rechazado'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- RESTO DE LAS VISTAS IGUAL --- */}
                    {vistaPadre === 'asistencia' && (
                        <div className="animate-in slide-in-from-right-8 duration-500 space-y-8">
                            <div className="bg-zinc-900/80 p-8 rounded-[3rem] border border-white/10 shadow-xl">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <h2 className="text-[11px] font-black uppercase text-cyan-400 tracking-widest mb-1">Progreso del Mes</h2>
                                        <p className="text-sm font-bold text-white uppercase">{nombresMeses[hoy.getMonth()]}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl md:text-4xl font-black text-white leading-none">{asistenciasMesActual.length}<span className="text-lg text-zinc-500">/{clasesEstimadasMes}</span></p>
                                        <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mt-1">Clases</p>
                                    </div>
                                </div>
                                <div className="w-full bg-black rounded-full h-4 mb-3 border border-white/5 overflow-hidden">
                                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-4 rounded-full transition-all duration-1000 relative" style={{ width: `${porcentajeAsistencia}%` }}>
                                        <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase text-center mt-4 flex items-center justify-center gap-2"><TrendingUp size={14}/> {Math.round(porcentajeAsistencia)}% de cumplimiento estimado</p>
                            </div>

                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-4">Historial de Ingreso</h2>
                            <div className="space-y-4">
                                {asistencias.length === 0 ? (
                                    <div className="bg-zinc-900/60 p-10 rounded-[3rem] border border-white/5 text-center">
                                        <CalendarDays size={32} className="mx-auto text-zinc-700 mb-3" />
                                        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Sin registros este mes.</p>
                                    </div>
                                ) : (
                                    asistencias.map((a, i) => {
                                        const fechaFormat = obtenerDiaFormateado(a.fecha);
                                        return (
                                            <div key={i} className="bg-zinc-900/80 p-5 rounded-[2rem] border border-white/5 flex items-center gap-5 shadow-sm hover:bg-zinc-800/80 transition-colors">
                                                <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex flex-col items-center justify-center border border-cyan-500/20 shrink-0">
                                                    <span className="text-xl font-black leading-none mb-0.5">{fechaFormat.diaNum}</span>
                                                    <span className="text-[8px] font-black uppercase tracking-widest">{fechaFormat.mes}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase mb-1">{fechaFormat.diaSemana}</p>
                                                    <p className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-500"/> Asistencia Confirmada</p>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {vistaPadre === 'torneos' && (
                        <div className="animate-in slide-in-from-right-8 duration-500">
                             <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 ml-4">Historial Deportivo (USAG)</h2>
                            {resultados.length === 0 ? (
                                <div className="bg-zinc-900/60 p-10 rounded-[3rem] border border-white/5 text-center">
                                    <Medal size={40} className="mx-auto text-zinc-700 mb-4" />
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Aún no hay torneos registrados.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {resultados.map(res => (
                                        <div key={res.id} className="bg-zinc-900/80 p-8 rounded-[3rem] border border-white/10 shadow-xl relative overflow-hidden group">
                                            <div className="absolute -right-4 -bottom-4 opacity-[0.02] text-9xl text-yellow-500 pointer-events-none rotate-12 group-hover:scale-110 transition-transform duration-500"><Medal /></div>
                                            <div className="mb-8">
                                                <h3 className="text-lg font-black uppercase text-white tracking-tighter mb-1">{res.competencias?.nombre}</h3>
                                                <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">{res.nivel} • {new Date(res.competencias?.fecha).toLocaleDateString()}</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-4 gap-3 mb-6 relative z-10">
                                                <div className="bg-black/50 p-3 rounded-2xl text-center border border-white/5"><p className="text-[9px] text-blue-400 font-black mb-1.5 tracking-widest">SA</p><p className="text-sm font-black text-white">{res.puntaje_salto.toFixed(2)}</p></div>
                                                <div className="bg-black/50 p-3 rounded-2xl text-center border border-white/5"><p className="text-[9px] text-green-400 font-black mb-1.5 tracking-widest">BA</p><p className="text-sm font-black text-white">{res.puntaje_barras.toFixed(2)}</p></div>
                                                <div className="bg-black/50 p-3 rounded-2xl text-center border border-white/5"><p className="text-[9px] text-purple-400 font-black mb-1.5 tracking-widest">VI</p><p className="text-sm font-black text-white">{res.puntaje_viga.toFixed(2)}</p></div>
                                                <div className="bg-black/50 p-3 rounded-2xl text-center border border-white/5"><p className="text-[9px] text-rose-400 font-black mb-1.5 tracking-widest">PI</p><p className="text-sm font-black text-white">{res.puntaje_piso.toFixed(2)}</p></div>
                                            </div>
                                            <div className="bg-yellow-500/10 p-5 rounded-2xl border border-yellow-500/20 flex justify-between items-center relative z-10">
                                                <span className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.2em]">All-Around Total</span>
                                                <span className="text-2xl font-black text-yellow-400">{res.all_around.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {vistaPadre === 'mensajes' && (
                        <div className="animate-in slide-in-from-right-8 duration-500 flex flex-col h-full bg-zinc-900/60 rounded-[3rem] border border-white/10 overflow-hidden relative shadow-2xl">
                            <div className="p-5 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2 flex items-center gap-2"><MessageSquare size={14} className="text-purple-500"/> Chat con Dirección</p>
                                <button 
                                    onClick={() => cargarMensajesManual(gimnasta.id)} 
                                    disabled={actualizandoMensajes}
                                    className={`p-2.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all border border-transparent hover:border-white/10 active:scale-95 ${actualizandoMensajes ? 'animate-spin text-cyan-500' : ''}`}
                                    title="Actualizar Mensajes"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                            
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 min-h-[400px] max-h-[600px]">
                                {mensajesChat.length === 0 ? (
                                    <div className="text-center py-20 opacity-40">
                                        <MessageSquare size={40} className="mx-auto text-zinc-600 mb-4" />
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 leading-relaxed">Envíanos un mensaje si tienes <br/>alguna duda o novedad.</p>
                                    </div>
                                ) : (
                                    mensajesChat.map((msg, index) => {
                                        const esMio = msg.remitente === 'padre';
                                        return (
                                            <div key={msg.id || index} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[85%] p-5 rounded-3xl ${esMio ? 'bg-gradient-to-tr from-red-700 to-red-600 text-white rounded-tr-sm shadow-xl shadow-red-900/20' : 'bg-zinc-800 border border-white/10 text-zinc-200 rounded-tl-sm shadow-lg'}`}>
                                                    <p className="text-sm md:text-base leading-relaxed">{msg.mensaje}</p>
                                                </div>
                                                <span className="text-[9px] font-black text-zinc-600 uppercase mt-2 px-2 tracking-widest">
                                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={mensajesEndRef} />
                            </div>

                            <div className="p-4 bg-zinc-950/80 backdrop-blur-md border-t border-white/10 mt-auto shrink-0">
                                <form onSubmit={enviarMensaje} className="flex gap-3">
                                    <input 
                                        type="text" 
                                        value={nuevoMensaje}
                                        onChange={(e) => setNuevoMensaje(e.target.value)}
                                        placeholder="Escribe tu mensaje aquí..." 
                                        className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-5 text-sm text-white focus:border-red-500 outline-none transition-all shadow-inner"
                                    />
                                    <button type="submit" disabled={!nuevoMensaje.trim()} className="p-4 bg-red-600 rounded-2xl text-white hover:bg-red-500 disabled:opacity-50 disabled:bg-zinc-800 transition-all flex items-center justify-center shadow-lg active:scale-95">
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}