"use client";
import { useState, useEffect } from "react";
import { Trophy, Plus, Calendar, MapPin, X, ChevronLeft, Trash2, ArrowRight, Eye, EyeOff, UserPlus, Check } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// AHORA RECIBE "esAdmin" PARA SABER QUÉ MOSTRAR
export default function CompetenciasModulo({ estudiantes, esAdmin }: { estudiantes: any[], esAdmin: boolean }) {
    const [vista, setVista] = useState<'lista' | 'gestion'>('lista');
    const [compSeleccionada, setCompSeleccionada] = useState<any>(null);
    const [competencias, setCompetencias] = useState<any[]>([]);
    const [resultados, setResultados] = useState<any[]>([]);
    const [nivelFiltro, setNivelFiltro] = useState("");

    const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
    const [mostrarModalGimnasta, setMostrarModalGimnasta] = useState(false);
    const [nombreComp, setNombreComp] = useState("");
    const [fechaComp, setFechaComp] = useState("");
    const [lugarComp, setLugarComp] = useState("");
    const [formGimnastaId, setFormGimnastaId] = useState("");
    const [formNivel, setFormNivel] = useState("Nivel 1");

    const [editandoCelda, setEditandoCelda] = useState<{id: number, campo: string} | null>(null);
    const [valorTemporal, setValorTemporal] = useState("");

    const nivelesUSAG = ["Nivel 1", "Nivel 2", "Nivel 3", "Nivel 4", "Nivel 5", "Nivel 6", "Nivel 7", "Nivel 8", "Xcel Bronze", "Xcel Silver", "Xcel Gold"];

    const cargarCompetencias = async () => {
        const { data } = await supabase.from('competencias').select('*').order('fecha', { ascending: false });
        if (data) setCompetencias(data);
    };

    const cargarResultados = async (compId: number) => {
        const { data } = await supabase.from('resultados_usag')
            .select(`*, gimnastas(nombre)`).eq('competencia_id', compId).order('all_around', { ascending: false });
        if (data) {
            setResultados(data);
            const nivelesActivos = Array.from(new Set(data.map(r => r.nivel)));
            if (nivelesActivos.length > 0 && !nivelesActivos.includes(nivelFiltro)) {
                setNivelFiltro(nivelesActivos[0] as string);
            }
        }
    };

    useEffect(() => { cargarCompetencias(); }, []);

    const guardarCompetencia = async () => {
        if (!nombreComp || !fechaComp) return alert("Faltan datos");
        await supabase.from('competencias').insert([{ nombre: nombreComp, fecha: fechaComp, lugar: lugarComp, activa: false }]);
        setMostrarModalNueva(false); setNombreComp(""); setFechaComp(""); setLugarComp(""); cargarCompetencias();
    };

    const toggleVisibilidadProfes = async () => {
        const nuevoEstado = !compSeleccionada.activa;
        await supabase.from('competencias').update({ activa: nuevoEstado }).eq('id', compSeleccionada.id);
        setCompSeleccionada({ ...compSeleccionada, activa: nuevoEstado }); cargarCompetencias();
    };

    const eliminarCompetencia = async (id: number) => {
        if (!confirm("⚠️ ¿Eliminar todo el torneo?")) return;
        await supabase.from('competencias').delete().eq('id', id); cargarCompetencias();
    };

    const inscribirGimnasta = async () => {
        if (!formGimnastaId) return alert("Selecciona una niña");
        const existe = resultados.find(r => r.gimnasta_id == formGimnastaId);
        if(existe) return alert("Ya está inscrita en este torneo.");
        await supabase.from('resultados_usag').insert([{ competencia_id: compSeleccionada.id, gimnasta_id: formGimnastaId, nivel: formNivel, puntaje_salto: 0, puntaje_barras: 0, puntaje_viga: 0, puntaje_piso: 0, all_around: 0 }]);
        setMostrarModalGimnasta(false); setFormGimnastaId(""); cargarResultados(compSeleccionada.id);
    };

    const eliminarResultado = async (id: number) => {
        if (!confirm("¿Retirar a esta gimnasta?")) return;
        await supabase.from('resultados_usag').delete().eq('id', id); cargarResultados(compSeleccionada.id);
    };

    const iniciarEdicion = (id: number, campo: string, valorActual: number) => {
        setEditandoCelda({ id, campo }); setValorTemporal(valorActual === 0 ? "" : valorActual.toString());
    };

    const guardarCelda = async (filaOriginal: any) => {
        if (!editandoCelda) return;
        const nuevoValorNum = Number(valorTemporal) || 0;
        const nuevoAA = (
            (editandoCelda.campo === 'puntaje_salto' ? nuevoValorNum : filaOriginal.puntaje_salto) +
            (editandoCelda.campo === 'puntaje_barras' ? nuevoValorNum : filaOriginal.puntaje_barras) +
            (editandoCelda.campo === 'puntaje_viga' ? nuevoValorNum : filaOriginal.puntaje_viga) +
            (editandoCelda.campo === 'puntaje_piso' ? nuevoValorNum : filaOriginal.puntaje_piso)
        ).toFixed(2);

        const resultadosActualizados = resultados.map(r => r.id === filaOriginal.id ? { ...r, [editandoCelda.campo]: nuevoValorNum, all_around: Number(nuevoAA) } : r).sort((a, b) => b.all_around - a.all_around);
        setResultados(resultadosActualizados); setEditandoCelda(null);
        await supabase.from('resultados_usag').update({ [editandoCelda.campo]: nuevoValorNum, all_around: Number(nuevoAA) }).eq('id', filaOriginal.id);
    };

    const renderPodio = () => {
        const top4 = resultados.filter(r => r.nivel === nivelFiltro).slice(0, 4);
        if (top4.length === 0) return null;
        const podioVisual = [top4[1] || null, top4[0] || null, top4[2] || null, top4[3] || null];

        return (
            <div className="flex justify-center items-end gap-1 md:gap-4 mt-8 mb-4 h-64 relative px-2">
                {podioVisual.map((gimnasta, index) => {
                    if (!gimnasta) return <div key={`empty-${index}`} className="w-16 md:w-32 opacity-0"></div>;
                    let bg, altura, lugar, colorTexto;
                    if (index === 1) { bg = "bg-gradient-to-t from-yellow-700 via-yellow-500 to-yellow-400"; altura = "h-48"; lugar = "1°"; colorTexto = "text-yellow-400"; }
                    else if (index === 0) { bg = "bg-gradient-to-t from-zinc-500 via-zinc-400 to-zinc-300"; altura = "h-36"; lugar = "2°"; colorTexto = "text-zinc-300"; }
                    else if (index === 2) { bg = "bg-gradient-to-t from-orange-800 via-orange-600 to-orange-500"; altura = "h-28"; lugar = "3°"; colorTexto = "text-orange-400"; }
                    else { bg = "bg-gradient-to-t from-cyan-900 via-cyan-700 to-cyan-500"; altura = "h-20"; lugar = "4°"; colorTexto = "text-cyan-400"; }

                    return (
                        <div key={gimnasta.id} className="flex flex-col items-center group animate-in slide-in-from-bottom-8 duration-500 w-20 md:w-32">
                            <p className="text-[9px] md:text-[10px] font-black uppercase text-white mb-1 truncate w-full text-center px-1">{gimnasta.gimnastas?.nombre.split(' ')[0]}</p>
                            <p className={`text-[9px] font-black mb-2 bg-black/50 px-2 py-0.5 rounded-full ${colorTexto}`}>{gimnasta.all_around}</p>
                            <div className={`w-full ${altura} ${bg} rounded-t-lg md:rounded-t-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border-t border-white/40 flex items-start justify-center pt-4 relative overflow-hidden transition-transform hover:scale-105`}>
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                                <span className="text-2xl md:text-3xl font-black text-black/30 relative z-10 drop-shadow-md">{lugar}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const nivelesActivos = Array.from(new Set(resultados.map(r => r.nivel)));
    // Si es profe, solo ve los torneos activos. Si es admin, ve todos.
    const torneosAMostrar = esAdmin ? competencias : competencias.filter(c => c.activa);

    return (
        <div className="space-y-6 relative">
            {vista === 'lista' && (
                <div className="animate-in fade-in duration-500 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/80 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-2xl gap-4">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3"><Trophy size={28} className="text-yellow-500" /> Eventos USAG</h2>
                        </div>
                        {esAdmin && (
                            <button onClick={() => setMostrarModalNueva(true)} className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform">
                                + Crear Torneo
                            </button>
                        )}
                    </div>

                    {torneosAMostrar.length === 0 && !esAdmin && (
                        <div className="bg-zinc-900/60 p-8 rounded-[2rem] text-center"><p className="text-zinc-500 font-bold uppercase text-xs">No hay torneos habilitados para calificar en este momento.</p></div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {torneosAMostrar.map(comp => (
                            <div key={comp.id} onClick={() => { setCompSeleccionada(comp); cargarResultados(comp.id); setVista('gestion'); }} className="group bg-zinc-900/60 p-6 rounded-[2rem] border border-white/5 hover:border-yellow-500/30 transition-all cursor-pointer text-left shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold uppercase text-white leading-tight pr-4">{comp.nombre}</h3>
                                    {esAdmin && <button onClick={(e) => { e.stopPropagation(); eliminarCompetencia(comp.id); }} className="text-zinc-600 hover:text-red-500 transition-colors p-2 z-20"><Trash2 size={16} /></button>}
                                </div>
                                <div className="space-y-2 mb-6 text-[10px] text-zinc-400 font-bold uppercase">
                                    <p className="flex items-center gap-2"><Calendar size={12} className="text-yellow-600"/> {new Date(comp.fecha).toLocaleDateString()}</p>
                                    {comp.lugar && <p className="flex items-center gap-2"><MapPin size={12} className="text-yellow-600"/> {comp.lugar}</p>}
                                </div>
                                <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-4">
                                    {esAdmin ? (
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${comp.activa ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>{comp.activa ? 'Visible Profes' : 'Oculto'}</span>
                                    ) : (
                                        <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500">Torneo Abierto</span>
                                    )}
                                    <span className="text-yellow-500 text-xs"><ArrowRight size={16} /></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {vista === 'gestion' && compSeleccionada && (
                <div className="animate-in slide-in-from-right-8 duration-500 space-y-6 text-left">
                    <button onClick={() => setVista('lista')} className="text-[10px] text-zinc-500 hover:text-white uppercase font-black flex items-center gap-2 transition-colors"><ChevronLeft size={16} /> Volver a Torneos</button>
                    <div className="bg-zinc-900/80 p-6 md:p-8 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black uppercase text-white mb-2">{compSeleccionada.nombre}</h2>
                            <p className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.2em]">{new Date(compSeleccionada.fecha).toLocaleDateString()} • {compSeleccionada.lugar}</p>
                        </div>
                        {esAdmin && (
                            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                <button onClick={toggleVisibilidadProfes} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${compSeleccionada.activa ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-zinc-500 border border-white/5 hover:text-white'}`}>
                                    {compSeleccionada.activa ? <><Eye size={14}/> Torneo Abierto</> : <><EyeOff size={14}/> Torneo Oculto</>}
                                </button>
                                <button onClick={() => setMostrarModalGimnasta(true)} className="bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95">
                                    <UserPlus size={14} /> Inscribir Niña
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-zinc-900/60 border border-white/5 rounded-[2rem] p-4 md:p-8">
                        <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                            {nivelesActivos.map(nivel => (
                                <button key={nivel as string} onClick={() => setNivelFiltro(nivel as string)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${nivelFiltro === nivel ? 'bg-yellow-600 text-white shadow-lg' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}>{nivel as string}</button>
                            ))}
                        </div>
                        {renderPodio()}
                        {nivelesActivos.length > 0 && (
                            <div className="mt-8 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-[9px] text-zinc-500 font-black uppercase tracking-widest">
                                            <th className="pb-4 pl-4">Gimnasta</th>
                                            <th className="pb-4 text-center"><span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">SA</span></th>
                                            <th className="pb-4 text-center"><span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">BA</span></th>
                                            <th className="pb-4 text-center"><span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">VI</span></th>
                                            <th className="pb-4 text-center"><span className="bg-rose-500/20 text-rose-400 px-2 py-1 rounded">PI</span></th>
                                            <th className="pb-4 text-center"><span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">AA</span></th>
                                            <th className="pb-4 text-right pr-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resultados.filter(r => r.nivel === nivelFiltro).map((r, i) => (
                                            <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                <td className="py-4 pl-4 font-bold text-[11px] md:text-xs uppercase text-white flex items-center gap-3">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : i === 1 ? 'bg-zinc-400/20 text-zinc-400' : i === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 text-zinc-500'}`}>{i + 1}</span>
                                                    {r.gimnastas?.nombre}
                                                </td>
                                                {['puntaje_salto', 'puntaje_barras', 'puntaje_viga', 'puntaje_piso'].map((campo) => (
                                                    <td key={campo} className="py-2 text-center">
                                                        {editandoCelda?.id === r.id && editandoCelda?.campo === campo ? (
                                                            <div className="flex items-center justify-center gap-1">
                                                                <input type="number" step="0.05" autoFocus value={valorTemporal} onChange={e => setValorTemporal(e.target.value)} onKeyDown={e => e.key === 'Enter' && guardarCelda(r)} className="w-14 bg-black border border-yellow-500 text-yellow-400 text-center font-bold text-xs p-1 rounded outline-none" />
                                                                <button onClick={() => guardarCelda(r)} className="text-green-400"><Check size={14}/></button>
                                                            </div>
                                                        ) : (
                                                            <div onClick={() => iniciarEdicion(r.id, campo, r[campo])} className="cursor-pointer font-bold text-xs text-zinc-300 hover:text-white hover:bg-white/10 py-2 rounded transition-colors" title="Toca para calificar">
                                                                {r[campo].toFixed(2)}
                                                            </div>
                                                        )}
                                                    </td>
                                                ))}
                                                <td className="py-4 text-center font-black text-sm md:text-base text-yellow-400">{r.all_around.toFixed(2)}</td>
                                                <td className="py-4 text-right pr-4">
                                                    {esAdmin && <button onClick={() => eliminarResultado(r.id)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODALES DE CREACIÓN (SOLO ADMIN) */}
            {mostrarModalNueva && esAdmin && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[100] backdrop-blur-md">
                    <div className="bg-zinc-900 w-full max-w-sm rounded-[2rem] p-8 border border-white/10 relative">
                        <button onClick={() => setMostrarModalNueva(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20} /></button>
                        <h2 className="text-xl font-black uppercase text-white mb-6">Nuevo Torneo</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nombre (Ej. Copa USAG)" value={nombreComp} onChange={(e) => setNombreComp(e.target.value)} className="w-full bg-white/5 p-4 rounded-xl border border-white/10 text-white font-bold uppercase text-xs outline-none focus:border-yellow-500" />
                            <input type="date" value={fechaComp} onChange={(e) => setFechaComp(e.target.value)} className="w-full bg-white/5 p-4 rounded-xl border border-white/10 text-white font-bold uppercase text-xs outline-none focus:border-yellow-500" />
                            <input type="text" placeholder="Lugar (Opcional)" value={lugarComp} onChange={(e) => setLugarComp(e.target.value)} className="w-full bg-white/5 p-4 rounded-xl border border-white/10 text-white font-bold uppercase text-xs outline-none focus:border-yellow-500" />
                            <button onClick={guardarCompetencia} className="w-full bg-yellow-600 text-white py-4 rounded-xl font-black uppercase text-[10px]">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {mostrarModalGimnasta && esAdmin && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[100] backdrop-blur-md">
                    <div className="bg-zinc-900 w-full max-w-sm rounded-[2rem] p-8 border border-white/10 relative">
                        <button onClick={() => setMostrarModalGimnasta(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20} /></button>
                        <h2 className="text-xl font-black uppercase text-white mb-6">Inscribir Niña</h2>
                        <div className="space-y-4">
                            <select value={formGimnastaId} onChange={(e) => setFormGimnastaId(e.target.value)} className="w-full bg-zinc-950 p-4 rounded-xl border border-white/10 text-white font-bold uppercase text-xs outline-none focus:border-yellow-500">
                                <option value="">Seleccione una gimnasta...</option>
                                {estudiantes.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                            </select>
                            <select value={formNivel} onChange={(e) => setFormNivel(e.target.value)} className="w-full bg-zinc-950 p-4 rounded-xl border border-white/10 text-white font-bold uppercase text-xs outline-none focus:border-yellow-500">
                                {nivelesUSAG.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <button onClick={inscribirGimnasta} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-[10px]">Inscribir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}