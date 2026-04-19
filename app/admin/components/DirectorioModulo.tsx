"use client";
import { useState } from "react";
import { Users, ShieldAlert, User, Phone, CheckCircle2 } from "lucide-react";

const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function DirectorioModulo({ 
    estudiantes, 
    filtroDeudores, 
    setFiltroDeudores, 
    setPerfilSeleccionado 
}: any) {
    const [busqueda, setBusqueda] = useState("");
    const [mesSeleccionadoFiltro, setMesSeleccionadoFiltro] = useState(nombresMeses[new Date().getMonth()]);

    // Función de cálculo aislada para este módulo
    const calcularMora = (gimnasta: any) => {
        const hoy = new Date();
        const venc = new Date(gimnasta.proximo_vencimiento);
        if (venc >= hoy) return { meses: 0, nombres: [], deudaTotal: 0, precioIndividual: 0 };
        
        let mesesMora: string[] = [];
        let temp = new Date(venc);
        let mesIndice = temp.getMonth();
        
        while (temp < hoy) {
            mesesMora.push(nombresMeses[mesIndice % 12]);
            mesIndice++;
            temp.setDate(temp.getDate() + 30);
        }
        
        let precioPlan = gimnasta.paquetes?.precio || 0;
        if (gimnasta.es_hermana) precioPlan = precioPlan / 2;

        return { 
            meses: mesesMora.length, 
            nombres: mesesMora, 
            deudaTotal: mesesMora.length * precioPlan,
            precioIndividual: precioPlan
        };
    };

    const enviarRecordatorioMora = (gimnastaPrincipal: any, moraPrincipal: any) => {
        let numeroLimpio = gimnastaPrincipal.telefono_acudiente?.replace(/\D/g, '') || "";
        if (numeroLimpio.length === 10) numeroLimpio = '57' + numeroLimpio;
        if (!numeroLimpio) return alert("La alumna no tiene teléfono registrado.");

        let mensajeFinal = "";

        if (gimnastaPrincipal.grupo_familiar) {
            const hermanas = estudiantes.filter((e: any) => e.grupo_familiar?.toLowerCase() === gimnastaPrincipal.grupo_familiar.toLowerCase());
            let totalDeuda = 0;
            let desgloseTextos: string[] = [];
            let mesesPendientesSet = new Set<string>();

            hermanas.forEach((h: any) => {
                const moraH = calcularMora(h);
                if (moraH.meses > 0) {
                    totalDeuda += moraH.deudaTotal;
                    moraH.nombres.forEach((m: string) => mesesPendientesSet.add(m));
                    const precioMensual = h.es_hermana ? ((h.paquetes?.precio || 0) / 2) : (h.paquetes?.precio || 0);
                    const deudaNina = moraH.meses * precioMensual;
                    desgloseTextos.push(`$${deudaNina.toLocaleString()} para ${h.nombre}${h.es_hermana ? ' con 50% de descuento' : ''}`);
                }
            });

            if (totalDeuda === 0) return alert("Este grupo familiar está al día.");
            const mesesTexto = Array.from(mesesPendientesSet).join(", ");
            const textoDivididos = desgloseTextos.join(" y ");

            mensajeFinal = `¡Hola! Un saludo especial de Elite Gymnastics.\n\nCompartimos la información de las ${gimnastaPrincipal.grupo_familiar}, tienen pendiente el pago de la mensualidad del mes de ${mesesTexto} por un valor de $${totalDeuda.toLocaleString()}. Divididos en ${textoDivididos}.\n\nQuedamos atentos a cualquier inquietud.\n\nFeliz día`;

        } else {
            if (moraPrincipal.meses === 0) return alert("La alumna está al día.");
            mensajeFinal = `Hola! Un saludo especial de Elite Gymnastics.\n\nCompartimos la información de que ${gimnastaPrincipal.nombre.toUpperCase()} hasta la fecha presenta un saldo pendiente de $${moraPrincipal.deudaTotal.toLocaleString()} correspondiente a los meses de: ${moraPrincipal.nombres.join(", ")} que va en curso.\n\nQuedamos atentos a cualquier inquietud.\n\nFeliz día`;
        }

        window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensajeFinal)}`, '_blank');
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Users className="text-cyan-500"/> Directorio Oficial</h2>
                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Base de Datos de Alumnas</p>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        {filtroDeudores && <select className="text-[10px] bg-red-950/50 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl uppercase font-black outline-none shadow-inner" value={mesSeleccionadoFiltro} onChange={(e) => setMesSeleccionadoFiltro(e.target.value)}>{nombresMeses.map(m => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}</select>}
                        <button onClick={() => setFiltroDeudores(!filtroDeudores)} className={`text-[10px] px-6 py-3 rounded-xl uppercase font-black tracking-widest transition-all shadow-lg flex items-center gap-2 ${filtroDeudores ? 'bg-cyan-600 text-white shadow-cyan-900/40 hover:scale-105 active:scale-95' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'}`}>
                            {filtroDeudores ? <><Users size={14}/> Ver Todo el Staff</> : <><ShieldAlert size={14}/> Filtrar Mora</>}
                        </button>
                    </div>
                </div>
                <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                    <input type="text" placeholder="Buscar alumna por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full bg-zinc-900/60 pl-12 pr-4 py-5 rounded-2xl border border-white/10 outline-none text-white font-bold uppercase text-xs focus:border-cyan-500 transition-all shadow-inner backdrop-blur-sm"/>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {estudiantes.filter((e: any) => {
                    const mora = calcularMora(e); 
                    const coincideMes = filtroDeudores ? mora.nombres.includes(mesSeleccionadoFiltro) : true; 
                    const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
                    return coincideMes && coincideBusqueda;
                }).map((e: any) => {
                    const mora = calcularMora(e);
                    return (
                        <div key={e.id} onClick={() => setPerfilSeleccionado(e)} className={`p-5 backdrop-blur-xl border rounded-[1.5rem] flex items-center gap-5 cursor-pointer hover:-translate-y-1 hover:shadow-xl active:scale-95 transition-all duration-300 text-left group ${mora.meses > 0 ? 'bg-red-950/20 border-red-500/30 hover:bg-red-900/30 hover:border-red-500/50' : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-800/80 hover:border-cyan-500/30'}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner overflow-hidden shrink-0 ${mora.meses > 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-zinc-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors'}`}>
                                {e.foto_url ? (
                                    <img src={e.foto_url} alt={e.nombre} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20}/>
                                )}
                            </div>
                            <div className="text-left overflow-hidden flex-1">
                                <p className="font-black text-sm uppercase leading-tight mb-1 truncate group-hover:text-white transition-colors">
                                    {e.nombre} 
                                    {e.grupo_familiar && <span className="block text-[8px] text-cyan-500 tracking-widest mt-0.5">{e.grupo_familiar}</span>}
                                </p>
                                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em]">
                                    {filtroDeudores 
                                        ? <span className="text-red-400">DEBE {mesSeleccionadoFiltro}: ${mora.precioIndividual.toLocaleString()}</span> 
                                        : (mora.meses > 0 ? <span className="text-red-400">DEBE ${mora.deudaTotal.toLocaleString()}</span> : <span className="text-emerald-500">AL DÍA</span>)}
                                </p>
                            </div>
                            
                            {filtroDeudores && (
                                <button 
                                    onClick={(btnEvent) => {
                                        btnEvent.stopPropagation(); 
                                        enviarRecordatorioMora(e, mora);
                                    }} 
                                    className="bg-green-600/20 hover:bg-green-500 text-green-500 hover:text-white p-3 rounded-xl transition-all shadow-sm border border-green-500/30 hover:border-transparent" 
                                    title="Enviar cobro unificado por WhatsApp"
                                >
                                    <Phone size={16}/>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            {estudiantes.filter((e: any) => filtroDeudores && calcularMora(e).nombres.includes(mesSeleccionadoFiltro)).length === 0 && filtroDeudores && (
                <div className="text-center py-24 opacity-40 border border-dashed border-white/10 rounded-[2rem] bg-white/5">
                    <CheckCircle2 size={64} className="mx-auto mb-4 text-green-500" />
                    <p className="font-black uppercase tracking-[0.3em] text-[10px]">Staff al día. Cero deudas.</p>
                </div>
            )}
        </div>
    );
}