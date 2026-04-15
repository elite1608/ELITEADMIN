import { Activity, Users, DollarSign, TrendingUp, CheckCircle2, User, ArrowRight, Cake } from "lucide-react";

// Traemos tu componente CardDato para que viva junto al Dashboard
const CardDato = ({ titulo, valor, color, icono, onClick }: any) => (
  <div onClick={onClick} className={`bg-zinc-900/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl text-left group transition-all duration-500 hover:-translate-y-2 hover:shadow-cyan-900/20 hover:border-cyan-500/30 hover:bg-zinc-800/60 ${onClick ? 'cursor-pointer active:scale-95' : ''}`}>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-all duration-500 rotate-12 text-zinc-100 [&>svg]:w-32 [&>svg]:h-32">{icono}</div>
      <h3 className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.25em] mb-2 group-hover:text-cyan-400 transition-colors">{titulo}</h3>
      <p className={`text-3xl font-black tracking-tighter ${color} drop-shadow-md group-hover:scale-105 transition-transform origin-left`}>{valor}</p>
      {onClick && <p className="text-[8px] text-zinc-500 mt-3 uppercase font-black tracking-widest flex items-center gap-1 group-hover:text-cyan-400 transition-colors">Ver análisis <ArrowRight size={10} className="group-hover:translate-x-2 transition-transform" /></p>}
  </div>
);

