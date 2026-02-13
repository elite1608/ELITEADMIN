"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// --- UTILIDADES ---
const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const obtenerDiaActual = () => diasSemana[new Date().getDay()];

// 🇨🇴 FUNCIÓN PARA OBTENER FECHA EXACTA EN COLOMBIA (Evita desfase UTC)
const obtenerFechaColombia = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
};

export default function EliteManager() {
  // --- AUTENTICACIÓN ---
  const [usuarioActual, setUsuarioActual] = useState<'admin' | 'profe' | null>(null);
  const [profeSesion, setProfeSesion] = useState<string | null>(null);
  const [mostrarInputAdmin, setMostrarInputAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorLogin, setErrorLogin] = useState("");

  // --- NAVEGACIÓN ---
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

  // --- ESTADO NÓMINA ---
  const [nominaProfe, setNominaProfe] = useState("");
  const [nominaFechaInicio, setNominaFechaInicio] = useState("");
  const [nominaFechaFin, setNominaFechaFin] = useState("");
  const [nominaValorClase, setNominaValorClase] = useState(45000); 
  const [nominaMetodo, setNominaMetodo] = useState("Nequi");

  // --- CARGA INICIAL ---
  useEffect(() => { cargarProfesores(); }, []);
  useEffect(() => { if(usuarioActual) cargarDatosCompletos(); }, [usuarioActual]);

  const cargarProfesores = async () => {
      const { data } = await supabase.from("profesores").select("*").eq('activo', true).order('nombre');
      if (data) {
          setListaProfesores(data);
          if(data.length > 0) {
              setFormProfesor(data[0].nombre);
              setNominaProfe(data[0].nombre);
          }
      }
  };

  const cargarDatosCompletos = async () => {
    const { data: dataPaq } = await supabase.from("paquetes").select("*").order('precio');
    if (dataPaq) setPaquetes(dataPaq);

    const { data: dataEst } = await supabase.from("gimnastas").select(`*, paquetes(*)`).order('nombre');
    if (dataEst) setEstudiantes(dataEst);

    const { data: dataAsis } = await supabase.from("asistencias").select("*").order('fecha', { ascending: false });
    if (dataAsis) setTodasAsistencias(dataAsis);

    if (usuarioActual === 'admin') {
        const { data: dataPagos } = await supabase.from("pagos").select(`*, gimnastas(nombre)`).order('created_at', { ascending: false });
        if (dataPagos) setPagos(dataPagos);
        const { data: dataPagosProf } = await supabase.from("pagos_profesores").select("*").order('created_at', { ascending: false });
        if (dataPagosProf) setPagosProfes(dataPagosProf);
    }
  };

  // --- LOGIN LOGIC ---
  const loginAdmin = (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordInput === "elite1608") {
          setUsuarioActual('admin');
          setProfeSesion(null);
          setVistaActual('inicio');
          setMostrarInputAdmin(false);
          setPasswordInput("");
      } else {
          setErrorLogin("Contraseña incorrecta");
          setTimeout(() => setErrorLogin(""), 2000);
      }
  };

  const seleccionarProfe = (nombreProfe: string) => {
      setUsuarioActual('profe');
      setProfeSesion(nombreProfe);
      setVistaActual('asistencia');
  };

  // --- CÁLCULOS GLOBALES ---
  const deudores = estudiantes.filter(e => new Date(e.proximo_vencimiento) < new Date());
  const deudaTotal = deudores.reduce((acc, e) => acc + (e.paquetes?.precio || 0), 0);
  const paqueteSeleccionadoObj = paquetes.find(p => p.id == formPaqueteId);
  const hoyStr = obtenerFechaColombia(); // 🇨🇴 Usamos la fecha corregida
  const asistenciasHoyIds = todasAsistencias.filter(a => a.fecha === hoyStr).map(a => a.gimnasta_id);

  // --- LÓGICA DE NÓMINA ---
  const calcularClasesProfe = () => {
      if (!nominaProfe || !nominaFechaInicio || !nominaFechaFin) return 0;
      const asistenciasEnRango = todasAsistencias.filter(a => a.fecha >= nominaFechaInicio && a.fecha <= nominaFechaFin);
      const idsAlumnosDelProfe = estudiantes.filter(e => e.profesor === nominaProfe).map(e => e.id);
      const asistenciasDelProfe = asistenciasEnRango.filter(a => idsAlumnosDelProfe.includes(a.gimnasta_id));
      const fechasUnicas = Array.from(new Set(asistenciasDelProfe.map(a => a.fecha)));
      return fechasUnicas.length;
  };

  const clasesCalculadas = calcularClasesProfe();
  const totalPagarNomina = clasesCalculadas * nominaValorClase;

  const registrarPagoNomina = async () => {
      if (!confirm(`¿Confirmar pago de $${totalPagarNomina.toLocaleString()} a ${nominaProfe}?`)) return;
      const { error } = await supabase.from("pagos_profesores").insert([{
          profesor: nominaProfe, monto: totalPagarNomina, clases_pagadas: clasesCalculadas,
          fecha_pago: obtenerFechaColombia(), metodo: nominaMetodo, notas: `Periodo: ${nominaFechaInicio} al ${nominaFechaFin}`
      }]);
      if (error) alert("Error: " + error.message);
      else { alert("Pago registrado exitosamente 💸"); cargarDatosCompletos(); }
  };

  // --- ACCIONES GENERALES ---
  const registrarPago = async (gimnasta: any) => {
    if(usuarioActual !== 'admin') return; 
    if(!confirm(`¿Registrar pago de ${gimnasta.nombre}?`)) return;
    const hoy = new Date();
    const nuevaFecha = new Date();
    nuevaFecha.setDate(hoy.getDate() + 30);
    await supabase.from("gimnastas").update({ estado: 'Activo', proximo_vencimiento: nuevaFecha.toISOString(), ultimo_pago: hoy.toISOString() }).eq('id', gimnasta.id);
    await supabase.from("pagos").insert({ gimnasta_id: gimnasta.id, monto: gimnasta.paquetes.precio, concepto: `Mensualidad` });
    cargarDatosCompletos(); setPerfilSeleccionado(null); alert("Pago registrado 💰");
  };

  const eliminarPagoHistorial = async (pagoId: number, gimnastaId: number) => {
      if(!confirm("⚠️ ¿Anular pago y revertir 30 días?")) return;
      await supabase.from("pagos").delete().eq("id", pagoId);
      const alumna = estudiantes.find(e => e.id === gimnastaId);
      if (alumna) {
          const f = new Date(alumna.proximo_vencimiento); f.setDate(f.getDate() - 30);
          await supabase.from("gimnastas").update({ proximo_vencimiento: f.toISOString() }).eq("id", gimnastaId);
      }
      cargarDatosCompletos(); setPerfilSeleccionado(null); alert("Pago anulado");
  };

  const eliminarGimnasta = async (id: number) => {
    if(usuarioActual !== 'admin') return;
    if(!confirm("⚠️ ¿ELIMINAR ALUMNA?")) return;
    await supabase.from("gimnastas").delete().eq("id", id);
    setPerfilSeleccionado(null); cargarDatosCompletos(); alert("Eliminada");
  };

  const inscribirGimnasta = async () => {
    if(usuarioActual !== 'admin') return;
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
    alert("✅ Gimnasta inscrita"); setFormNombre(""); setFormDias([]); cargarDatosCompletos();
  };

  const toggleAsistencia = async (gimnasta: any) => {
    const hoy = obtenerFechaColombia(); // 🇨🇴 Usamos la fecha corregida
    if (asistenciasHoyIds.includes(gimnasta.id)) {
        await supabase.from("asistencias").delete().match({ gimnasta_id: gimnasta.id, fecha: hoy });
    } else {
        await supabase.from("asistencias").insert({ gimnasta_id: gimnasta.id, fecha: hoy, presente: true });
    }
    cargarDatosCompletos();
  };

  // --- LOGIN ---
  if (!usuarioActual) {
      return (
          <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-md bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl text-center">
                  <div className="text-6xl mb-6 animate-bounce">🤸‍♀️</div>
                  <h1 className="text-3xl font-bold text-white mb-2">Elite Gymnastics</h1>
                  <p className="text-zinc-500 mb-10 text-sm tracking-wide uppercase">Sistema de Gestión</p>
                  {!mostrarInputAdmin ? (
                      <div className="space-y-6">
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                              <p className="text-zinc-400 text-sm mb-4 font-bold uppercase tracking-wider">Soy Profesor</p>
                              <div className="grid grid-cols-1 gap-2">
                                  {listaProfesores.map(profe => (
                                      <button key={profe.id} onClick={() => seleccionarProfe(profe.nombre)} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-between px-4 group">
                                          <span>{profe.nombre}</span><span className="text-zinc-500 group-hover:text-white">→</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <div className="border-t border-zinc-800 my-4"></div>
                          <button onClick={() => setMostrarInputAdmin(true)} className="w-full bg-blue-900/20 hover:bg-blue-900/40 text-blue-300 font-bold py-4 rounded-xl transition-all border border-blue-900/30 flex justify-center items-center gap-2"><span>🔐</span> Soy Dueño (Admin)</button>
                      </div>
                  ) : (
                      <form onSubmit={loginAdmin} className="space-y-4 animate-in fade-in zoom-in duration-200">
                           <div className="text-left mb-2"><button type="button" onClick={() => setMostrarInputAdmin(false)} className="text-zinc-500 hover:text-white text-sm flex items-center gap-1">← Volver</button></div>
                           <p className="text-white font-bold">Ingrese Contraseña Maestra</p>
                           <input type="password" className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-700 text-center text-white text-xl focus:border-blue-500 outline-none transition-all" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="••••••••" autoFocus />
                          {errorLogin && <p className="text-red-500 font-bold text-sm animate-pulse">{errorLogin}</p>}
                          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all">Desbloquear</button>
                      </form>
                  )}
                  <p className="mt-8 text-[10px] text-zinc-700 uppercase tracking-widest">Barranquilla • 2026</p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col p-6 fixed h-full z-10">
            <h1 className="text-xl font-bold text-white mb-2">Elite Manager</h1>
            <div className={`mb-8 p-3 rounded-xl border ${usuarioActual === 'admin' ? 'bg-blue-900/20 border-blue-900/50' : 'bg-purple-900/20 border-purple-900/50'}`}>
                <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-1">{usuarioActual === 'admin' ? 'Administrador' : 'Profesor'}</p>
                <p className="font-bold text-white text-sm">{usuarioActual === 'admin' ? 'DUEÑO' : profeSesion}</p>
            </div>
            <nav className="space-y-2">
                {usuarioActual === 'admin' && (
                    <>
                        <button onClick={() => setVistaActual('inicio')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${vistaActual === 'inicio' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}>🏠 Inicio</button>
                        <button onClick={() => setVistaActual('inscripciones')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${vistaActual === 'inscripciones' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}>📝 Inscripciones</button>
                        <button onClick={() => setVistaActual('cobros')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${vistaActual === 'cobros' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}>💰 Cobros</button>
                        <button onClick={() => setVistaActual('nomina')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${vistaActual === 'nomina' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}>💸 Nómina</button>
                    </>
                )}
                <button onClick={() => setVistaActual('asistencia')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${vistaActual === 'asistencia' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800'}`}>📋 Asistencia</button>
            </nav>
            <button onClick={() => setUsuarioActual(null)} className="mt-auto flex items-center gap-2 text-zinc-500 hover:text-white transition-colors pt-6 border-t border-zinc-800">🔒 Cerrar Sesión</button>
        </aside>

        <main className="flex-1 ml-64 p-8 md:p-12">
            {vistaActual === 'inicio' && usuarioActual === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                        <h3 className="text-zinc-500 text-xs font-bold uppercase">Total Alumnas</h3><p className="text-4xl font-bold mt-4">{estudiantes.length}</p>
                    </div>
                    <div className="bg-emerald-900/10 p-6 rounded-2xl border border-emerald-900/30">
                        <h3 className="text-emerald-500 text-xs font-bold uppercase">Caja Total</h3><p className="text-4xl font-bold mt-4">${pagos.reduce((acc, p) => acc + p.monto, 0).toLocaleString()}</p>
                    </div>
                    <div onClick={() => setVerDeudores(true)} className="bg-rose-900/20 p-6 rounded-2xl border border-rose-900/50 cursor-pointer hover:bg-rose-900/30">
                        <h3 className="text-rose-400 text-xs font-bold uppercase">⚠️ Deuda Pendiente</h3><p className="text-4xl font-bold mt-4">${deudaTotal.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {vistaActual === 'nomina' && usuarioActual === 'admin' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">💸 Nómina de Profesores</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 h-fit">
                            <h3 className="text-lg font-bold mb-6 border-b border-zinc-800 pb-2">🧮 Calcular Pago Quincenal</h3>
                            <div className="space-y-4">
                                <div><label className="text-xs text-zinc-500 block mb-1 uppercase font-bold">Profesor</label><select className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-700 outline-none" value={nominaProfe} onChange={e => setNominaProfe(e.target.value)}>{listaProfesores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}</select></div>
                                <div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-zinc-500 block mb-1 uppercase font-bold">Fecha Inicio</label><input type="date" className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-700" value={nominaFechaInicio} onChange={e => setNominaFechaInicio(e.target.value)} /></div><div><label className="text-xs text-zinc-500 block mb-1 uppercase font-bold">Fecha Fin</label><input type="date" className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-700" value={nominaFechaFin} onChange={e => setNominaFechaFin(e.target.value)} /></div></div>
                                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 mt-4"><div className="flex justify-between items-center mb-2"><span className="text-zinc-400">Clases impartidas:</span><span className="text-xl font-bold">{clasesCalculadas}</span></div><div className="flex justify-between items-center"><span className="text-zinc-400">Valor por clase:</span><div className="flex items-center gap-1"><span>$</span><input type="number" className="w-20 bg-transparent text-right border-b border-zinc-600 outline-none" value={nominaValorClase} onChange={e => setNominaValorClase(Number(e.target.value))} /></div></div><div className="border-t border-zinc-800 my-3"></div><div className="flex justify-between items-center text-green-400 text-lg font-bold"><span>Total a Pagar:</span><span>${totalPagarNomina.toLocaleString()}</span></div></div>
                                <div><label className="text-xs text-zinc-500 block mb-1 uppercase font-bold">Método de Pago</label><select className="w-full bg-zinc-950 p-3 rounded-xl border border-zinc-700 outline-none" value={nominaMetodo} onChange={e => setNominaMetodo(e.target.value)}><option value="Nequi">Nequi</option><option value="Daviplata">Daviplata</option><option value="Efectivo">Efectivo</option><option value="Transferencia">Transferencia Bancaria</option></select></div>
                                <button onClick={registrarPagoNomina} disabled={totalPagarNomina === 0} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-600 font-bold py-4 rounded-xl transition-all">Registrar Pago Realizado</button>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[600px]"><h3 className="text-lg font-bold mb-6 border-b border-zinc-800 pb-2">📜 Historial de Pagos</h3><div className="overflow-y-auto flex-1 space-y-3 pr-2">{pagosProfes.length === 0 ? <p className="text-zinc-500 italic">No hay pagos registrados.</p> : pagosProfes.map(p => (<div key={p.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800"><div className="flex justify-between items-start mb-2"><div><p className="font-bold text-white text-lg">{p.profesor}</p><p className="text-xs text-zinc-500">{new Date(p.fecha_pago).toLocaleDateString()} • {p.metodo}</p></div><span className="text-green-400 font-bold font-mono text-lg">${p.monto.toLocaleString()}</span></div><div className="text-xs text-zinc-400 bg-zinc-900 p-2 rounded">{p.clases_pagadas} clases pagadas. <br/>{p.notas}</div></div>))}</div></div>
                    </div>
                </div>
            )}

            {vistaActual === 'inscripciones' && usuarioActual === 'admin' && (
                <div className="bg-zinc-900 p-8 rounded-2xl max-w-2xl mx-auto border border-zinc-800">
                    <h2 className="text-2xl font-bold mb-8">📝 Nueva Inscripción</h2>
                    <div className="space-y-6">
                        <input type="text" placeholder="Nombre Alumna" className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-700 outline-none text-white" value={formNombre} onChange={e => setFormNombre(e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                            <select className="bg-zinc-950 p-4 rounded-xl border border-zinc-700 outline-none" value={formPaqueteId} onChange={e => setFormPaqueteId(e.target.value)}>
                                <option value="">Seleccionar Plan...</option>{paquetes.map(p => <option key={p.id} value={p.id}>{p.nombre} - ${p.precio.toLocaleString()}</option>)}
                            </select>
                            <select className="bg-zinc-950 p-4 rounded-xl border border-zinc-700 outline-none" value={formProfesor} onChange={e => setFormProfesor(e.target.value)}>
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
                            <tbody className="divide-y divide-zinc-800">
                                {estudiantes.map(e => {
                                    const vencido = new Date(e.proximo_vencimiento) < new Date();
                                    return (
                                        <tr key={e.id} className="hover:bg-zinc-800/50 cursor-pointer" onClick={() => {setPerfilSeleccionado(e); setTabPerfil('finanzas')}}>
                                            <td className="p-4 font-bold">{e.nombre}</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${vencido ? 'text-red-400 bg-red-900/20' : 'text-green-400 bg-green-900/20'}`}>{vencido ? "MORA" : "AL DÍA"}</span></td>
                                            <td className="p-4 text-zinc-400 text-sm">{new Date(e.proximo_vencimiento).toLocaleDateString()}</td>
                                            <td className="p-4 text-right">{vencido && <button className="bg-green-600 px-3 py-1 rounded text-xs font-bold">Cobrar</button>}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {vistaActual === 'asistencia' && (
                <div>
                    <div className="flex justify-between items-end mb-6">
                        <div><h2 className="text-2xl font-bold mb-1">📋 Asistencia - {obtenerDiaActual()}</h2><p className="text-zinc-400 text-sm">{profeSesion ? `Grupo: ${profeSesion}` : "Todos los grupos"}</p></div>
                    </div>
                    {(() => {
                        const diaActual = obtenerDiaActual();
                        const listaFiltrada = estudiantes.filter(e => { const esMiGrupo = profeSesion ? e.profesor === profeSesion : true; const tieneClaseHoy = e.dias && e.dias.includes(diaActual); return esMiGrupo && tieneClaseHoy; });
                        if (listaFiltrada.length === 0) return <div className="p-10 text-center bg-zinc-900 rounded-xl text-zinc-500">No hay clases hoy.</div>;
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {listaFiltrada.map(e => {
                                    const yaAsistio = asistenciasHoyIds.includes(e.id);
                                    return (
                                        <div key={e.id} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${yaAsistio ? 'bg-green-900/10 border-green-900/50' : 'bg-zinc-900 border-zinc-800 hover:border-purple-500'}`}>
                                            <div className="text-left cursor-pointer group" onClick={() => {setPerfilSeleccionado(e); setTabPerfil(usuarioActual === 'admin' ? 'finanzas' : 'asistencia')}}>
                                                <p className="font-bold text-lg group-hover:text-blue-400 transition-colors underline decoration-dotted decoration-zinc-600">{e.nombre}</p>
                                                <p className="text-xs text-zinc-500">{e.paquetes?.nombre}</p>
                                            </div>
                                            <button onClick={() => toggleAsistencia(e)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${yaAsistio ? 'bg-green-500 text-white shadow-lg shadow-green-900/50' : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700 hover:scale-110'}`}>
                                                {yaAsistio ? "✓" : ""}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        );
                    })()}
                </div>
            )}
        </main>

        {perfilSeleccionado && (
            <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-zinc-900 w-full max-w-xl rounded-2xl border border-zinc-700 shadow-2xl p-6 flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-start mb-6">
                        <div><h2 className="text-2xl font-bold">{perfilSeleccionado.nombre}</h2><p className="text-zinc-400">{perfilSeleccionado.profesor}</p></div>
                        <button onClick={() => setPerfilSeleccionado(null)} className="text-zinc-400 hover:text-white">✕</button>
                    </div>
                    {usuarioActual === 'admin' && (
                        <div className="flex gap-2 mb-4 border-b border-zinc-800 pb-2">
                            <button onClick={() => setTabPerfil('finanzas')} className={`px-4 py-2 rounded-lg text-sm font-bold ${tabPerfil === 'finanzas' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}>💰 Finanzas</button>
                            <button onClick={() => setTabPerfil('asistencia')} className={`px-4 py-2 rounded-lg text-sm font-bold ${tabPerfil === 'asistencia' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}>📅 Asistencia</button>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto">
                        {tabPerfil === 'finanzas' && usuarioActual === 'admin' && (
                            <div className="space-y-6">
                                <div className={`p-4 rounded-xl border ${new Date(perfilSeleccionado.proximo_vencimiento) < new Date() ? 'bg-red-900/10 border-red-900' : 'bg-green-900/10 border-green-900'}`}>
                                    <p className="text-2xl font-bold">{new Date(perfilSeleccionado.proximo_vencimiento) < new Date() ? "Pago Vencido" : "Al Día"}</p>
                                    {new Date(perfilSeleccionado.proximo_vencimiento) < new Date() && <button onClick={() => registrarPago(perfilSeleccionado)} className="mt-2 bg-red-600 w-full py-2 rounded font-bold">Cobrar Ahora</button>}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase text-zinc-500 mb-2">Historial de Pagos</h3>
                                    <div className="space-y-2">
                                        {pagos.filter(p => p.gimnasta_id === perfilSeleccionado.id).map(p => (
                                            <div key={p.id} className="flex justify-between items-center bg-zinc-950 p-3 rounded border border-zinc-800">
                                                <div><p className="font-bold text-sm">{p.concepto}</p><p className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</p></div>
                                                <div className="flex items-center gap-3"><span className="text-green-500 font-bold">+${p.monto.toLocaleString()}</span><button onClick={() => eliminarPagoHistorial(p.id, perfilSeleccionado.id)} className="text-zinc-600 hover:text-red-500 text-lg">🗑️</button></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {(tabPerfil === 'asistencia' || usuarioActual === 'profe') && (
                             <div className="space-y-6">
                                {usuarioActual === 'profe' && <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-center mb-4"><p className="text-zinc-400 text-sm">Finanzas Restringidas 🔒</p></div>}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-900/10 border border-blue-900/50 p-4 rounded-xl text-center">
                                        <p className="text-3xl font-bold text-white">{todasAsistencias.filter(a => a.gimnasta_id === perfilSeleccionado.id && new Date(a.fecha).getMonth() === new Date().getMonth()).length}</p>
                                        <p className="text-xs text-blue-300 uppercase font-bold mt-1">Clases Este Mes</p>
                                    </div>
                                    <div className="bg-zinc-800 p-4 rounded-xl text-center border border-zinc-700">
                                        <p className="text-3xl font-bold text-white">{todasAsistencias.filter(a => a.gimnasta_id === perfilSeleccionado.id).length}</p>
                                        <p className="text-xs text-zinc-400 uppercase font-bold mt-1">Total Año</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase text-zinc-500 mb-2">Últimas Asistencias</h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {todasAsistencias.filter(a => a.gimnasta_id === perfilSeleccionado.id).slice(0, 15).map(a => (
                                            <div key={a.id} className="bg-zinc-950 border border-zinc-800 p-2 rounded text-center text-sm text-zinc-300">
                                                {new Date(a.fecha).toLocaleDateString(undefined, {day: '2-digit', month: 'short'})}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>
                    {usuarioActual === 'admin' && (
                        <div className="border-t border-zinc-800 pt-4 mt-4 flex justify-between items-center">
                            <span className="text-zinc-500 text-xs">ID: {perfilSeleccionado.id}</span>
                            <button onClick={() => eliminarGimnasta(perfilSeleccionado.id)} className="text-red-500 text-sm hover:underline font-bold">🗑️ Eliminar Alumna</button>
                        </div>
                    )}
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