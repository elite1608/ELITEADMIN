"use client";
import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Wallet, Shirt, Trophy, Star, Package, MinusCircle, PlusCircle, TrendingUp, FileText } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const InputStyled = (props: any) => (
  <div className="text-left w-full">
    {props.label && <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">{props.label}</label>}
    <input 
      {...props} 
      className="w-full bg-zinc-950/50 p-4 rounded-2xl border border-white/10 outline-none text-white focus:border-cyan-500 transition-all focus:scale-[1.01] focus:bg-zinc-900/80 placeholder-zinc-700 text-xs font-bold uppercase shadow-inner" 
    />
  </div>
);

const CardCajaMenor = ({ titulo, valor, icono, colorTexto }: any) => (
  <div className="bg-zinc-900/60 backdrop-blur-md p-5 rounded-3xl border border-white/5 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:bg-white/5 hover:border-white/10 hover:shadow-xl cursor-default group">
    <div>
      <p className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-1">{titulo}</p>
      <p className={`text-xl font-black ${colorTexto}`}>{valor}</p>
    </div>
    <div className={`text-2xl opacity-30 group-hover:opacity-100 transition-opacity duration-300 ${colorTexto}`}>{icono}</div>
  </div>
);

export default function FinanzasModulo({ ingresosExtra, gastosVarios, setModalAlerta, cargarTodo }: any) {
    const [tabCaja, setTabCaja] = useState<'ingreso' | 'egreso'>('egreso');
    const [nuevoGastoMonto, setNuevoGastoMonto] = useState("");
    const [nuevoGastoConcepto, setNuevoGastoConcepto] = useState("");
    const [nuevoGastoCategoria, setNuevoGastoCategoria] = useState("Mantenimiento");
    const [nuevoIngresoMonto, setNuevoIngresoMonto] = useState("");
    const [nuevoIngresoNota, setNuevoIngresoNota] = useState("");
    const [nuevoIngresoCategoria, setNuevoIngresoCategoria] = useState("Uniforme");

    const cajaUniformes = ingresosExtra.filter((i:any) => i.categoria === 'Uniforme').reduce((acc:any, i:any) => acc + i.monto, 0);
    const cajaCompetencias = ingresosExtra.filter((i:any) => i.categoria === 'Competencia').reduce((acc:any, i:any) => acc + i.monto, 0);
    const cajaPersonalizadas = ingresosExtra.filter((i:any) => i.categoria === 'Clase Personalizada').reduce((acc:any, i:any) => acc + i.monto, 0);
    const cajaOtros = ingresosExtra.filter((i:any) => i.categoria === 'Otros').reduce((acc:any, i:any) => acc + i.monto, 0);

    const registrarGasto = async () => {
        if (!nuevoGastoMonto || !nuevoGastoConcepto) return setModalAlerta({ titulo: "Faltan Datos", mensaje: "Monto y concepto obligatorios.", tipo: "error" });
        await supabase.from("gastos_varios").insert([{ monto: Number(nuevoGastoMonto), concepto: nuevoGastoConcepto, categoria: nuevoGastoCategoria }]);
        setNuevoGastoMonto(""); setNuevoGastoConcepto(""); cargarTodo(); 
        setModalAlerta({ titulo: "Registrado", mensaje: "Gasto descontado.", tipo: "exito" });
    };

    const registrarIngresoExtra = async () => {
        if (!nuevoIngresoMonto || !nuevoIngresoCategoria) return setModalAlerta({ titulo: "Faltan Datos", mensaje: "Monto y categoría obligatorios.", tipo: "error" });
        await supabase.from("ingresos_varios").insert([{ monto: Number(nuevoIngresoMonto), categoria: nuevoIngresoCategoria, nota: nuevoIngresoNota }]);
        setNuevoIngresoMonto(""); setNuevoIngresoNota(""); cargarTodo();
        setModalAlerta({ titulo: "Registrado", mensaje: "Ingreso sumado.", tipo: "exito" });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-left animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/60 backdrop-blur-2xl p-8 lg:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900/10 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="mb-10 relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 border border-emerald-500/20"><Wallet size={24} /></div>
                        <div>
                            <h2 className="text-xl font-black uppercase text-white tracking-tighter">Cajas Menores</h2>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Saldos por Categoría</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <CardCajaMenor titulo="Uniformes" valor={`$${cajaUniformes.toLocaleString()}`} icono={<Shirt />} colorTexto="text-purple-400" />
                        <CardCajaMenor titulo="Competencias" valor={`$${cajaCompetencias.toLocaleString()}`} icono={<Trophy />} colorTexto="text-yellow-400" />
                        <CardCajaMenor titulo="Clases Personalizadas" valor={`$${cajaPersonalizadas.toLocaleString()}`} icono={<Star />} colorTexto="text-cyan-400" />
                        <CardCajaMenor titulo="Otros / Extras" valor={`$${cajaOtros.toLocaleString()}`} icono={<Package />} colorTexto="text-zinc-300" />
                    </div>
                </div>

                <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5 shadow-inner relative z-10">
                    <button onClick={() => setTabCaja('egreso')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${tabCaja === 'egreso' ? 'bg-red-500/20 text-red-400 shadow-lg border border-red-500/30' : 'text-zinc-600 hover:text-zinc-300'}`}><MinusCircle size={14}/> Salida</button>
                    <button onClick={() => setTabCaja('ingreso')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${tabCaja === 'ingreso' ? 'bg-emerald-500/20 text-emerald-400 shadow-lg border border-emerald-500/30' : 'text-zinc-600 hover:text-zinc-300'}`}><PlusCircle size={14}/> Ingreso</button>
                </div>

                {tabCaja === 'egreso' ? (
                    <div className="space-y-5 animate-in slide-in-from-left-4 relative z-10 bg-black/20 p-8 rounded-[2rem] border border-white/5">
                        <InputStyled label="Monto a descontar" type="number" placeholder="$ 0" value={nuevoGastoMonto} onChange={(e: any) => setNuevoGastoMonto(e.target.value)} />
                        <InputStyled label="Concepto / Factura" type="text" placeholder="Ej: Pago de Luz Mantenimiento..." value={nuevoGastoConcepto} onChange={(e: any) => setNuevoGastoConcepto(e.target.value)} />
                        <div className="text-left">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 block">Categoría de Gasto</label>
                            <select className="w-full bg-zinc-900/80 p-4 rounded-2xl border border-white/10 outline-none text-white text-[10px] font-black uppercase focus:border-cyan-500 transition-colors shadow-inner" value={nuevoGastoCategoria} onChange={(e: any) => setNuevoGastoCategoria(e.target.value)}><option>Arriendo</option><option>Servicios</option><option>Mantenimiento</option><option>Implementos</option><option>Otros</option></select>
                        </div>
                        <button onClick={registrarGasto} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-[0_10px_20px_rgba(239,68,68,0.2)] hover:scale-[1.02] active:scale-95 transition-all mt-4">Procesar Egreso de Caja</button>
                    </div>
                ) : (
                    <div className="space-y-5 animate-in slide-in-from-right-4 relative z-10 bg-black/20 p-8 rounded-[2rem] border border-white/5">
                        <InputStyled label="Monto a sumar" type="number" placeholder="$ 0" value={nuevoIngresoMonto} onChange={(e: any) => setNuevoIngresoMonto(e.target.value)} />
                        <div className="text-left">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 block">Destino del Dinero</label>
                            <select className="w-full bg-zinc-900/80 p-4 rounded-2xl border border-white/10 outline-none text-white text-[10px] font-black uppercase focus:border-cyan-500 transition-colors shadow-inner" value={nuevoIngresoCategoria} onChange={(e: any) => setNuevoIngresoCategoria(e.target.value)}><option>Uniforme</option><option>Competencia</option><option>Clase Personalizada</option><option>Otros</option></select>
                        </div>
                        <div className="text-left">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 block">Nota / Alumna (Opcional)</label>
                            <textarea rows={2} className="w-full bg-zinc-900/80 p-4 rounded-2xl border border-white/10 outline-none text-white focus:border-cyan-500 transition-all placeholder-zinc-700 text-xs font-bold uppercase resize-none shadow-inner" placeholder="Ej: Uniforme talla S..." value={nuevoIngresoNota} onChange={(e) => setNuevoIngresoNota(e.target.value)}></textarea>
                        </div>
                        <button onClick={registrarIngresoExtra} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-[0_10px_20px_rgba(34,197,94,0.2)] hover:scale-[1.02] active:scale-95 transition-all mt-4">Consignar a Caja</button>
                    </div>
                )}
            </div>

            <div className="bg-zinc-900/60 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/5 max-h-[700px] overflow-y-auto shadow-2xl custom-scrollbar relative">
                <div className="sticky top-0 bg-zinc-900/90 backdrop-blur-xl py-4 mb-6 z-10 border-b border-white/5">
                    <h2 className="text-[10px] font-black uppercase text-cyan-500 tracking-[0.3em] flex items-center justify-center gap-2"><FileText size={14}/> Historial de Movimientos</h2>
                </div>
                <div className="space-y-3">
                    {ingresosExtra.map((i:any) => (
                        <div key={i.id} className="flex justify-between items-center p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 group hover:bg-emerald-500/10 transition-colors">
                            <div className="text-left flex items-start gap-3">
                                <div className="mt-0.5 text-emerald-500/50"><TrendingUp size={16}/></div>
                                <div>
                                    <p className="font-black text-xs uppercase leading-tight text-white">{i.categoria}</p>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{new Date(i.created_at).toLocaleDateString()}</p>
                                    {i.nota && <p className="text-[8px] text-emerald-400/60 mt-1.5 uppercase leading-tight tracking-wider">{i.nota}</p>}
                                </div>
                            </div>
                            <span className="text-emerald-400 font-black text-sm drop-shadow-md">+$ {i.monto.toLocaleString()}</span>
                        </div>
                    ))}
                    {gastosVarios.map((g:any) => (
                        <div key={g.id} className="flex justify-between items-center p-5 bg-red-500/5 rounded-2xl border border-red-500/10 group hover:bg-red-500/10 transition-colors">
                            <div className="text-left flex items-start gap-3">
                                <div className="mt-0.5 text-red-500/50"><MinusCircle size={16}/></div>
                                <div>
                                    <p className="font-black text-xs uppercase leading-tight text-white">{g.concepto}</p>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{new Date(g.created_at).toLocaleDateString()} • {g.categoria}</p>
                                </div>
                            </div>
                            <span className="text-red-400 font-black text-sm drop-shadow-md">-$ {g.monto.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}