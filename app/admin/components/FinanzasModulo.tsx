"use client";
import { useState, useMemo } from "react";
import { createClient } from '@supabase/supabase-js';
import { Wallet, Shirt, Trophy, Star, Package, MinusCircle, PlusCircle, TrendingUp, FileText, Landmark, ArrowRightLeft, Activity, Filter, XCircle, Search } from "lucide-react";

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

export default function FinanzasModulo({ 
    ingresosExtra = [], 
    gastosVarios = [], 
    pagos = [], 
    pagosProfes = [], 
    setModalAlerta, 
    cargarTodo 
}: any) {
    const [vistaPrincipal, setVistaPrincipal] = useState<'operativa' | 'flujo'>('flujo');
    const [tabCaja, setTabCaja] = useState<'ingreso' | 'egreso'>('egreso');
    
    // Estados para nuevos registros
    const [nuevoGastoMonto, setNuevoGastoMonto] = useState("");
    const [nuevoGastoConcepto, setNuevoGastoConcepto] = useState("");
    const [nuevoGastoCategoria, setNuevoGastoCategoria] = useState("Mantenimiento");
    const [nuevoIngresoMonto, setNuevoIngresoMonto] = useState("");
    const [nuevoIngresoNota, setNuevoIngresoNota] = useState("");
    const [nuevoIngresoCategoria, setNuevoIngresoCategoria] = useState("Uniforme");

    // ESTADOS PARA LOS FILTROS DEL LIBRO MAYOR (AHORA ES UN BUSCADOR UNIVERSAL)
    const [busqueda, setBusqueda] = useState(""); 
    const [filtroTipo, setFiltroTipo] = useState("Todos");

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

    // MOTOR MATEMÁTICO DE FLUJO
    const { historialFlujoCaja, capitalTotal } = useMemo(() => {
        const todasLasTransacciones = [
            ...pagos.map((p: any) => ({ id: `p_${p.id}`, fecha: p.created_at, monto: p.monto, tipo: 'ingreso', concepto: 'Mensualidad / Matrícula', detalle: p.gimnastas?.nombre || 'Alumna eliminada' })),
            ...ingresosExtra.map((i: any) => ({ id: `ie_${i.id}`, fecha: i.created_at, monto: i.monto, tipo: 'ingreso', concepto: i.categoria, detalle: i.nota || 'Abono Extra' })),
            ...gastosVarios.map((g: any) => ({ id: `g_${g.id}`, fecha: g.created_at, monto: g.monto, tipo: 'egreso', concepto: g.categoria, detalle: g.concepto })),
            ...pagosProfes.map((p: any) => ({ id: `pp_${p.id}`, fecha: p.created_at || p.fecha_pago, monto: p.monto, tipo: 'egreso', concepto: 'Nómina Staff', detalle: `Liquidación a ${p.profesor}` }))
        ];

        // Orden cronológico (del más viejo al más nuevo para calcular el saldo)
        todasLasTransacciones.sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        let saldoAcumulado = 0;
        const historialConSaldo = todasLasTransacciones.map((t: any) => {
            saldoAcumulado += t.tipo === 'ingreso' ? t.monto : -t.monto;
            return { ...t, saldo: saldoAcumulado };
        });

        const saldoFinal = saldoAcumulado; // El dinero real que hay hoy

        // Invertimos para que el más reciente salga de primero
        let historialInvertido = historialConSaldo.reverse();

        // APLICAR FILTROS VISUALES (Busqueda universal de texto y tipo)
        if (busqueda || filtroTipo !== "Todos") {
            historialInvertido = historialInvertido.filter((t: any) => {
                let pasaBusqueda = true;
                let pasaTipo = true;

                if (busqueda) {
                    const textoFiltro = busqueda.toLowerCase();
                    const fechaAmigable = new Date(t.fecha).toLocaleDateString().toLowerCase();
                    pasaBusqueda = 
                        t.concepto.toLowerCase().includes(textoFiltro) || 
                        t.detalle.toLowerCase().includes(textoFiltro) ||
                        fechaAmigable.includes(textoFiltro);
                }
                if (filtroTipo !== "Todos") {
                    pasaTipo = t.tipo === filtroTipo;
                }
                
                return pasaBusqueda && pasaTipo;
            });
        }

        return { historialFlujoCaja: historialInvertido, capitalTotal: saldoFinal };
    }, [pagos, ingresosExtra, gastosVarios, pagosProfes, busqueda, filtroTipo]);

    return (
        <div className="text-left animate-in fade-in duration-500">
            
            <div className="flex bg-zinc-900/40 p-2 rounded-2xl mb-8 border border-white/5 shadow-inner w-full max-w-xl">
                <button onClick={() => setVistaPrincipal('flujo')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${vistaPrincipal === 'flujo' ? 'bg-cyan-600 text-white shadow-[0_5px_15px_rgba(6,182,212,0.3)]' : 'text-zinc-500 hover:text-white'}`}><Landmark size={16}/> Libro Mayor</button>
                <button onClick={() => setVistaPrincipal('operativa')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${vistaPrincipal === 'operativa' ? 'bg-cyan-600 text-white shadow-[0_5px_15px_rgba(6,182,212,0.3)]' : 'text-zinc-500 hover:text-white'}`}><Wallet size={16}/> Cajas Menores</button>
            </div>

            {vistaPrincipal === 'flujo' ? (
                <div className="bg-zinc-900/60 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/5 shadow-2xl animate-in slide-in-from-bottom-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/10 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3"><Activity className="text-cyan-400"/> Flujo de Caja Global</h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Historial del Dinero Real de la Escuela</p>
                        </div>
                        <div className="bg-black/40 px-6 py-4 rounded-2xl border border-white/5 text-right shadow-inner">
                            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Capital Actual Total</p>
                            <p className={`text-3xl font-black tracking-tighter ${capitalTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                ${capitalTotal.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* BARRA DE BÚSQUEDA UNIVERSAL */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 relative z-10 p-4 bg-zinc-950/50 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 text-zinc-500 shrink-0">
                            <Filter size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Filtros:</span>
                        </div>
                        
                        <div className="relative flex-1 w-full">
                            <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                            <input 
                                type="text" 
                                placeholder="Buscar alumna, concepto, fecha..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="bg-black border border-white/10 text-white text-xs font-bold uppercase pl-10 pr-4 py-3 rounded-xl outline-none focus:border-cyan-500 w-full placeholder-zinc-700"
                            />
                        </div>
                        
                        <select 
                            value={filtroTipo} 
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className="bg-black border border-white/10 text-white text-xs font-bold uppercase px-4 py-3 rounded-xl outline-none focus:border-cyan-500 flex-1 w-full cursor-pointer sm:max-w-[250px]"
                        >
                            <option value="Todos">Todas las transacciones</option>
                            <option value="ingreso">Solo Ingresos (+)</option>
                            <option value="egreso">Solo Egresos (-)</option>
                        </select>

                        {(busqueda || filtroTipo !== "Todos") && (
                            <button 
                                onClick={() => { setBusqueda(""); setFiltroTipo("Todos"); }}
                                className="flex items-center gap-2 text-[10px] font-black uppercase text-red-400 hover:text-red-300 transition-colors px-3 py-3 shrink-0"
                            >
                                <XCircle size={16} /> Limpiar
                            </button>
                        )}
                    </div>

                    <div className="bg-black/20 rounded-[2rem] border border-white/5 overflow-hidden relative z-10">
                        <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10">
                                    <tr className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] border-b border-white/5">
                                        <th className="p-6">Fecha y Hora</th>
                                        <th className="p-6">Transacción</th>
                                        <th className="p-6 text-right">Movimiento</th>
                                        <th className="p-6 text-right">Saldo de la Escuela</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {historialFlujoCaja.length === 0 ? (
                                        <tr><td colSpan={4} className="p-10 text-center text-zinc-600 text-xs font-black uppercase tracking-widest">No hay coincidencias con tu búsqueda</td></tr>
                                    ) : (
                                        historialFlujoCaja.map((t: any) => (
                                            <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-6">
                                                    <p className="text-xs font-black text-white">{new Date(t.fecha).toLocaleDateString()}</p>
                                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{new Date(t.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                </td>
                                                <td className="p-6">
                                                    <p className="text-xs font-black text-zinc-200 uppercase tracking-wider">{t.concepto}</p>
                                                    <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mt-1 truncate max-w-[250px]" title={t.detalle}>{t.detalle}</p>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <span className={`px-4 py-2 rounded-xl text-xs font-black tracking-tight border shadow-inner ${t.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {t.tipo === 'ingreso' ? '+' : '-'}$ {t.monto.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <p className={`text-base font-black tracking-tighter transition-all group-hover:scale-105 origin-right ${t.saldo >= 0 ? 'text-white' : 'text-red-400'}`}>
                                                        $ {t.saldo.toLocaleString()}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-right-4">
                    <div className="bg-zinc-900/60 backdrop-blur-2xl p-8 lg:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="mb-10 relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 border border-emerald-500/20"><Wallet size={24} /></div>
                                <div>
                                    <h2 className="text-xl font-black uppercase text-white tracking-tighter">Cajas Menores</h2>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Saldos por Categoría Operativa</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <CardCajaMenor titulo="Uniformes" valor={`$${cajaUniformes.toLocaleString()}`} icono={<Shirt />} colorTexto="text-purple-400" />
                                <CardCajaMenor titulo="Competencias" valor={`$${cajaCompetencias.toLocaleString()}`} icono={<Trophy />} colorTexto="text-yellow-400" />
                                <CardCajaMenor titulo="Clases Personales" valor={`$${cajaPersonalizadas.toLocaleString()}`} icono={<Star />} colorTexto="text-cyan-400" />
                                <CardCajaMenor titulo="Otros / Extras" valor={`$${cajaOtros.toLocaleString()}`} icono={<Package />} colorTexto="text-zinc-300" />
                            </div>
                        </div>

                        <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5 shadow-inner relative z-10">
                            <button onClick={() => setTabCaja('egreso')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${tabCaja === 'egreso' ? 'bg-red-500/20 text-red-400 shadow-lg border border-red-500/30' : 'text-zinc-600 hover:text-zinc-300'}`}><MinusCircle size={14}/> Salida (Gasto)</button>
                            <button onClick={() => setTabCaja('ingreso')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${tabCaja === 'ingreso' ? 'bg-emerald-500/20 text-emerald-400 shadow-lg border border-emerald-500/30' : 'text-zinc-600 hover:text-zinc-300'}`}><PlusCircle size={14}/> Ingreso Extra</button>
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
                                    <textarea rows={2} className="w-full bg-zinc-900/80 p-4 rounded-2xl border border-white/10 outline-none text-white focus:border-cyan-500 transition-all placeholder-zinc-700 text-xs font-bold uppercase resize-none shadow-inner" placeholder="Ej: Uniforme talla S..." value={nuevoIngresoNota} onChange={(e: any) => setNuevoIngresoNota(e.target.value)}></textarea>
                                </div>
                                <button onClick={registrarIngresoExtra} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-[0_10px_20px_rgba(34,197,94,0.2)] hover:scale-[1.02] active:scale-95 transition-all mt-4">Consignar a Caja</button>
                            </div>
                        )}
                    </div>

                    <div className="bg-zinc-900/60 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/5 max-h-[700px] overflow-y-auto shadow-2xl custom-scrollbar relative">
                        <div className="sticky top-0 bg-zinc-900/90 backdrop-blur-xl py-4 mb-6 z-10 border-b border-white/5">
                            <h2 className="text-[10px] font-black uppercase text-cyan-500 tracking-[0.3em] flex items-center justify-center gap-2"><ArrowRightLeft size={14}/> Historial de Extras y Menores</h2>
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
            )}
        </div>
    );
}