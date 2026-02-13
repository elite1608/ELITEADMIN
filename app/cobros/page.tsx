"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// --- UTILIDADES DE TIEMPO (BARRANQUILLA) ---
const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const obtenerDiaActual = () => diasSemana[new Date().getDay()];
const obtenerFechaColombia = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
};

export default function EliteManager() {
  // --- ESTADOS ---
  const [usuarioActual, setUsuarioActual] = useState<'admin' | 'profe' | null>(null);
  const [profeSesion, setProfeSesion] = useState<string | null>(null);
  const [mostrarInputAdmin, setMostrarInputAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [vistaActual, setVistaActual] = useState("inicio");
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<any | null>(null);
  const [tabPerfil, setTabPerfil] = useState<'finanzas' | 'asistencia'>('finanzas');
  const [verDeudores, setVerDeudores] = useState(false);

  // --- DATOS ---
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [listaProfesores, setListaProfesores] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [pagosProfes, setPagosProfes] = useState<any[]>([]);
  const [todasAsistencias, setTodasAsistencias] = useState<any[]>([]);

  // --- FORMULARIOS ---
  const [formNombre, setFormNombre] = useState("");
  const [formPaqueteId, setFormPaqueteId] = useState("");
  const [formDias, setFormDias] = useState<string[]>([]);
  const [formProfesor, setFormProfesor] = useState(""); 
  const [formPagoInmediato, setFormPagoInmediato] = useState(true);

  // --- NÓMINA ---
  const [nominaProfe, setNominaProfe] = useState("");
  const [nominaFechaInicio, setNominaFechaInicio] = useState("");
  const [nominaFechaFin, setNominaFechaFin] = useState("");
  const [nominaClasesManual, setNominaClasesManual] = useState<number>(0);
  const [nominaValorClase, setNominaValorClase] = useState(45000); 
  const [nominaMetodo, setNominaMetodo] = useState("Nequi");
  const [clasesCalculadas, setClasesCalculadas] = useState(0);

  // --- CARGAS ---
  useEffect(() => {
    const cargarBasicos = async () => {
      const { data } = await supabase.from("profesores").select("*").eq('activo', true).order('nombre');
      if (data) { setListaProfesores(data); if(data.length > 0) { setFormProfesor(data[0].nombre); setNominaProfe(data[0].nombre); } }
    };
    cargarBasicos();
  }, []);

  useEffect(() => { if(usuarioActual) cargarTodo(); }, [usuarioActual]);

  // CALCULO NOMINA AUTOMATICO
  useEffect(() => {
    if (nominaProfe && nominaFechaInicio && nominaFechaFin) {
        const asistEnRango = todasAsistencias.filter(a => a.fecha >= nominaFechaInicio && a.fecha <= nominaFechaFin);
        const idsAlumnasProfe = estudiantes.filter(e => e.profesor === nominaProfe).map(e => e.id);
        const asistProfe = asistEnRango.filter(a => idsAlumnasProfe.includes(a.gimnasta_id));
        const diasUnicos = Array.from(new Set(asistProfe.map(a => a.fecha))).length;
        setClasesCalculadas(diasUnicos);
    } else {
        setClasesCalculadas(0);
    }
  }, [nominaProfe, nominaFechaInicio, nominaFechaFin, todasAsistencias, estudiantes]);

  const cargarTodo = async () => {
    const { data: paq } = await supabase.from("paquetes").select("*").order('precio');
    if (paq) setPaquetes(paq);
    const { data: est } = await supabase.from("gimnastas").select(`*, paquetes(*)`).order('nombre');
    if (est) setEstudiantes(est);
    const { data: asis } = await supabase.from("asistencias").select("*").order('fecha', { ascending: false });
    if (asis) setTodasAsistencias(asis);
    const { data: pagAlumnas } = await supabase.from("pagos").select(`*, gimnastas(nombre)`).order('created_at', { ascending: false });
    if (pagAlumnas) setPagos(pagAlumnas);
    const { data: pagProf } = await supabase.from("pagos_profesores").select("*").order('created_at', { ascending: false });
    if (pagProf) setPagosProfes(pagProf);
  };

  const deudores = estudiantes.filter(e => new Date(e.proximo_vencimiento) < new Date());
  const deudaTotal = deudores.reduce((acc, e) => acc + (e.paquetes?.precio || 0), 0);
  const paqueteSeleccionadoObj = paquetes.find(p => p.id == formPaqueteId);
  const hoyStr = obtenerFechaColombia();
  const asistenciasHoyIds = todasAsistencias.filter(a => a.fecha === hoyStr).map(a => a.gimnasta_id);

  const loginAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "elite1608") { setUsuarioActual('admin'); setVistaActual('inicio'); }
    else { setErrorLogin("Clave incorrecta"); }
  };

  const toggleAsistencia = async (gimnasta: any) => {
    if (asistenciasHoyIds.includes(gimnasta.id)) {
      await supabase.from("asistencias").delete().match({ gimnasta_id: gimnasta.id, fecha: hoyStr });
    } else {
      await supabase.from("asistencias").insert({ gimnasta_id: gimnasta.id, fecha: hoyStr, presente: true });
    }
    cargarTodo();
  };

  const registrarPago = async (gimnasta: any) => {
    if (!confirm(`¿Cobrar a ${gimnasta.nombre}?`)) return;
    const fVence = new Date(); fVence.setDate(fVence.getDate() + 30);
    await supabase.from("gimnastas").update({ proximo_vencimiento: fVence.toISOString() }).eq('id', gimnasta.id);
    await supabase.from("pagos").insert({ gimnasta_id: gimnasta.id, monto: gimnasta.paquetes?.precio || 0, concepto: "Mensualidad" });
    cargarTodo();
  };

  const registrarPagoNomina = async () => {
    const totalPagar = clasesCalculadas * nominaValorClase;
    if (!confirm(`¿Confirmar pago de $${totalPagar.toLocaleString()} a ${nominaProfe}?`)) return;
    await supabase.from("pagos_profesores").insert([{
        profesor: nominaProfe, monto: totalPagar, clases_pagadas: clasesCalculadas,
        fecha_pago: obtenerFechaColombia(), metodo: nominaMetodo, notas: `Periodo: ${nominaFechaInicio} al ${nominaFechaFin}`
    }]);
    cargarTodo();
  };

  const eliminarPagoHistorial = async (pagoId: number, gimnastaId: number) => {
    if (!confirm("¿Anular pago y devolver fecha?")) return;
    await supabase.from("pagos").delete().eq('id', pagoId);
    const gim = estudiantes.find(e => e.id === gimnastaId);
    if (gim) {
      const f = new Date(gim.proximo_vencimiento); f.setDate(f.getDate() - 30);
      await supabase.from("gimnastas").update({ proximo_vencimiento: f.toISOString() }).eq('id', gimnastaId);
    }
    cargarTodo(); setPerfilSeleccionado(null);
  };

  const eliminarGimnasta = async (id: number) => {
    if (!confirm("¿Borrar definitivamente?")) return;
    await supabase.from("gimnastas").delete().eq('id', id);
    setPerfilSeleccionado(null); cargarTodo();
  };

  const inscribirGimnasta = async () => {
    if (!formNombre || !formPaqueteId) return alert("Faltan datos");
    const hoy = new Date();
    const vencimiento = new Date();
    if (formPagoInmediato) vencimiento.setDate(hoy.getDate() + 30); else vencimiento.setDate(hoy.getDate() - 1);
    const { data: nueva, error } = await supabase.from("gimnastas").insert([{
      nombre: formNombre, paquete_id: formPaqueteId, dias: formDias, profesor: formProfesor,
      estado: formPagoInmediato ? "Activo" : "Pendiente", proximo_vencimiento: vencimiento.toISOString(), ultimo_pago: formPagoInmediato ? hoy.toISOString() : null
    }]).select().single();
    if (error) return alert("Error: " + error.message);
    if (formPagoInmediato && nueva) {
      const precio = paquetes.find(p => p.id == formPaqueteId)?.precio || 0;
      await supabase.from("pagos").insert([{ gimnasta_id: nueva.id, monto: precio, concepto: "Inscripción" }]);
    }
    alert("✅ Gimnasta inscrita"); setFormNombre(""); setFormDias([]); cargarTodo();
  };

  // --- INTERFAZ ---
  if (!usuarioActual) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 p-8 rounded-3xl text-center border border-zinc-800">
          <h1 className="text-white text-3xl font-bold mb-8">Elite Gymnastics</h1>
          {!mostrarInputAdmin ? (
            <div className="space-y-3">
              {listaProfesores.map(p => (
                <button key={p.id} onClick={() => { setUsuarioActual('profe'); setProfeSesion(p.nombre); setVistaActual('asistencia'); }} className="w-full bg-zinc-800 text-white py-3 rounded-xl font-bold hover:bg-zinc-700 transition-all">{p.nombre}</button>
              ))}
              <button onClick={() => setMostrarInputAdmin(true)} className="w-full bg-blue-900/20 text-blue-400 py-3 rounded-xl border border-blue-900/30 mt-4">Acceso Admin</button>
            </div>
          ) : (
            <form onSubmit={loginAdmin} className="space-y-4">
              <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-4 rounded-xl bg-black text-white text-center text-xl focus:border-blue-500 outline-none border border-zinc-800" placeholder="••••" autoFocus />
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition-all">Entrar</button>
              <button type="button" onClick={() => setMostrarInputAdmin(false)} className="text-zinc-500 text-sm">Volver</button>
            </form>
          )}
          <p className="mt-8 text-[10px] text-zinc-700 uppercase tracking-widest">Barranquilla • 2026</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white font-sans">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 fixed h-full z-10 flex flex-col">
        <h1 className="text-xl font-bold mb-2">Elite Manager</h1>
        <div className="mb-8 p-3 rounded-xl bg-blue-900/20 border border-blue-900/50">
            <p className="text-[10px] text-zinc-400 uppercase font-bold">{usuarioActual === 'admin' ? 'Administrador' : 'Profesor'}</p>
            <p className="font-bold text-sm truncate">{usuarioActual === 'admin' ? 'DUEÑO' : profeSesion}</p>
        </div>
        <nav className="space-y-2 flex-1">
          {usuarioActual === 'admin' && (
            <>
              <button onClick={() => setVistaActual('inicio')} className={`w-full text-left p-3 rounded-xl ${vistaActual === 'inicio' ? 'bg-blue-600' : 'hover:bg-zinc-800 text-zinc-400'}`}>🏠 Inicio</button>
              <button onClick={() => setVistaActual('inscripciones')} className={`w-full text-left p-3 rounded-xl ${vistaActual === 'inscripciones' ? 'bg-blue-600' : 'hover:bg-zinc-800 text-zinc-400'}`}>📝 Inscripciones</button>
              <button onClick={() => setVistaActual('cobros')} className={`w-full text-left p-3 rounded-xl ${vistaActual === 'cobros' ? 'bg-blue-600' : 'hover:bg-zinc-800 text-zinc-400'}`}>💰 Cobros</button>
              <button onClick={() => setVistaActual('nomina')} className={`w-full text-left p-3 rounded-xl ${vistaActual === 'nomina' ? 'bg-blue-600' : 'hover:bg-zinc-800 text-zinc-400'}`}>💸 Nómina</button>
            </>
          )}
          <button onClick={() => setVistaActual('asistencia')} className={`w-full text-left p-3 rounded-xl ${vistaActual === 'asistencia' ? 'bg-blue-600' : 'hover:bg-zinc-800 text-zinc-400'}`}>📋 Asistencia</button>
        </nav>
        <button onClick={() => setUsuarioActual(null)} className="text-zinc-600 hover:text-white text-xs pt-4 border-t border-zinc-800">Cerrar Sesión</button>
      </aside>

      <main className="ml-64 p-12 flex-1">
        {vistaActual === 'inicio' && usuarioActual === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800"><h3 className="text-zinc-500 text-xs font-bold uppercase">Total Alumnas</h3><p className="text-4xl font-bold mt-2">{estudiantes.length}</p></div>
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800"><h3 className="text-emerald-500 text-xs font-bold uppercase">Caja</h3><p className="text-4xl font-bold mt-2 text-emerald-400">${pagos.reduce((a, b) => a + b.monto, 0).toLocaleString()}</p></div>
            <div className="bg-zinc-900 p-6 rounded-2xl border border-rose-900/30"><h3 className="text-rose-500 text-xs font-bold uppercase">Mora</h3><p className="text-4xl font-bold mt-2 text-rose-500">${deudaTotal.toLocaleString()}</p></div>
          </div>
        )}

        {vistaActual === 'nomina' && usuarioActual === 'admin' && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">💸 Nómina de Profesores</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                        <h3 className="text-lg font-bold mb-6">🧮 Calcular Pago</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs text-zinc-500 block mb-1 uppercase font-bold">Profesor</label><select className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-700 text-white" value={nominaProfe} onChange={e => setNominaProfe(e.target.value)}>{listaProfesores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}</select></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-zinc-500 block mb-1 uppercase font-bold">Desde</label><input type="date" className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-700 text-white" value={nominaFechaInicio} onChange={e => setNominaFechaInicio(e.target.value)} /></div><div><label className="text-xs text-zinc-500 block mb-1 uppercase font-bold">Hasta</label><input type="date" className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-700 text-white" value={nominaFechaFin} onChange={e => setNominaFechaFin(e.target.value)} /></div></div>
                            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                                <div className="flex justify-between items-center mb-2"><span className="text-zinc-400">Días trabajados (Clases):</span><span className="text-xl font-bold text-blue-400">{clasesCalculadas}</span></div>
                                <div className="flex justify-between items-center"><span className="text-zinc-400">Valor clase:</span><div className="flex items-center gap-1"><span>$</span><input type="number" className="w-20 bg-transparent text-right border-b border-zinc-600" value={nominaValorClase} onChange={e => setNominaValorClase(Number(e.target.value))} /></div></div>
                                <div className="border-t border-zinc-800 my-3"></div>
                                <div className="flex justify-between items-center text-green-400 text-lg font-bold"><span>Total:</span><span>${(clasesCalculadas * nominaValorClase).toLocaleString()}</span></div>
                            </div>
                            <button onClick={registrarPagoNomina} disabled={clasesCalculadas === 0} className="w-full bg-green-600 disabled:bg-zinc-800 font-bold py-4 rounded-xl">Registrar Pago</button>
                        </div>
                    </div>
                    <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 max-h-[600px] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-6">📜 Historial</h3>
                        <div className="space-y-3">
                            {pagosProfes.map(p => (<div key={p.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800"><p className="font-bold text-white">{p.profesor}</p><p className="text-xs text-zinc-500">{new Date(p.fecha_pago).toLocaleDateString()} • {p.metodo}</p><p className="text-green-400 font-bold mt-2">${p.monto.toLocaleString()}</p></div>))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {vistaActual === 'inscripciones' && usuarioActual === 'admin' && (
            <div className="bg-zinc-900 p-8 rounded-2xl max-w-2xl mx-auto border border-zinc-800">
                <h2 className="text-2xl font-bold mb-8 text-center">📝 Nueva Inscripción</h2>
                <div className="space-y-6">
                    <input type="text" placeholder="Nombre Alumna" className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-700 outline-none text-white" value={formNombre} onChange={e => setFormNombre(e.target.value)} />
                    <div className="grid grid-cols-2 gap-4">
                        <select className="bg-zinc-950 p-4 rounded-xl border border-zinc-700 outline-none text-white" value={formPaqueteId} onChange={e => setFormPaqueteId(e.target.value)}>
                            <option value="">Seleccionar Plan...</option>{paquetes.map(p => <option key={p.id} value={p.id}>{p.nombre} - ${p.precio.toLocaleString()}</option>)}
                        </select>
                        <select className="bg-zinc-950 p-4 rounded-xl border border-zinc-700 outline-none text-white" value={formProfesor} onChange={e => setFormProfesor(e.target.value)}>
                            {listaProfesores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                        </select>
                    </div>
                    {paqueteSeleccionadoObj && (
                        <div className="flex flex-wrap gap-2">{diasSemana.slice(1).map(dia => (<button key={dia} onClick={() => { if (formDias.includes(dia)) setFormDias(formDias.filter(d => d !== dia)); else if (formDias.length < paqueteSeleccionadoObj.max_dias) setFormDias([...formDias, dia]); }} className={`px-4 py-2 rounded-lg text-sm ${formDias.includes(dia) ? 'bg-blue-600' : 'bg-zinc-800'}`}>{dia}</button>))}</div>
                    )}
                    <div className="flex items-center gap-4 p-4 bg-zinc-800/30 rounded-xl cursor-pointer" onClick={() => setFormPagoInmediato(!formPagoInmediato)}>
                        <div className={`w-6 h-6 rounded border flex items-center justify-center ${formPagoInmediato ? 'bg-green-500' : 'border-zinc-500'}`}>{formPagoInmediato && "✓"}</div><span>¿Pago Inmediato?</span>
                    </div>
                    <button onClick={inscribirGimnasta} className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-4 rounded-xl">Confirmar Inscripción</button>
                </div>
            </div>
        )}

        {vistaActual === 'cobros' && usuarioActual === 'admin' && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">💰 Gestión de Cobros</h2>
                <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase"><tr><th className="p-4">Alumna</th><th className="p-4">Estado</th><th className="p-4">Vence</th><th className="p-4 text-right">Acción</th></tr></thead>
                        <tbody className="divide-y divide-zinc-800 text-white">
                            {estudiantes.map(e => {
                                const vencido = new Date(e.proximo_vencimiento) < new Date();
                                return (
                                    <tr key={e.id} className="hover:bg-zinc-800/50 cursor-pointer" onClick={() => {setPerfilSeleccionado(e); setTabPerfil('finanzas')}}>
                                        <td className="p-4 font-bold">{e.nombre}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${vencido ? 'text-red-400 bg-red-900/20' : 'text-green-400 bg-green-900/20'}`}>{vencido ? "MORA" : "AL DÍA"}</span></td>
                                        <td className="p-4 text-zinc-400 text-sm">{new Date(e.proximo_vencimiento).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">{vencido && <button className="bg-green-600 px-3 py-1 rounded text-xs font-bold text-white">Cobrar</button>}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {vistaActual === 'asistencia' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-300">
            {estudiantes.filter(e => (!profeSesion || e.profesor === profeSesion) && (e.dias || []).includes(obtenerDiaActual())).map(e => {
              const asistido = asistenciasHoyIds.includes(e.id);
              return (
                <div key={e.id} className={`p-5 rounded-2xl border flex justify-between items-center transition-all ${asistido ? 'bg-green-900/10 border-green-900/50' : 'bg-zinc-900 border-zinc-800'}`}>
                  <div onClick={() => { setPerfilSeleccionado(e); setTabPerfil(usuarioActual === 'admin' ? 'finanzas' : 'asistencia'); }} className="cursor-pointer group">
                    <p className="font-bold text-lg group-hover:text-blue-400 underline decoration-zinc-700">{e.nombre}</p>
                    <p className="text-xs text-zinc-500">{e.paquetes?.nombre || 'Sin Plan'}</p>
                  </div>
                  <button onClick={() => toggleAsistencia(e)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${asistido ? 'bg-green-500 shadow-lg shadow-green-900/20' : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'}`}>
                    {asistido ? "✓" : ""}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {perfilSeleccionado && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 w-full max-w-xl rounded-3xl p-8 border border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div><h2 className="text-2xl font-bold">{perfilSeleccionado.nombre}</h2><p className="text-zinc-500 text-sm font-medium">{perfilSeleccionado.profesor}</p></div>
              <button onClick={() => setPerfilSeleccionado(null)} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
            </div>
            {usuarioActual === 'admin' && (
              <div className="flex gap-6 mb-6 border-b border-zinc-800 pb-2">
                <button onClick={() => setTabPerfil('finanzas')} className={`text-sm font-bold transition-all ${tabPerfil === 'finanzas' ? 'text-white border-b-2 border-blue-500 pb-2' : 'text-zinc-500 hover:text-white'}`}>💰 Finanzas</button>
                <button onClick={() => setTabPerfil('asistencia')} className={`text-sm font-bold transition-all ${tabPerfil === 'asistencia' ? 'text-white border-b-2 border-blue-500 pb-2' : 'text-zinc-500 hover:text-white'}`}>📅 Asistencia</button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto pr-2">
              {tabPerfil === 'finanzas' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-black rounded-2xl text-center border border-zinc-800">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Próximo Vencimiento</p>
                    <p className="text-2xl font-bold">{new Date(perfilSeleccionado.proximo_vencimiento).toLocaleDateString()}</p>
                    {usuarioActual === 'admin' && <button onClick={() => registrarPago(perfilSeleccionado)} className="w-full bg-green-600 py-3 rounded-xl mt-4 font-bold hover:bg-green-500 transition-all">Registrar Mensualidad</button>}
                  </div>
                  <div className="space-y-2">
                    {pagos.filter(p => p.gimnasta_id === perfilSeleccionado.id).map(p => (
                      <div key={p.id} className="flex justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800 group">
                        <span className="text-xs text-zinc-500 font-medium">{new Date(p.created_at).toLocaleDateString()}</span>
                        <div className="flex gap-4 items-center">
                          <span className="text-emerald-400 font-bold text-sm">${p.monto.toLocaleString()}</span>
                          {usuarioActual === 'admin' && <button onClick={() => eliminarPagoHistorial(p.id, perfilSeleccionado.id)} className="text-zinc-700 hover:text-red-500 transition-colors">🗑️</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {usuarioActual === 'admin' && <button onClick={() => eliminarGimnasta(perfilSeleccionado.id)} className="text-red-500/50 hover:text-red-500 text-[10px] w-full mt-8 uppercase font-bold tracking-tighter">Eliminar Alumna Permanentemente</button>}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 pb-4">
                  {todasAsistencias.filter(a => a.gimnasta_id === perfilSeleccionado.id).map(a => (
                    <div key={a.id} className="bg-black p-3 rounded-xl text-center text-xs border border-zinc-800 text-zinc-400">{new Date(a.fecha).toLocaleDateString(undefined, {day:'2-digit', month:'short'})}</div>
                  ))}
                  {todasAsistencias.filter(a => a.gimnasta_id === perfilSeleccionado.id).length === 0 && <p className="col-span-3 text-center text-zinc-600 py-8 italic text-sm">No hay asistencias registradas aún.</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {verDeudores && usuarioActual === 'admin' && (
             <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl border border-rose-900 p-6 shadow-2xl shadow-rose-900/20">
                    <div className="flex justify-between mb-4"><h2 className="text-xl font-bold text-rose-400">⚠️ Alumnas en Mora</h2><button onClick={() => setVerDeudores(false)}>✕</button></div>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {deudores.map(d => (
                            <div key={d.id} className="flex justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800 items-center">
                                <span className="font-bold">{d.nombre}</span><button onClick={() => registrarPago(d)} className="text-green-400 font-bold hover:bg-green-900/20 px-3 py-1 rounded transition-colors">Cobrar ${d.paquetes?.precio.toLocaleString()}</button>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        )}
    </div>
  );
}