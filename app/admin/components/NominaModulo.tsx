"use client";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { BadgeDollarSign, Check, User, FileText } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const obtenerFechaColombia = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
};

const InputStyled = (props: any) => (
  <div className="text-left w-full">
    {props.label && <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">{props.label}</label>}
    <input 
      {...props} 
      className="w-full bg-zinc-950/50 p-4 rounded-2xl border border-white/10 outline-none text-white focus:border-cyan-500 transition-all focus:scale-[1.01] focus:bg-zinc-900/80 placeholder-zinc-700 text-xs font-bold uppercase shadow-inner" 
    />
  </div>
);

export default function NominaModulo({ listaProfesores, pagosProfes, todasAsistencias, estudiantes, setModalAlerta, setModalInteractivo, cargarTodo }: any) {
    const [nominaProfe, setNominaProfe] = useState(listaProfesores.length > 0 ? listaProfesores[0].nombre : "");
    const [nominaFechaInicio, setNominaFechaInicio] = useState("");
    const [nominaFechaFin, setNominaFechaFin] = useState("");
    const [nominaMetodo, setNominaMetodo] = useState("Nequi");
    const [clasesCalculadas, setClasesCalculadas] = useState(0);

    useEffect(() => {
        if (nominaProfe && nominaFechaInicio && nominaFechaFin) {
            const asistEnRango = todasAsistencias.filter((a:any) => a.fecha >= nominaFechaInicio && a.fecha <= nominaFechaFin);
            const asistProfe = asistEnRango.filter((a:any) => {
                let profeReal = a.profesor_turno;
                if (!profeReal || profeReal === 'admin') {
                    const alumna = estudiantes.find((e:any) => e.id === a.gimnasta_id);
                    profeReal = alumna?.profesor;
                }
                return profeReal === nominaProfe;
            });
            const diasUnicos = Array.from(new Set(asistProfe.map((a:any) => a.fecha))).length;
            setClasesCalculadas(diasUnicos);
        } else { 
            setClasesCalculadas(0); 
        }
    }, [nominaProfe, nominaFechaInicio, nominaFechaFin, todasAsistencias, estudiantes]);

    const registrarPagoNomina = async () => {
        const totalPagar = clasesCalculadas * 45000;
        if (totalPagar <= 0) return setModalAlerta({ titulo: "Sin Saldo", mensaje: "El valor a pagar no puede ser 0.", tipo: "error" });
        setModalInteractivo({
            abierto: true, tipo: 'confirmacion', titulo: 'Pago de Nómina', mensaje: `¿Confirmar pago de $${totalPagar.toLocaleString()} a ${nominaProfe} por ${clasesCalculadas} clases?`,
            accionConfirmar: async () => {
                await supabase.from("pagos_profesores").insert([{ profesor: nominaProfe, monto: totalPagar, clases_pagadas: clasesCalculadas, fecha_pago: obtenerFechaColombia(), metodo: nominaMetodo }]);
                setNominaFechaInicio(""); setNominaFechaFin(""); setClasesCalculadas(0); cargarTodo(); 
                setModalAlerta({ titulo: "Registrado", mensaje: "Nómina descontada.", tipo: "exito" });
            }
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 text-left">
            <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-500/20 mx-auto mb-4"><BadgeDollarSign size={28} /></div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Nómina Operativa</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Liquidación de Honorarios Staff</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-zinc-900/60 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
                    <h3 className="text-[10px] font-black uppercase text-cyan-500 tracking-[0.3em] mb-8 border-b border-white/5 pb-4">Parámetros de Liquidación</h3>
                    <div className="space-y-6">
                        <div className="text-left">
                            <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-2 tracking-widest">Profesor a Liquidar</label>
                            <select className="bg-zinc-950/80 p-5 rounded-2xl border border-white/10 outline-none text-white w-full text-xs font-black uppercase focus:border-cyan-500 shadow-inner" value={nominaProfe} onChange={(e: any) => setNominaProfe(e.target.value)}>{listaProfesores.map((p:any) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}</select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputStyled label="Corte Inicial" type="date" value={nominaFechaInicio} onChange={(e: any) => setNominaFechaInicio(e.target.value)} />
                            <InputStyled label="Corte Final" type="date" value={nominaFechaFin} onChange={(e: any) => setNominaFechaFin(e.target.value)} />
                        </div>
                        <div className="text-left">
                            <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-2 tracking-widest">Canal de Transferencia</label>
                            <select className="bg-zinc-950/80 p-5 rounded-2xl border border-white/10 outline-none text-white w-full text-xs font-black uppercase focus:border-cyan-500 shadow-inner" value={nominaMetodo} onChange={(e: any) => setNominaMetodo(e.target.value)}><option>Nequi</option><option>Bancolombia</option><option>Efectivo</option></select>
                        </div>
                        
                        <div className="bg-cyan-900/10 p-8 rounded-[2rem] border border-cyan-500/20 text-center mt-8 shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full"></div>
                            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.3em] mb-4">Días de Clase Auditados</p>
                            <input type="number" value={clasesCalculadas} onChange={(e: any) => setClasesCalculadas(Number(e.target.value))} className="w-full text-6xl font-black text-white bg-transparent border-b border-cyan-500/20 text-center outline-none focus:border-cyan-400 transition-colors pb-2 hover:bg-white/5 rounded-t-xl relative z-10" />
                            <p className="text-[8px] text-zinc-500 uppercase font-bold mt-3 tracking-widest relative z-10">Soporta modificación manual para turnos dobles</p>
                            
                            <div className="mt-6 bg-black/40 py-4 rounded-2xl border border-white/5 relative z-10">
                                <p className="text-[9px] text-zinc-400 uppercase font-black tracking-[0.2em] mb-1">Monto a Transferir</p>
                                <p className="text-2xl text-emerald-400 font-black tracking-tighter">${(clasesCalculadas * 45000).toLocaleString()}</p>
                            </div>
                        </div>
                        <button onClick={registrarPagoNomina} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.3em] text-[10px] shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 transition-all mt-4"><Check size={16} className="inline mr-2 -mt-0.5"/> APROBAR Y LIQUIDAR</button>
                    </div>
                </div>

                <div className="bg-zinc-900/60 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-y-auto max-h-[750px] custom-scrollbar">
                    <h3 className="text-[10px] font-black uppercase text-cyan-500 tracking-[0.3em] mb-8 border-b border-white/5 pb-4 flex items-center gap-2"><FileText size={14}/> Ledger de Pagos a Staff</h3>
                    <div className="space-y-4">
                        {pagosProfes.map((p:any) => (
                            <div key={p.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                                <div className="text-left flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center group-hover:text-cyan-400 group-hover:bg-cyan-950/50 transition-colors"><User size={16}/></div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-white tracking-widest">{p.profesor}</p>
                                        <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">{p.clases_pagadas} turnos • {new Date(p.fecha_pago).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-400 font-black text-lg tracking-tighter">${p.monto.toLocaleString()}</p>
                                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">{p.metodo}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}