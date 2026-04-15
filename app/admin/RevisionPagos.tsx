"use client";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2, XCircle, Clock, FileWarning, ExternalLink, ShieldAlert, HelpCircle } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function RevisionPagos() {
    const [comprobantes, setComprobantes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    
    // ESTADO PARA NUESTRO MODAL DEL SIGLO 21 🚀
    const [modal, setModal] = useState<{
        abierto: boolean;
        tipo: 'exito' | 'error' | 'confirmacion';
        titulo: string;
        mensaje: string;
        accionConfirmar?: () => void;
    } | null>(null);

    useEffect(() => {
        cargarPendientes();
    }, []);

    const cargarPendientes = async () => {
        setCargando(true);
        const { data, error } = await supabase
            .from('comprobantes_revision')
            .select('*, gimnastas(nombre, proximo_vencimiento)')
            .eq('estado', 'pendiente')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setComprobantes(data);
        }
        setCargando(false);
    };

    // ELIMINAMOS LOS ALERTS DE LOS 80s Y USAMOS EL MODAL
    const confirmarProceso = (idComprobante: number, gimnastaId: number, vencimientoActual: string, accion: 'aprobar' | 'rechazar') => {
        setModal({
            abierto: true,
            tipo: 'confirmacion',
            titulo: accion === 'aprobar' ? '¿Aprobar Recibo?' : '¿Rechazar Recibo?',
            mensaje: `¿Estás seguro de que deseas ${accion} esta transferencia? Se enviará una notificación automática al padre.`,
            accionConfirmar: () => ejecutarPagoEnBaseDeDatos(idComprobante, gimnastaId, vencimientoActual, accion)
        });
    };

    const ejecutarPagoEnBaseDeDatos = async (idComprobante: number, gimnastaId: number, vencimientoActual: string, accion: 'aprobar' | 'rechazar') => {
        setModal(null); // Cierra el modal de confirmación
        
        try {
            if (accion === 'aprobar') {
                // 1. Calcular nueva fecha
                const fechaActual = new Date(vencimientoActual);
                fechaActual.setMonth(fechaActual.getMonth() + 1);
                const nuevaFechaStr = fechaActual.toISOString();

                // 2. Actualizar a la niña
                await supabase.from('gimnastas').update({ proximo_vencimiento: nuevaFechaStr, estado: 'Activo' }).eq('id', gimnastaId);

                // 3. Marcar comprobante como aprobado
                await supabase.from('comprobantes_revision').update({ estado: 'aprobado' }).eq('id', idComprobante);
                
                // 4. Enviar MENSAJE AL BUZÓN DEL PADRE 📩
                await supabase.from('mensajes').insert([{
                    gimnasta_id: gimnastaId,
                    titulo: '✅ Pago Verificado y Aprobado',
                    contenido: '¡Hola! Tu transferencia ha sido validada con éxito por administración. Hemos sumado un (1) mes a tu plan actual. ¡Gracias por tu compromiso!',
                    leido: false
                }]);

                setModal({ abierto: true, tipo: 'exito', titulo: '¡Aprobado!', mensaje: 'Mes sumado y padre notificado por buzón.' });
            } else {
                // 1. Rechazar comprobante
                await supabase.from('comprobantes_revision').update({ estado: 'rechazado' }).eq('id', idComprobante);
                
                // 2. Enviar MENSAJE AL BUZÓN DEL PADRE 📩
                await supabase.from('mensajes').insert([{
                    gimnasta_id: gimnastaId,
                    titulo: '❌ Problema con tu Comprobante',
                    contenido: 'Hola. Hemos revisado el comprobante de pago que subiste, pero no ha podido ser validado. Por favor, verifica la imagen o comunícate con administración para resolverlo.',
                    leido: false
                }]);

                setModal({ abierto: true, tipo: 'exito', titulo: 'Rechazado', mensaje: 'Recibo denegado y padre notificado por buzón.' });
            }

            cargarPendientes();
        } catch (error) {
            setModal({ abierto: true, tipo: 'error', titulo: 'Error de Red', mensaje: 'Hubo un problema al conectar con la base de datos.' });
        }
    };

    if (cargando) return <div className="text-center p-10 text-cyan-500 animate-pulse font-black uppercase tracking-widest text-xs">Cargando recibos...</div>;

    return (
        <div className="bg-zinc-900/60 backdrop-blur-2xl p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
            
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <FileWarning className="text-yellow-500" size={28}/> Bandeja de Pagos
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">
                        Verificación de Transferencias
                    </p>
                </div>
                <div className="bg-yellow-500/10 text-yellow-500 px-5 py-2 rounded-full border border-yellow-500/20 text-xs font-black uppercase shadow-inner">
                    {comprobantes.length} Pendientes
                </div>
            </div>

            {comprobantes.length === 0 ? (
                <div className="text-center py-20 bg-black/20 rounded-[2rem] border border-white/5 shadow-inner">
                    <CheckCircle2 size={50} className="mx-auto text-zinc-700 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Todo al día. No hay pagos por revisar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {comprobantes.map(comp => (
                        <div key={comp.id} className="bg-black/30 p-6 rounded-[2rem] border border-white/10 relative group hover:bg-black/50 transition-colors shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">{comp.gimnastas?.nombre}</h3>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase flex items-center gap-1 mt-1 tracking-widest">
                                        <Clock size={10} className="text-yellow-500"/> Reportado: {new Date(comp.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="bg-zinc-800/80 text-cyan-400 font-black text-xs px-3 py-1 rounded-lg border border-cyan-500/30 shadow-inner">
                                    ${comp.monto.toLocaleString()}
                                </span>
                            </div>

                            <div className="w-full h-56 bg-zinc-900 rounded-2xl mb-6 border border-white/5 overflow-hidden relative group-hover:border-white/10 transition-colors">
                                <img src={comp.url_comprobante} alt="Recibo" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                <button onClick={() => window.open(comp.url_comprobante, '_blank')} className="absolute bottom-3 right-3 bg-black/80 p-2.5 rounded-xl text-white hover:text-cyan-400 hover:scale-105 transition-all backdrop-blur-md shadow-lg border border-white/10">
                                    <ExternalLink size={18} />
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => confirmarProceso(comp.id, comp.gimnasta_id, comp.gimnastas?.proximo_vencimiento, 'rechazar')}
                                    className="flex-1 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <XCircle size={16}/> Rechazar
                                </button>
                                <button 
                                    onClick={() => confirmarProceso(comp.id, comp.gimnasta_id, comp.gimnastas?.proximo_vencimiento, 'aprobar')}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_10px_20px_rgba(16,185,129,0.2)] py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02]"
                                >
                                    <CheckCircle2 size={16}/> Aprobar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 🔥 MODAL DEL SIGLO 21 INCORPORADO 🔥 */}
            {modal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[300] backdrop-blur-2xl animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-white/10 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-[0_0_100px_rgba(0,0,0,0.8)] scale-100 animate-in zoom-in-95 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${modal.tipo === 'error' ? 'bg-red-500' : modal.tipo === 'exito' ? 'bg-emerald-500' : 'bg-cyan-500'}`}></div>
                        
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-4 ${modal.tipo === 'error' ? 'bg-red-900/30 text-red-400 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : modal.tipo === 'exito' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20 shadow-[0_0_40px_rgba(34,197,94,0.3)]' : 'bg-cyan-900/30 text-cyan-400 border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.3)]'}`}>
                            {modal.tipo === 'error' && <ShieldAlert size={40}/>}
                            {modal.tipo === 'exito' && <CheckCircle2 size={40}/>}
                            {modal.tipo === 'confirmacion' && <HelpCircle size={40}/>}
                        </div>
                        
                        <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-3">{modal.titulo}</h3>
                        <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mb-10 leading-relaxed">{modal.mensaje}</p>
                        
                        {modal.tipo === 'confirmacion' ? (
                            <div className="flex gap-4">
                                <button onClick={() => setModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 font-black py-5 rounded-2xl uppercase tracking-widest text-[9px] transition-all active:scale-95 border border-white/5">Cancelar</button>
                                <button onClick={modal.accionConfirmar} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-[9px] transition-all active:scale-95 shadow-[0_10px_20px_rgba(6,182,212,0.3)]">Confirmar</button>
                            </div>
                        ) : (
                            <button onClick={() => setModal(null)} className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] uppercase tracking-[0.2em] text-[10px] transition-all hover:scale-[1.03] active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]">Cerrar Notificación</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}