export default function Dashboard({ 
  estudiantes, 
  balanceReal, 
  calcularDeudaTotalDashboard, 
  proyeccionMensual,
  setFiltroDeudores,
  setVistaActual,
  mesReporteDashboard,
  setMesReporteDashboard,
  nombresMeses,
  ingresosMesSeleccionado,
  deudorasMesSeleccionado
}: any) {
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-500/20"><Activity size={24} /></div>
          <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Panel de Control</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Vista General de Operaciones</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <CardDato titulo="Gimnastas Activas" valor={estudiantes.length} color="text-white" icono={<Users />} />
          <CardDato titulo="Caja Real (Operativa)" valor={`$${balanceReal.toLocaleString()}`} color={balanceReal >= 0 ? 'text-emerald-400' : 'text-red-400'} icono={<DollarSign />} />
          <CardDato onClick={() => {setFiltroDeudores(true); setVistaActual('directorio')}} titulo="Deuda Acumulada" valor={`$${calcularDeudaTotalDashboard().toLocaleString()}`} color="text-rose-500" icono={<TrendingUp />} />
          <CardDato titulo="Ingreso Proyectado" valor={`$${proyeccionMensual.toLocaleString()}`} color="text-cyan-400" icono={<CheckCircle2 />} />
      </div>

      <div className="mt-10 animate-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
              <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-white">Reporte Financiero</h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Desglose por mes de facturación</p>
              </div>
              <select className="bg-zinc-900 border border-white/10 text-cyan-400 text-xs font-black uppercase px-6 py-3 rounded-xl outline-none focus:border-cyan-500 cursor-pointer shadow-lg hover:bg-zinc-800 transition-colors w-full sm:w-auto" value={mesReporteDashboard} onChange={(e) => setMesReporteDashboard(e.target.value)}>
                  {nombresMeses.map((m: string) => <option key={m} value={m}>{m}</option>)}
              </select>
          </div>
          
          <div className="bg-zinc-900/60 backdrop-blur-2xl p-8 lg:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col lg:flex-row gap-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-900/10 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/5 pb-8 lg:pb-0 lg:pr-10 flex flex-col justify-center relative z-10">
                  <div className="mb-8 p-6 bg-green-950/20 rounded-3xl border border-green-500/10">
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span> Recaudado en {mesReporteDashboard}</p>
                      <p className="text-5xl font-black text-green-400 tracking-tighter">${ingresosMesSeleccionado.toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-red-950/10 rounded-3xl border border-red-500/10">
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span> Dinero en Mora</p>
                      <p className="text-3xl font-bold text-red-400 tracking-tight">-${(deudorasMesSeleccionado.reduce((sum: number, d: any) => { let p = d.paquetes?.precio || 0; return sum + (d.es_hermana ? p/2 : p); }, 0)).toLocaleString()}</p>
                      <p className="text-[9px] font-black text-red-500/50 uppercase mt-2">{deudorasMesSeleccionado.length} alumnas pendientes</p>
                  </div>
              </div>
              
              <div className="flex-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-4 flex flex-col relative z-10">
                  <p className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.2em] mb-4 sticky top-0 bg-zinc-900/90 py-2 z-10 backdrop-blur-md">Estado de Deudoras</p>
                  {deudorasMesSeleccionado.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/5 p-10 text-center">
                          <CheckCircle2 size={48} className="mb-4 text-green-500 opacity-50" />
                          <p className="text-xs text-zinc-400 font-black uppercase tracking-widest">Mora Cero este mes</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {deudorasMesSeleccionado.map((d: any) => (
                              <div key={d.id} className="flex justify-between items-center bg-red-500/5 p-4 rounded-2xl border border-red-500/20 hover:bg-red-500/10 transition-colors group">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-sm font-black shadow-inner shadow-red-500/20 overflow-hidden shrink-0">
                                          {d.foto_url ? (
                                              <img src={d.foto_url} alt={d.nombre} className="w-full h-full object-cover" />
                                          ) : (
                                              <User size={16}/>
                                          )}
                                      </div>
                                      <span className="text-xs font-bold text-white uppercase tracking-wider">{d.nombre}</span>
                                  </div>
                                  <span className="text-xs font-black text-red-400 bg-red-950/80 px-4 py-2 rounded-xl border border-red-500/20">${(d.es_hermana ? (d.paquetes?.precio||0)/2 : (d.paquetes?.precio||0)).toLocaleString()}</span>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* WIDGET DE CUMPLEAÑOS (NUEVO) */}
      <div className="mt-10 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 border border-pink-500/20">
                  <Cake size={20} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Cumpleaños de {mesReporteDashboard}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {estudiantes.filter((e: any) => {
                  if (!e.fecha_nacimiento) return false;
                  const [, mesNac] = e.fecha_nacimiento.split('-');
                  return parseInt(mesNac) === (nombresMeses.indexOf(mesReporteDashboard) + 1);
              }).length > 0 ? (
                  estudiantes.filter((e: any) => {
                      if (!e.fecha_nacimiento) return false;
                      const [, mesNac] = e.fecha_nacimiento.split('-');
                      return parseInt(mesNac) === (nombresMeses.indexOf(mesReporteDashboard) + 1);
                  }).sort((a: any, b: any) => {
                      const diaA = parseInt(a.fecha_nacimiento.split('-')[2]);
                      const diaB = parseInt(b.fecha_nacimiento.split('-')[2]);
                      return diaA - diaB;
                  }).map((g: any) => {
                      const [, , diaNac] = g.fecha_nacimiento.split('-');
                      return (
                          <div key={g.id} className="bg-zinc-900/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 flex items-center gap-4 group hover:bg-white/5 transition-all text-left">
                              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex flex-col items-center justify-center text-zinc-400 group-hover:bg-pink-500/20 group-hover:text-pink-400 transition-colors">
                                  <span className="text-[10px] font-black uppercase tracking-widest">{mesReporteDashboard.substring(0,3)}</span>
                                  <span className="text-lg font-black leading-none">{diaNac}</span>
                              </div>
                              <div>
                                  <p className="text-xs font-black uppercase text-white truncate">{g.nombre.split(' ')[0]} {g.nombre.split(' ')[1] || ''}</p>
                                  <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mt-1 group-hover:text-pink-200/50 transition-colors">Gimnasta Elite</p>
                              </div>
                          </div>
                      );
                  })
              ) : (
                  <div className="col-span-full py-10 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/5">
                      <Cake size={32} className="mx-auto mb-3 text-pink-500 opacity-20" />
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Sin cumpleaños registrados en {mesReporteDashboard}</p>
                  </div>
              )}
          </div>
      </div>
      
    </div>
  );
}