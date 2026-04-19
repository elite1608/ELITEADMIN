"use client";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Search, Send, User, ChevronLeft, CheckCheck, RefreshCw } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MensajesModulo({ estudiantes }: { estudiantes: any[] }) {
    const [mensajes, setMensajes] = useState<any[]>([]);
    const [chatActivo, setChatActivo] = useState<any>(null);
    const [textoAdmin, setTextoAdmin] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(false);
    const mensajesEndRef = useRef<HTMLDivElement>(null);

    // 1. Cargar todos los mensajes (AHORA ES UN BUZÓN ESTÁTICO)
    const cargarMensajes = async () => {
        setCargando(true);
        const { data } = await supabase.from('mensajes').select('*').order('created_at', { ascending: true });
        if (data) setMensajes(data);
        setCargando(false);
    };

    // Solo carga los mensajes una vez al entrar, sin conexiones en vivo pesadas
    useEffect(() => { 
        cargarMensajes(); 
    }, []);

    // 2. Auto-scroll al último mensaje
    useEffect(() => {
        mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes, chatActivo]);

    // 3. Función para enviar mensaje como ADMIN (Sigue funcionando igual)
    const enviarMensaje = async (e: any) => {
        e.preventDefault();
        if (!textoAdmin.trim() || !chatActivo) return;
        
        const txt = textoAdmin;
        setTextoAdmin(""); // Limpiar input rápido
        
        // Reflejo instantáneo en UI
        const msjTemp = { 
            id: Date.now(), gimnasta_id: chatActivo.id, remitente: 'admin', 
            mensaje: txt, created_at: new Date().toISOString(), leido: false 
        };
        setMensajes((prev) => [...prev, msjTemp]);
        
        // Guardar en BD
        await supabase.from('mensajes').insert([{ 
            gimnasta_id: chatActivo.id, remitente: 'admin', mensaje: txt, leido: false 
        }]);
    };

    // 4. Marcar mensajes del padre como leídos al abrir el buzón
    const abrirChat = async (estudiante: any) => {
        setChatActivo(estudiante);
        const noLeidos = mensajes.filter(m => m.gimnasta_id === estudiante.id && m.remitente === 'padre' && !m.leido);
        if (noLeidos.length > 0) {
            await supabase.from('mensajes').update({ leido: true })
                .eq('gimnasta_id', estudiante.id).eq('remitente', 'padre').eq('leido', false);
            cargarMensajes(); // Refrescar para quitar el punto rojo
        }
    };

    // Ordenar estudiantes: Primero los no leídos, luego alfabético
    const estudiantesOrdenados = [...estudiantes].sort((a, b) => {
        const aNoLeidos = mensajes.some(m => m.gimnasta_id === a.id && m.remitente === 'padre' && !m.leido) ? 1 : 0;
        const bNoLeidos = mensajes.some(m => m.gimnasta_id === b.id && m.remitente === 'padre' && !m.leido) ? 1 : 0;
        if (aNoLeidos !== bNoLeidos) return bNoLeidos - aNoLeidos;
        return a.nombre.localeCompare(b.nombre);
    });

    return (
        <div className="animate-in fade-in duration-500 h-[calc(100vh-120px)] flex bg-zinc-900/80 backdrop-blur-md rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden text-left relative">
            
            {/* PANEL IZQUIERDO: Lista de Buzones */}
            <div className={`w-full md:w-1/3 border-r border-white/5 flex flex-col ${chatActivo ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-white/5 bg-zinc-900/50">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                            <MessageSquare size={20} className="text-cyan-500"/> Buzón Elite
                        </h2>
                        {/* BOTÓN MÁGICO PARA ACTUALIZAR MANUALMENTE */}
                        <button 
                            onClick={cargarMensajes} 
                            disabled={cargando}
                            className={`p-2 bg-white/5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-cyan-600/20 hover:border-cyan-500/30 transition-all ${cargando ? 'animate-spin text-cyan-500' : ''}`}
                            title="Buscar mensajes nuevos"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                        <input 
                            type="text" placeholder="Buscar familia..." 
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-white/10 rounded-xl text-xs font-bold uppercase text-white outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {estudiantesOrdenados.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(est => {
                        const msjsEstudiante = mensajes.filter(m => m.gimnasta_id === est.id);
                        const tieneMensajes = msjsEstudiante.length > 0;
                        const noLeido = msjsEstudiante.some(m => m.remitente === 'padre' && !m.leido);
                        const ultimoMsj = tieneMensajes ? msjsEstudiante[msjsEstudiante.length - 1] : null;

                        return (
                            <button 
                                key={est.id} 
                                onClick={() => abrirChat(est)}
                                className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all ${chatActivo?.id === est.id ? 'bg-cyan-900/30 border border-cyan-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <div className="relative shrink-0">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tieneMensajes ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <User size={20} />
                                    </div>
                                    {noLeido && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-900 animate-pulse"></div>}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className={`text-xs font-black uppercase truncate ${noLeido ? 'text-white' : 'text-zinc-300'}`}>{est.nombre}</p>
                                    <p className={`text-[10px] truncate mt-1 ${noLeido ? 'text-cyan-400 font-bold' : 'text-zinc-500'}`}>
                                        {ultimoMsj ? (ultimoMsj.remitente === 'admin' ? `Tú: ${ultimoMsj.mensaje}` : ultimoMsj.mensaje) : 'Toca para abrir buzón'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* PANEL DERECHO: El Buzón / Chat */}
            <div className={`flex-1 flex flex-col bg-zinc-950/50 ${!chatActivo ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                {!chatActivo ? (
                    <div className="text-center opacity-30">
                        <MessageSquare size={48} className="mx-auto mb-4" />
                        <h3 className="text-sm font-black uppercase tracking-widest">Selecciona un buzón familiar</h3>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-white/5 bg-zinc-900 flex items-center gap-4 shrink-0 shadow-md">
                            <button onClick={() => setChatActivo(null)} className="md:hidden text-zinc-400 hover:text-white"><ChevronLeft size={24} /></button>
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400"><User size={18} /></div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase leading-tight">{chatActivo.nombre}</h3>
                                <p className="text-[9px] text-cyan-500 uppercase font-black tracking-widest">Familia • {chatActivo.paquetes?.nombre || 'Gimnasta'}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {mensajes.filter(m => m.gimnasta_id === chatActivo.id).length === 0 ? (
                                <div className="text-center mt-10 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                    <p>Este es el inicio del buzón con la familia de {chatActivo.nombre}.</p>
                                </div>
                            ) : (
                                mensajes.filter(m => m.gimnasta_id === chatActivo.id).map((msg, index) => {
                                    const esMio = msg.remitente === 'admin';
                                    return (
                                        <div key={msg.id || index} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[75%] p-4 rounded-2xl ${esMio ? 'bg-cyan-600 text-white rounded-tr-sm shadow-md' : 'bg-zinc-800 border border-white/5 text-zinc-200 rounded-tl-sm shadow-md'}`}>
                                                <p className="text-sm">{msg.mensaje}</p>
                                            </div>
                                            <span className="text-[8px] font-bold text-zinc-600 uppercase mt-1 px-1 flex items-center gap-1">
                                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                {esMio && <CheckCheck size={10} className={msg.leido ? 'text-cyan-400' : 'text-zinc-600'} />}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={mensajesEndRef} />
                        </div>

                        <div className="p-4 bg-zinc-900 border-t border-white/5 shrink-0">
                            <form onSubmit={enviarMensaje} className="flex gap-2">
                                <input 
                                    type="text" placeholder="Enviar respuesta o notificación..." 
                                    value={textoAdmin} onChange={(e) => setTextoAdmin(e.target.value)}
                                    className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
                                />
                                <button type="submit" disabled={!textoAdmin.trim()} className="px-5 bg-cyan-600 rounded-xl text-white hover:bg-cyan-500 disabled:opacity-50 disabled:bg-zinc-800 transition-all flex items-center justify-center shadow-lg active:scale-95">
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}