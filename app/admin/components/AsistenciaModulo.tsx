"use client";
import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { CalendarCheck, ChevronLeft, ChevronRight, Check, PlusCircle, User } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const obtenerNombreDia = (fechaStr: string) => {
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const d = new Date(fechaStr + "T12:00:00");
    return dias[d.getDay()];
};

const obtenerFechaColombia = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
};

export default function AsistenciaModulo({ 
    estudiantes, 
    todasAsistencias, 
    listaProfesores, 
    fechaAdmin, 
    setFechaAdmin, 
    cargarTodo 
}: any) {
    const [filtroProfeAsistencia, setFiltroProfeAsistencia] = useState("Todos");

    const diaVisualizacion = obtenerNombreDia(fechaAdmin);

    const cambiarDiaAdmin = (dias: number) => {
        const current = new Date(fechaAdmin + "T12:00:00");
        current.setDate(current.getDate() + dias);
        setFechaAdmin(current.toLocaleDateString('en-CA'));
    };

    const toggleAsistencia = async (gimnastaId: number) => {
        const asistido = todasAsistencias.find((a:any) => a.gimnasta_id === gimnastaId && a.fecha === fechaAdmin);
        
        if (asistido) { 
            await supabase.from("asistencias").delete().match({ id: asistido.id }); 
        } else { 
            const alumna = estudiantes.find((e:any) => e.id === gimnastaId);
            const profeResponsable = alumna?.profesor || 'admin';
            await supabase.from("asistencias").insert({ gimnasta_id: gimnastaId, fecha: fechaAdmin, presente: true, profesor_turno: profeResponsable }); 
        }
        cargarTodo();
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-left">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 bg-zinc-900/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-inner"><CalendarCheck size={28}/></div>
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-1 text-white">{diaVisualizacion}</h2>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Auditoría Maestra</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="w-full sm:w-auto flex-1">
                        <label className="text-[8px] font-black text-cyan-500 uppercase tracking-widest block mb-1.5 ml-1">Filtro de Staff</label>
                        <select value={filtroProfeAsistencia} onChange={e => setFiltroProfeAsistencia(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white text-[10px] font-black uppercase px-6 py-4 rounded-xl outline-none focus:border-cyan-500 cursor-pointer shadow-inner hover:bg-black/60 transition-colors">
                            <option value="Todos">👥 Visualizar a Todo el Equipo</option>
                            {listaProfesores.map((p:any) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                        </select>
                    </div>

                    <div className="w-full sm:w-auto">
                        <label className="text-[8px] font-black text-cyan-500 uppercase tracking-widest block mb-1.5 ml-1 text-center">Navegación Temporal</label>
                        <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-xl border border-white/10 shadow-inner">
                            <button onClick={() => cambiarDiaAdmin(-1)} className="p-3 bg-white/5 hover:bg-white/10 hover:text-cyan-400 rounded-lg transition-all active:scale-90 text-zinc-400"><ChevronLeft size={18}/></button>
                            <div className="text-center px-4 min-w-[140px]">
                                <span className="text-xs font-black text-white tracking-[0.1em]">{new Date(fechaAdmin + "T12:00:00").toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric'}).replace('.', '')}</span>
                            </div>
                            <button onClick={() => cambiarDiaAdmin(1)} className="p-3 bg-white/5 hover:bg-white/10 hover:text-cyan-400 rounded-lg transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed text-zinc-400" disabled={fechaAdmin >= obtenerFechaColombia()}><ChevronRight size={18}/></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(() => {
                  const estudiantesFiltrados = estudiantes.filter((e:any) => 
                      (e.dias || []).includes(diaVisualizacion) && 
                      (filtroProfeAsistencia === "Todos" || e.profesor === filtroProfeAsistencia)
                  );

                  if (estudiantesFiltrados.length === 0) {
                      return (
                          <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-[2.5rem] bg-white/5 backdrop-blur-md">
                              <CalendarCheck size={48} className="mx-auto mb-4 text-zinc-600 opacity-50" />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Cero actividad registrada para este filtro y fecha.</p>
                          </div>
                      );
                  }

                  return estudiantesFiltrados.map((e:any) => {
                    const asistido = todasAsistencias.some((a:any) => a.gimnasta_id === e.id && a.fecha === fechaAdmin);
                    return (
                      <div key={e.id} className={`p-6 rounded-[1.5rem] border flex justify-between items-center backdrop-blur-xl transition-all duration-300 group hover:-translate-y-1 ${asistido ? 'bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border-cyan-500/50 shadow-[0_10px_30px_rgba(6,182,212,0.15)] scale-[1.02]' : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-800/80 hover:border-white/10'}`}>
                        <div className="text-left overflow-hidden pr-2">
                            <p className="font-black text-sm uppercase leading-tight truncate text-white">{e.nombre}</p>
                            <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1.5 flex items-center gap-1.5"><User size={10} className={asistido ? "text-cyan-500" : ""}/> {e.profesor}</p>
                        </div>
                        <button onClick={() => toggleAsistencia(e.id)} className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-75 ${asistido ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] rotate-0' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white border border-white/5 rotate-90 group-hover:rotate-0'}`}>
                            {asistido ? <Check size={20} strokeWidth={4}/> : <PlusCircle size={20} />}
                        </button>
                      </div>
                    );
                  });
              })()}
            </div>
        </div>
    );
}