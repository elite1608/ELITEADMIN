"use client";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldAlert, Lock, UserCheck, ChevronRight, Activity, 
  Users, LayoutDashboard, UserPlus, Wallet, CreditCard, 
  Briefcase, CalendarCheck, LogOut, Menu, X, ArrowRight, Trophy
} from "lucide-react";

import CompetenciasModulo from "./Competencias"; 
import { MessageSquare } from "lucide-react";
import MensajesModulo from "./Mensajes";

// --- CONEXIÓN DIRECTA ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- UTILIDADES ---
const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]; 
const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const obtenerDiaActual = () => {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return dias[new Date().getDay()];
};
const obtenerFechaColombia = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
};

// --- COMPONENTES UI ---
const BotonMenu = ({ icono, texto, activo, onClick }: any) => (
  <button onClick={onClick} className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${activo ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-xl shadow-cyan-900/40 translate-x-2' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
      <span className={`${activo ? 'text-white' : 'text-zinc-500'}`}>{icono}</span> 
      <span className="text-[10px] font-black uppercase tracking-widest">{texto}</span>
  </button>
);

const CardDato = ({ titulo, valor, color, icono, onClick }: any) => (
  <div onClick={onClick} className={`bg-zinc-900/60 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden shadow-xl text-left group transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-cyan-500/30 hover:bg-zinc-800/80 ${onClick ? 'cursor-pointer active:scale-95' : ''}`}>
      <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.04] group-hover:scale-110 transition-transform duration-500 rotate-12">{icono}</div>
      <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-zinc-300 transition-colors">{titulo}</h3>
      <p className={`text-3xl font-bold tracking-tighter ${color} group-hover:scale-105 transition-transform origin-left`}>{valor}</p>
      {onClick && <p className="text-[9px] text-zinc-500 mt-2 uppercase font-bold tracking-widest flex items-center gap-1 group-hover:text-cyan-400 transition-colors">Ver detalles <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" /></p>}
  </div>
);

const CardCajaMenor = ({ titulo, valor, icono, colorTexto }: any) => (
    <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between transition-all duration-300 hover:scale-105 hover:bg-white/5 hover:border-white/10 hover:shadow-lg cursor-default">
        <div>
            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">{titulo}</p>
            <p className={`text-xl font-bold ${colorTexto}`}>{valor}</p>
        </div>
        <div className="text-2xl opacity-20 grayscale group-hover:grayscale-0">{icono}</div>
    </div>
);

const InputStyled = (props: any) => (
  <div className="text-left w-full">
    {props.label && <label className="text-[9px] font-black text-zinc-500 uppercase mb-1 block ml-1">{props.label}</label>}
    <input {...props} className="w-full bg-white/5 p-4 rounded-xl border border-white/10 outline-none text-white focus:border-cyan-500 transition-all focus:scale-[1.01] focus:bg-zinc-900 placeholder-zinc-700 text-sm font-bold uppercase shadow-inner" />
  </div>
);

export default function EliteManager() {
  // --- ESTADOS ---
  const [usuarioActual, setUsuarioActual] = useState<'admin' | 'profe' | null>(null);
  const [profeSesion, setProfeSesion] = useState<string | null>(null);
  const [mostrarInputAdmin, setMostrarInputAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorLogin, setErrorLogin] = useState(false);
  const [vistaActual, setVistaActual] = useState("inicio");
  
  // Estados para Login de Profesores
  const [profeSeleccionadoLogin, setProfeSeleccionadoLogin] = useState<any>(null);
  const [pinInput, setPinInput] = useState("");
  const [necesitaCambiarPin, setNecesitaCambiarPin] = useState(false);
  const [nuevoPin, setNuevoPin] = useState("");
  const [confirmarNuevoPin, setConfirmarNuevoPin] = useState("");

  const procesarLoginProfe = async (e: any) => {
      e.preventDefault();
      setErrorLogin(false);
      
      if (pinInput === profeSeleccionadoLogin.pin_acceso) {
          if (profeSeleccionadoLogin.requiere_cambio_pin) {
              setNecesitaCambiarPin(true);
          } else {
              // Si la clave es correcta y ya la había cambiado, entra directo
              setUsuarioActual('profe');
              setProfeSesion(profeSeleccionadoLogin.nombre);
              setVistaActual('asistencia');
              
              // Limpiar estados
              setProfeSeleccionadoLogin(null);
              setPinInput("");
          }
      } else {
          setErrorLogin(true);
      }
  };

  const guardarNuevoPin = async (e: any) => {
      e.preventDefault();
      if (nuevoPin.length < 4) return alert("El nuevo PIN/Clave debe tener al menos 4 caracteres.");
      if (nuevoPin !== confirmarNuevoPin) return alert("Las contraseñas no coinciden. Intenta de nuevo.");

      const { error } = await supabase.from('profesores')
          .update({ pin_acceso: nuevoPin, requiere_cambio_pin: false })
          .eq('id', profeSeleccionadoLogin.id);

      if (!error) {
          alert("¡Contraseña actualizada con éxito!");
          setUsuarioActual('profe');
          setProfeSesion(profeSeleccionadoLogin.nombre);
          setVistaActual('asistencia');
          
          // Limpiar todo
          setProfeSeleccionadoLogin(null);
          setPinInput("");
          setNecesitaCambiarPin(false);
          setNuevoPin("");
          setConfirmarNuevoPin("");
          cargarTodo(); // Refresca los datos en segundo plano
      } else {
          alert("Hubo un error al guardar. Intenta de nuevo.");
      }
  };

  // Estados de Perfil y Filtros
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<any | null>(null);
  const [tabPerfil, setTabPerfil] = useState<'finanzas' | 'asistencia'>('finanzas');
  const [modoEdicionPerfil, setModoEdicionPerfil] = useState(false);
  const [filtroDeudores, setFiltroDeudores] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mesSeleccionadoFiltro, setMesSeleccionadoFiltro] = useState(nombresMeses[new Date().getMonth()]);
  const [mesReporteDashboard, setMesReporteDashboard] = useState(nombresMeses[new Date().getMonth()]); // NUEVO ESTADO PARA EL DASHBOARD
  
  // Estados de Edición
  const [editNombre, setEditNombre] = useState("");
  const [editPaquete, setEditPaquete] = useState("");
  const [editProfesor, setEditProfesor] = useState("");
  const [editEsHermana, setEditEsHermana] = useState(false);
  const [editVencimiento, setEditVencimiento] = useState("");
  const [editDias, setEditDias] = useState<string[]>([]);
  const [editClave, setEditClave] = useState(""); // NUEVO ESTADO DE CLAVE

  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [tabCaja, setTabCaja] = useState<'ingreso' | 'egreso'>('egreso');
  
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [listaProfesores, setListaProfesores] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [pagosProfes, setPagosProfes] = useState<any[]>([]);
  const [gastosVarios, setGastosVarios] = useState<any[]>([]);
  const [ingresosExtra, setIngresosExtra] = useState<any[]>([]);
  const [todasAsistencias, setTodasAsistencias] = useState<any[]>([]);

  // --- FORMULARIOS ---
  const [formNombre, setFormNombre] = useState("");
  const [formClave, setFormClave] = useState(""); // NUEVO ESTADO DE CLAVE
  const [formPaqueteId, setFormPaqueteId] = useState("");
  const [formDias, setFormDias] = useState<string[]>([]);
  const [formProfesor, setFormProfesor] = useState(""); 
  const [formPagoInmediato, setFormPagoInmediato] = useState(true);
  const [formEsHermana, setFormEsHermana] = useState(false);
  const [formFechaManual, setFormFechaManual] = useState(obtenerFechaColombia());
  
  const [nuevoGastoMonto, setNuevoGastoMonto] = useState("");
  const [nuevoGastoConcepto, setNuevoGastoConcepto] = useState("");
  const [nuevoGastoCategoria, setNuevoGastoCategoria] = useState("Mantenimiento");

  const [nuevoIngresoMonto, setNuevoIngresoMonto] = useState("");
  const [nuevoIngresoNota, setNuevoIngresoNota] = useState("");
  const [nuevoIngresoCategoria, setNuevoIngresoCategoria] = useState("Uniforme");
  
  const [nominaProfe, setNominaProfe] = useState("");
  const [nominaFechaInicio, setNominaFechaInicio] = useState("");
  const [nominaFechaFin, setNominaFechaFin] = useState("");
  const [nominaMetodo, setNominaMetodo] = useState("Nequi");
  const [clasesCalculadas, setClasesCalculadas] = useState(0);
  
  const [nuevoProfeNombre, setNuevoProfeNombre] = useState("");

  // --- CARGAS Y EFECTOS ---
  useEffect(() => {
    const cargarBasicos = async () => {
      const { data } = await supabase.from("profesores").select("*").eq('activo', true).order('nombre');
      if (data && data.length > 0) { 
        setListaProfesores(data); 
        setFormProfesor(data[0].nombre); 
        setNominaProfe(data[0].nombre);
      }
    };
    cargarBasicos();
  }, []);

  useEffect(() => { if(usuarioActual) cargarTodo(); }, [usuarioActual]);

  useEffect(() => {
    if (nominaProfe && nominaFechaInicio && nominaFechaFin) {
        const asistEnRango = todasAsistencias.filter(a => a.fecha >= nominaFechaInicio && a.fecha <= nominaFechaFin);
        const idsAlumnasProfe = estudiantes.filter(e => e.profesor === nominaProfe).map(e => e.id);
        const asistProfe = asistEnRango.filter(a => idsAlumnasProfe.includes(a.gimnasta_id));
        setClasesCalculadas(Array.from(new Set(asistProfe.map(a => a.fecha))).length);
    } else { setClasesCalculadas(0); }
  }, [nominaProfe, nominaFechaInicio, nominaFechaFin, todasAsistencias, estudiantes]);

  const cargarTodo = async () => {
    const { data: paq } = await supabase.from("paquetes").select("*").order('precio'); setPaquetes(paq || []);
    const { data: est } = await supabase.from("gimnastas").select(`*, paquetes(*)`).order('nombre'); setEstudiantes(est || []);
    const { data: asis } = await supabase.from("asistencias").select("*").order('fecha', { ascending: false }); setTodasAsistencias(asis || []);
    const { data: pagAlumnas } = await supabase.from("pagos").select(`*, gimnastas(nombre)`).order('created_at', { ascending: false }); setPagos(pagAlumnas || []);
    const { data: pagProf } = await supabase.from("pagos_profesores").select("*").order('created_at', { ascending: false }); setPagosProfes(pagProf || []);
    const { data: gas } = await supabase.from("gastos_varios").select("*").order('created_at', { ascending: false }); setGastosVarios(gas || []);
    const { data: ing } = await supabase.from("ingresos_varios").select("*").order('created_at', { ascending: false }); setIngresosExtra(ing || []);
    const { data: prof } = await supabase.from("profesores").select("*").eq('activo', true).order('nombre'); if (prof) setListaProfesores(prof);
  };

  const loginAdmin = (e: any) => {
    e.preventDefault();
    if (passwordInput === "" || passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) { 
        setUsuarioActual('admin'); 
        setVistaActual('directorio'); 
        setFiltroDeudores(false);
        setErrorLogin(false);
    } else {
        setErrorLogin(true);
    }
  };

  const fondoApp = "url('/logob.png')";

  // 🔴 PUERTA DE SEGURIDAD 
  if (!usuarioActual) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden text-left font-sans">
        <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: fondoApp, backgroundSize: '400px', backgroundRepeat: 'repeat', backgroundPosition: 'center'}}></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-sm bg-zinc-900/60 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl animate-in zoom-in duration-500">
          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full"></div>
            <img src="/logob.png" alt="Logo" className="w-24 h-24 relative z-10 object-contain drop-shadow-2xl" />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-white text-2xl font-black mb-1 uppercase tracking-tighter">Elite Gymnastics</h1>
            <p className="text-cyan-600 text-[9px] font-black tracking-[0.4em] uppercase">Gestión Interna</p>
          </div>

          {!mostrarInputAdmin ? (
            <div className="space-y-4">
              
              {/* SI NO HA SELECCIONADO PROFE, MUESTRA LA LISTA */}
              {!profeSeleccionadoLogin ? (
                  <>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center mb-4">Selecciona tu perfil</p>
                      {listaProfesores.map(p => (
                        <button key={p.id} onClick={() => setProfeSeleccionadoLogin(p)} 
                          className="w-full group bg-white/5 text-zinc-300 py-4 px-6 rounded-2xl flex items-center justify-between hover:bg-cyan-950/40 hover:text-cyan-400 transition-all border border-white/5 hover:border-cyan-500/30 text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 shadow-lg">
                          <div className="flex items-center gap-3">
                            <UserCheck size={18} className="opacity-50 group-hover:opacity-100" />
                            <span>{p.nombre}</span>
                          </div>
                          <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                        </button>
                      ))}
                      
                      <div className="pt-6 mt-6 border-t border-white/5">
                        <button onClick={() => setMostrarInputAdmin(true)} className="w-full flex items-center justify-center gap-2 text-zinc-600 py-3 text-[10px] font-black tracking-widest uppercase hover:text-white transition-colors">
                          <Activity size={14} /> Acceso Dirección
                        </button>
                      </div>
                  </>
              ) : (
                  
                  // SI YA SELECCIONÓ UN PROFE, MUESTRA EL FORMULARIO
                  <div className="animate-in slide-in-from-right-4 duration-300">
                      <div className="mb-6 flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                          <div className="w-10 h-10 bg-cyan-600/20 text-cyan-400 rounded-full flex items-center justify-center"><UserCheck size={18}/></div>
                          <div>
                              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">Perfil Seleccionado</p>
                              <p className="text-white text-xs font-bold uppercase leading-none">{profeSeleccionadoLogin.nombre}</p>
                          </div>
                      </div>

                      {!necesitaCambiarPin ? (
                          <form onSubmit={procesarLoginProfe} className="space-y-4">
                              <div className="relative">
                                  <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                                  <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950/50 text-white text-sm font-bold focus:border-cyan-500 outline-none border border-white/10 focus:bg-zinc-900/80 transition-all" placeholder="PIN de Acceso" autoFocus />
                              </div>
                              
                              {errorLogin && (
                                  <p className="text-[10px] font-black text-red-400 text-center animate-in shake">Clave incorrecta</p>
                              )}

                              <button type="submit" className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-cyan-900/20 hover:scale-[1.02] active:scale-95 transition-all">Ingresar</button>
                              
                              <button type="button" onClick={() => {setProfeSeleccionadoLogin(null); setErrorLogin(false); setPinInput("");}} className="w-full text-zinc-500 text-[10px] uppercase font-black hover:text-white transition-colors pt-2">← Cambiar Perfil</button>
                          </form>
                      ) : (
                          <form onSubmit={guardarNuevoPin} className="space-y-4 animate-in zoom-in">
                              <p className="text-[10px] text-cyan-400 font-bold leading-relaxed mb-4 text-center">Por seguridad, debes crear un PIN o clave secreta antes de continuar.</p>
                              
                              <div className="relative">
                                  <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                                  <input type="password" value={nuevoPin} onChange={e => setNuevoPin(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950 text-white text-sm font-bold focus:border-cyan-500 outline-none border border-white/10 transition-all" placeholder="Nueva Contraseña" required autoFocus/>
                              </div>
                              <div className="relative">
                                  <UserCheck size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                                  <input type="password" value={confirmarNuevoPin} onChange={e => setConfirmarNuevoPin(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950 text-white text-sm font-bold focus:border-cyan-500 outline-none border border-white/10 transition-all" placeholder="Repite la Contraseña" required />
                              </div>

                              <button type="submit" className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-cyan-900/20 hover:scale-[1.02] active:scale-95 transition-all">Guardar Clave</button>
                          </form>
                      )}
                  </div>
              )}
            </div>
          ) : (
            <form onSubmit={loginAdmin} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                <input 
                  type="password" 
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)} 
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-950/50 text-white text-lg focus:border-cyan-500 outline-none border transition-all ${errorLogin ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:bg-zinc-900/80'}`} 
                  placeholder="Contraseña" 
                  autoFocus 
                />
              </div>

              {errorLogin && (
                  <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl flex items-start gap-3 animate-in shake">
                      <ShieldAlert size={18} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-red-400 uppercase leading-tight">Acceso Denegado</p>
                        <p className="text-[9px] text-red-300/80 mt-1">Clave incorrecta. Intento registrado.</p>
                      </div>
                  </div>
              )}

              <button type="submit" className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-cyan-900/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2">
                Ingresar al Sistema
              </button>
              
              <button type="button" onClick={() => {setMostrarInputAdmin(false); setErrorLogin(false);}} className="w-full text-zinc-500 text-[10px] uppercase font-black hover:text-white transition-colors pt-2">
                ← Volver a Profesores
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 🟢 MATEMÁTICAS Y FUNCIONES
  const totalIngresosMensualidad = pagos
    .filter(p => p.gimnastas !== null) 
    .reduce((sum, p) => sum + p.monto, 0);

  const totalPagosProfes = pagosProfes.reduce((sum, p) => sum + p.monto, 0);
  const totalGastosOperativos = gastosVarios.reduce((sum, g) => sum + g.monto, 0);
  const balanceReal = totalIngresosMensualidad - (totalPagosProfes + totalGastosOperativos);

  const cajaUniformes = ingresosExtra.filter(i => i.categoria === 'Uniforme').reduce((acc, i) => acc + i.monto, 0);
  const cajaCompetencias = ingresosExtra.filter(i => i.categoria === 'Competencia').reduce((acc, i) => acc + i.monto, 0);
  const cajaPersonalizadas = ingresosExtra.filter(i => i.categoria === 'Clase Personalizada').reduce((acc, i) => acc + i.monto, 0);
  const cajaOtros = ingresosExtra.filter(i => i.categoria === 'Otros').reduce((acc, i) => acc + i.monto, 0);

  // 1. INGRESO ESTIMADO (Mensual si todas pagan)
  const proyeccionMensual = estudiantes.reduce((acc, e) => {
      let precio = e.paquetes?.precio || 0;
      if (e.es_hermana) precio = precio / 2;
      return acc + precio;
  }, 0);

  // 2. CÁLCULO DE MORA 
  const calcularMora = (gimnasta: any) => {
    const hoy = new Date();
    const venc = new Date(gimnasta.proximo_vencimiento);
    if (venc >= hoy) return { meses: 0, nombres: [], deudaTotal: 0, precioIndividual: 0 };
    
    let mesesMora: string[] = [];
    let temp = new Date(venc);
    while (temp < hoy) {
        mesesMora.push(nombresMeses[temp.getMonth()]);
        temp.setMonth(temp.getMonth() + 1);
    }
    
    let precioPlan = gimnasta.paquetes?.precio || 0;
    if (gimnasta.es_hermana) {
        precioPlan = precioPlan / 2;
    }

    return { 
        meses: mesesMora.length, 
        nombres: mesesMora, 
        deudaTotal: mesesMora.length * precioPlan,
        precioIndividual: precioPlan
    };
  };

  // 3. DEUDA TOTAL ACUMULADA (Todos los meses de todas las niñas en mora)
  const calcularDeudaTotalDashboard = () => {
      return estudiantes.reduce((acc, e) => {
          return acc + calcularMora(e).deudaTotal;
      }, 0);
  };

  // 4. LÓGICA: REPORTE MENSUAL ESPECÍFICO PARA DASHBOARD
  const indexMesReporte = nombresMeses.indexOf(mesReporteDashboard);
  
  const ingresosMesSeleccionado = pagos.filter(p => {
      const fecha = new Date(p.created_at);
      return fecha.getMonth() === indexMesReporte && fecha.getFullYear() === new Date().getFullYear() && p.gimnastas !== null;
  }).reduce((sum, p) => sum + p.monto, 0);

  const deudorasMesSeleccionado = estudiantes.filter(e => {
      const mora = calcularMora(e);
      return mora.nombres.includes(mesReporteDashboard);
  });

  const generarMensajeCobro = (gimnasta: any, meses: string[], deuda: number, esFiltroMes: boolean = false) => {
      let textoMeses = meses.join(", ");
      let montoTexto = deuda.toLocaleString();
      
      const mensaje = esFiltroMes 
        ? `Hola! Un saludo especial de Elite Gymnastics. Le recordamos amablemente que ${gimnasta.nombre} tiene pendiente el pago de mensualidad del mes de ${mesSeleccionadoFiltro} por un valor de $${montoTexto}. Agradecemos su gestión para ponerse al día.`
        : `Hola! Un saludo especial de Elite Gymnastics. Le recordamos amablemente que ${gimnasta.nombre} presenta un saldo pendiente de $${montoTexto} correspondiente a los meses de: ${textoMeses}. Agradecemos su gestión para ponerse al día.`;
        
      const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
  };

  const agregarProfesor = async () => {
      if (!nuevoProfeNombre) return alert("Escribe un nombre");
      if (!confirm(`¿Contratar a ${nuevoProfeNombre}?`)) return;
      
      const { error } = await supabase.from("profesores").insert([{ 
          nombre: nuevoProfeNombre, 
          activo: true,
          pin_acceso: '1234',            // <-- PIN POR DEFECTO
          requiere_cambio_pin: true      // <-- OBLIGA A CAMBIARLO
      }]);
      
      if (error) { alert("Error al agregar."); } else { alert("✅ Profesor agregado"); setNuevoProfeNombre(""); cargarTodo(); }
  };

  const eliminarProfesor = async (id: number, nombre: string) => {
      if (!confirm(`¿Estás seguro de que quieres eliminar a ${nombre}? Esta acción es irreversible.`)) return;
      const { error } = await supabase.from("profesores").update({ activo: false }).eq('id', id);
      if (error) alert("Error al eliminar");
      else { alert("✅ Profesor eliminado"); cargarTodo(); }
  };

  const iniciarEdicion = (gimnasta: any) => {
      setEditNombre(gimnasta.nombre);
      setEditPaquete(gimnasta.paquete_id);
      setEditProfesor(gimnasta.profesor);
      setEditEsHermana(gimnasta.es_hermana || false);
      setEditDias(gimnasta.dias || []);
      setEditVencimiento(new Date(gimnasta.proximo_vencimiento).toISOString().split('T')[0]);
      setEditClave(gimnasta.clave_acceso || ""); // Llenar clave
      setModoEdicionPerfil(true);
  };

  const toggleEditDia = (dia: string) => {
    if (editDias.includes(dia)) {
        setEditDias(editDias.filter(d => d !== dia));
    } else {
        setEditDias([...editDias, dia]);
    }
  };

  const guardarCambiosPerfil = async () => {
      const confirmacion = prompt("SEGURIDAD: Para guardar los cambios, escribe CONFIRMAR en mayúsculas:");
      if (confirmacion !== "CONFIRMAR") return alert("❌ Cambio cancelado. No escribiste la palabra clave correctamente.");
      
      const { error } = await supabase.from("gimnastas").update({ 
          nombre: editNombre, 
          paquete_id: editPaquete, 
          profesor: editProfesor,
          es_hermana: editEsHermana,
          dias: editDias, 
          proximo_vencimiento: new Date(editVencimiento).toISOString(),
          clave_acceso: editClave,        // Clave editada
          requiere_cambio_clave: true     // Fuerza a cambiarla al papá
      }).eq('id', perfilSeleccionado.id);

      if (error) alert("Error al guardar");
      else { 
          alert("✅ Cambios guardados"); 
          setModoEdicionPerfil(false); 
          setPerfilSeleccionado({ 
              ...perfilSeleccionado, 
              nombre: editNombre, 
              paquete_id: editPaquete, 
              profesor: editProfesor, 
              es_hermana: editEsHermana,
              dias: editDias,
              proximo_vencimiento: new Date(editVencimiento).toISOString(),
              clave_acceso: editClave,
              paquetes: paquetes.find(p => p.id == editPaquete) 
          }); 
          cargarTodo(); 
      }
  };

  const registrarGasto = async () => {
    if (!nuevoGastoMonto || !nuevoGastoConcepto) return alert("Faltan datos");
    await supabase.from("gastos_varios").insert([{ monto: Number(nuevoGastoMonto), concepto: nuevoGastoConcepto, categoria: nuevoGastoCategoria }]);
    setNuevoGastoMonto(""); setNuevoGastoConcepto(""); cargarTodo(); alert("Salida registrada");
  };

  const registrarIngresoExtra = async () => {
    if (!nuevoIngresoMonto || !nuevoIngresoCategoria) return alert("Faltan datos");
    await supabase.from("ingresos_varios").insert([{ 
        monto: Number(nuevoIngresoMonto), 
        categoria: nuevoIngresoCategoria, 
        nota: nuevoIngresoNota 
    }]);
    setNuevoIngresoMonto(""); setNuevoIngresoNota(""); cargarTodo(); alert("Ingreso a caja variable registrado");
  };

  const registrarPagoNomina = async () => {
    const totalPagar = clasesCalculadas * 45000;
    if (totalPagar <= 0) return alert("No hay clases para pagar");
    if (!confirm(`¿Confirmar pago de $${totalPagar.toLocaleString()} a ${nominaProfe} vía ${nominaMetodo}?`)) return;
    await supabase.from("pagos_profesores").insert([{ profesor: nominaProfe, monto: totalPagar, clases_pagadas: clasesCalculadas, fecha_pago: obtenerFechaColombia(), metodo: nominaMetodo }]);
    setNominaFechaInicio(""); setNominaFechaFin(""); cargarTodo(); alert("Pago registrado.");
  };

  const toggleDia = (dia: string) => {
    if (formDias.includes(dia)) {
        setFormDias(formDias.filter(d => d !== dia));
    } else {
        setFormDias([...formDias, dia]);
    }
  };

  const inscribirGimnasta = async () => {
    if (!formNombre || !formPaqueteId || !formClave) return alert("Faltan datos, asegúrate de asignar la clave.");
    const fechaBase = new Date(formFechaManual);
    const vencimiento = new Date(fechaBase);
    if (formPagoInmediato) vencimiento.setDate(fechaBase.getDate() + 30); else vencimiento.setDate(fechaBase.getDate() - 1);
    
    const precioFull = paquetes.find(p => p.id == formPaqueteId)?.precio || 0;
    const montoInicial = formEsHermana ? (precioFull / 2) : precioFull;
    
    const { data: nueva } = await supabase.from("gimnastas").insert([{ 
        nombre: formNombre, 
        paquete_id: formPaqueteId, 
        dias: formDias, 
        profesor: formProfesor, 
        estado: formPagoInmediato ? "Activo" : "Pendiente", 
        proximo_vencimiento: vencimiento.toISOString(), 
        created_at: fechaBase.toISOString(),
        es_hermana: formEsHermana,
        clave_acceso: formClave,          // Guardamos clave
        requiere_cambio_clave: true       // Forzamos al papá a cambiarla
    }]).select().single();

    if (formPagoInmediato && nueva) {
      await supabase.from("pagos").insert([{ gimnasta_id: nueva.id, monto: montoInicial, concepto: formEsHermana ? "Inscripción (Desc. Hermana)" : "Inscripción", created_at: fechaBase.toISOString() }]);
    }
    alert("Inscripción exitosa"); 
    setFormNombre(""); 
    setFormClave(""); 
    setFormDias([]); 
    cargarTodo(); 
    setVistaActual('directorio');
  };

  const editarPago = async (pago: any) => {
      const nuevoMonto = prompt("Nuevo monto:", pago.monto);
      if (nuevoMonto !== null) { await supabase.from("pagos").update({ monto: Number(nuevoMonto) }).eq('id', pago.id); cargarTodo(); }
  };

  const borrarPago = async (id: number) => {
      if (confirm("¿Eliminar este registro permanentemente?")) { await supabase.from("pagos").delete().eq('id', id); cargarTodo(); }
  };

  const eliminarGimnasta = async (id: number) => {
      if (confirm("⚠️ ATENCIÓN: ¿Retirar alumna?\n\nEsta acción borrará PERMANENTEMENTE a la alumna, su historial de pagos y su asistencia.\n\n¿Estás seguro?")) { 
          await supabase.from("pagos").delete().eq('gimnasta_id', id);
          await supabase.from("asistencias").delete().eq('gimnasta_id', id);
          await supabase.from("gimnastas").delete().eq('id', id); 
          
          setPerfilSeleccionado(null); 
          cargarTodo(); 
      }
  };

  const registrarPagoMensualidad = async (gimnasta: any) => {
    let aplicaDescuento = gimnasta.es_hermana;
    if (!aplicaDescuento) {
        aplicaDescuento = confirm(`Esta alumna NO está marcada como hermana.\n¿Desea aplicar descuento manual del 50% solo por esta vez?\n\nAceptar = SÍ\nCancelar = NO`);
    } else {
        if(!confirm(`Esta alumna tiene descuento de HERMANA activo.\nSe cobrará el 50%.\n¿Continuar?`)) return;
    }
    const precioFull = gimnasta.paquetes?.precio || 0;
    const montoFinal = aplicaDescuento ? (precioFull / 2) : precioFull;
    const conceptoFinal = aplicaDescuento ? "Mensualidad (Desc. Hermana)" : "Mensualidad";
    if (!confirm(`¿Confirmar cobro de $${montoFinal.toLocaleString()} a ${gimnasta.nombre}?`)) return;
    const fVence = new Date(gimnasta.proximo_vencimiento);
    fVence.setDate(fVence.getDate() + 30);
    await supabase.from("gimnastas").update({ proximo_vencimiento: fVence.toISOString() }).eq('id', gimnasta.id);
    await supabase.from("pagos").insert({ gimnasta_id: gimnasta.id, monto: montoFinal, concepto: conceptoFinal });
    cargarTodo(); alert("Pago registrado");
  };

  const toggleAsistencia = async (gimnastaId: number) => {
    const hoyStr = obtenerFechaColombia();
    const asistido = todasAsistencias.find(a => a.gimnasta_id === gimnastaId && a.fecha === hoyStr);
    if (asistido) { await supabase.from("asistencias").delete().match({ id: asistido.id }); } 
    else { await supabase.from("asistencias").insert({ gimnasta_id: gimnastaId, fecha: hoyStr, presente: true }); }
    cargarTodo();
  };

  // --- INTERFAZ ---
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans relative">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: fondoApp, backgroundSize: '300px', backgroundRepeat: 'repeat', backgroundPosition: 'center'}}></div>
      
      {/* NAVEGACION MOVIL */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-black/80 backdrop-blur-lg p-4 z-40 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2 text-left"><img src="/logob.png" className="w-8 h-8 object-contain" /><h1 className="text-[10px] font-bold uppercase tracking-tight">Elite Barranquilla</h1></div>
        <button onClick={() => setMenuMovilAbierto(!menuMovilAbierto)} className="p-2 bg-white/5 rounded-lg text-xl">
            {menuMovilAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900/95 backdrop-blur-xl border-r border-white/10 p-6 transform transition-transform duration-300 ${menuMovilAbierto ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:block text-left shadow-2xl`}>
        <div className="flex items-center gap-3 mb-10 hidden md:flex">
             <img src="/logob.png" className="w-10 h-10 object-contain hover:scale-110 transition-transform duration-500" />
             <div className="leading-none text-left"><h1 className="text-sm font-bold uppercase tracking-tighter text-white">Elite Gymnastics</h1><p className="text-cyan-600 text-[8px] font-black tracking-widest uppercase">Barranquilla</p></div>
        </div>
        
        <nav className="space-y-1.5 flex-1 mt-12 md:mt-0">
          {usuarioActual === 'admin' && (
            <>
              <BotonMenu icono={<Users size={18} />} texto="Directorio" activo={vistaActual === 'directorio'} onClick={() => {setVistaActual('directorio'); setMenuMovilAbierto(false)}} />
              <BotonMenu icono={<LayoutDashboard size={18} />} texto="Dashboard" activo={vistaActual === 'inicio'} onClick={() => {setVistaActual('inicio'); setMenuMovilAbierto(false)}} />
              <BotonMenu icono={<UserPlus size={18} />} texto="Inscribir" activo={vistaActual === 'inscripciones'} onClick={() => {setVistaActual('inscripciones'); setMenuMovilAbierto(false)}} />
              <BotonMenu icono={<Wallet size={18} />} texto="Gastos y Caja" activo={vistaActual === 'gastos'} onClick={() => {setVistaActual('gastos'); setMenuMovilAbierto(false)}} />
              <BotonMenu icono={<CreditCard size={18} />} texto="Nómina Profes" activo={vistaActual === 'nomina'} onClick={() => {setVistaActual('nomina'); setMenuMovilAbierto(false)}} />
              <BotonMenu icono={<Briefcase size={18} />} texto="Gestionar Equipo" activo={vistaActual === 'equipo'} onClick={() => {setVistaActual('equipo'); setMenuMovilAbierto(false)}} />
              <BotonMenu icono={<MessageSquare size={18} />} texto="Buzón / Chat" activo={vistaActual === 'mensajes'}  onClick={() => {setVistaActual('mensajes'); setMenuMovilAbierto(false)}} />
            </>
          )}
          
          <BotonMenu icono={<CalendarCheck size={18} />} texto="Asistencia Hoy" activo={vistaActual === 'asistencia'} onClick={() => {setVistaActual('asistencia'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<Trophy size={18} />} texto="Competencias" activo={vistaActual === 'competencias'} onClick={() => {setVistaActual('competencias'); setMenuMovilAbierto(false)}} />
        </nav>
        
        
        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 text-left shadow-inner">
            <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Sesión Activa:</p>
            <p className="text-xs font-bold text-cyan-400 truncate uppercase tracking-tighter">{usuarioActual === 'admin' ? 'DIRECCIÓN ELITE' : profeSesion}</p>
        </div>
        <button onClick={() => setUsuarioActual(null)} className="text-zinc-600 flex items-center gap-2 hover:text-white text-[10px] uppercase font-bold tracking-widest pt-4 border-t border-white/10 w-full text-left transition-colors">
            <LogOut size={14} /> Cerrar Sesión
        </button>
      </aside>

      <main className="flex-1 p-4 pt-24 md:p-12 md:pt-12 overflow-x-hidden relative z-10 text-left">
        
        {/* DASHBOARD */}
        {vistaActual === 'inicio' && usuarioActual === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-500 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <CardDato titulo="Gimnastas Totales" valor={estudiantes.length} color="text-white" icono="👧" />
                
                <CardDato 
                    titulo="Caja Real (Operativa)" 
                    valor={`$${balanceReal.toLocaleString()}`} 
                    color={balanceReal >= 0 ? 'text-emerald-400' : 'text-red-400'} 
                    icono="📊" 
                />

                <CardDato 
                    onClick={() => {setFiltroDeudores(true); setVistaActual('directorio')}} 
                    titulo="Deuda Total Acumulada" 
                    valor={`$${calcularDeudaTotalDashboard().toLocaleString()}`} 
                    color="text-rose-500" 
                    icono="💰" 
                />

                <CardDato 
                    titulo="Ingreso Estimado (Mensual)" 
                    valor={`$${proyeccionMensual.toLocaleString()}`} 
                    color="text-cyan-400" 
                    icono="📈" 
                />
            </div>

            {/* REPORTE MENSUAL DETALLADO (DISEÑO LIMPIO) */}
            <div className="mt-10 animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">Reporte Financiero</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Desglose por mes</p>
                    </div>
                    {/* SELECTOR DE MES */}
                    <select 
                        className="bg-zinc-900 border border-white/10 text-cyan-400 text-xs font-black uppercase px-4 py-2 rounded-xl outline-none focus:border-cyan-500 cursor-pointer shadow-lg hover:bg-zinc-800 transition-colors"
                        value={mesReporteDashboard}
                        onChange={(e) => setMesReporteDashboard(e.target.value)}
                    >
                        {nombresMeses.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                
                <div className="bg-zinc-900/60 backdrop-blur-md p-6 lg:p-8 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col md:flex-row gap-8">
                    
                    {/* PANEL IZQUIERDO: Resumen de Caja */}
                    <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-8 flex flex-col justify-center">
                        <div className="mb-6">
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Total Recaudado
                            </p>
                            <p className="text-4xl font-black text-green-400 tracking-tighter">${ingresosMesSeleccionado.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Dinero en Mora
                            </p>
                            <p className="text-2xl font-bold text-red-400 tracking-tight">-${(deudorasMesSeleccionado.reduce((sum, d) => {
                                let p = d.paquetes?.precio || 0; return sum + (d.es_hermana ? p/2 : p);
                            }, 0)).toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1">{deudorasMesSeleccionado.length} alumnas pendientes</p>
                        </div>
                    </div>
                    
                    {/* PANEL DERECHO: Lista de Deudoras de ese mes */}
                    <div className="flex-1 max-h-[220px] overflow-y-auto custom-scrollbar pr-2 flex flex-col">
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-4 sticky top-0 bg-zinc-900/90 py-1 z-10 backdrop-blur-sm">Detalle de Deudoras ({mesReporteDashboard})</p>
                        
                        {deudorasMesSeleccionado.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-white/5 p-8 text-center">
                                <span className="text-3xl mb-2">🎉</span>
                                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Cero deudas este mes</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {deudorasMesSeleccionado.map(d => (
                                    <div key={d.id} className="flex justify-between items-center bg-red-500/10 p-3 lg:p-4 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-black">
                                                {d.nombre.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold text-zinc-200 uppercase tracking-tight">{d.nombre}</span>
                                        </div>
                                        <span className="text-xs font-black text-red-400 bg-red-950/50 px-3 py-1 rounded-lg">
                                            ${(d.es_hermana ? (d.paquetes?.precio||0)/2 : (d.paquetes?.precio||0)).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* COMPETENCIAS */}
        {vistaActual === 'competencias' && (
            <CompetenciasModulo 
                estudiantes={estudiantes} 
                esAdmin={usuarioActual === 'admin'} 
            />
        )}
        {/* MENSAJES */}
        {vistaActual === 'mensajes' && (
            <MensajesModulo estudiantes={estudiantes} />
        )}
        {/* DIRECTORIO */}
        {vistaActual === 'directorio' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold uppercase tracking-tighter">Directorio de Gimnastas</h2>
                        <div className="flex gap-2">
                            {filtroDeudores && (
                                <select 
                                    className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full uppercase font-black outline-none"
                                    value={mesSeleccionadoFiltro}
                                    onChange={(e) => setMesSeleccionadoFiltro(e.target.value)}
                                >
                                    {nombresMeses.map(m => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
                                </select>
                            )}
                            <button 
                                onClick={() => setFiltroDeudores(!filtroDeudores)} 
                                className={`text-[10px] px-3 py-1 rounded-full uppercase font-bold transition-all ${filtroDeudores ? 'bg-cyan-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                            >
                                {filtroDeudores ? 'Ver Todas' : '🔍 Filtrar Deudores'}
                            </button>
                        </div>
                    </div>
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar alumna..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none text-white font-bold uppercase text-sm focus:border-cyan-500 transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {estudiantes.filter(e => {
                        const mora = calcularMora(e);
                        const coincideMes = filtroDeudores ? mora.nombres.includes(mesSeleccionadoFiltro) : true;
                        const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
                        return coincideMes && coincideBusqueda;
                    }).map(e => {
                        const mora = calcularMora(e);
                        return (
                            <div key={e.id} onClick={() => {setPerfilSeleccionado(e); setTabPerfil('finanzas'); setModoEdicionPerfil(false);}} className={`p-4 backdrop-blur-md border rounded-2xl flex items-center gap-4 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all text-left group ${mora.meses > 0 ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' : 'bg-zinc-900/60 border-white/10 hover:bg-zinc-800'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner ${mora.meses > 0 ? 'bg-red-500/20' : 'bg-white/5'}`}>🤸</div>
                                <div className="text-left overflow-hidden flex-1">
                                    <p className="font-bold text-sm uppercase leading-none mb-1 truncate group-hover:text-white transition-colors">{e.nombre}</p>
                                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                                        {filtroDeudores 
                                            ? `DEBE ${mesSeleccionadoFiltro.toUpperCase()}: $${mora.precioIndividual.toLocaleString()}` 
                                            : (mora.meses > 0 ? `DEBE $${mora.deudaTotal.toLocaleString()}` : 'AL DÍA')}
                                    </p>
                                </div>
                                {filtroDeudores && (
                                    <button 
                                        onClick={(btnEvent) => {
                                            btnEvent.stopPropagation();
                                            generarMensajeCobro(e, [mesSeleccionadoFiltro], mora.precioIndividual, true);
                                        }}
                                        className="bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white p-2 rounded-xl transition-all"
                                        title="Cobrar este mes"
                                    >
                                        📱
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                {estudiantes.filter(e => filtroDeudores && calcularMora(e).nombres.includes(mesSeleccionadoFiltro)).length === 0 && filtroDeudores && (
                    <div className="text-center py-20 opacity-20">
                        <p className="text-5xl mb-4">✅</p>
                        <p className="font-black uppercase tracking-widest text-xs">No hay deudas pendientes para {mesSeleccionadoFiltro}</p>
                    </div>
                )}
            </div>
        )}

        {/* EQUIPO */}
        {vistaActual === 'equipo' && (
            <div className="max-w-xl mx-auto bg-zinc-900/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
                <h2 className="text-xl font-bold text-center uppercase tracking-widest mb-4">Gestión de Personal</h2>
                <div className="space-y-4">
                    <p className="text-[10px] text-zinc-400 text-center uppercase">Agregar un nuevo profesor permitirá que este aparezca automáticamente en la nómina y en las opciones de inscripción.</p>
                    <InputStyled label="Nombre del Profesor/a" placeholder="Ej: Profe Juan" value={nuevoProfeNombre} onChange={(e: any) => setNuevoProfeNombre(e.target.value)} />
                    <button onClick={agregarProfesor} className="w-full bg-cyan-600 hover:bg-cyan-500 font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-cyan-900/40 hover:scale-[1.02] active:scale-95 transition-all">Contratar Profesor</button>
                </div>
                <div className="mt-8 border-t border-white/5 pt-6">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-4 text-center">Equipo Actual</p>
                    <div className="space-y-2">
                        {listaProfesores.map(p => (
                            <div key={p.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                                <span className="text-xs font-bold uppercase text-white flex items-center gap-2">
                                    👤 {p.nombre} 
                                    <span className="text-[8px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-black uppercase">Activo</span>
                                </span>
                                <button onClick={() => eliminarProfesor(p.id, p.nombre)} className="text-zinc-600 hover:text-red-500 transition-colors p-2 active:scale-90" title="Eliminar Profesor">
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* ASISTENCIA */}
        {vistaActual === 'asistencia' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-tighter mb-6 text-left">Asistencia: {obtenerDiaActual()}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {estudiantes.filter(e => (!profeSesion || e.profesor === profeSesion) && (e.dias || []).includes(obtenerDiaActual())).map(e => {
                const asistido = todasAsistencias.some(a => a.gimnasta_id === e.id && a.fecha === obtenerFechaColombia());
                return (
                  <div key={e.id} className={`p-5 rounded-2xl border flex justify-between items-center backdrop-blur-md transition-all duration-300 ${asistido ? 'bg-cyan-600/20 border-cyan-500 shadow-lg scale-[1.02]' : 'bg-zinc-900/60 border-white/10 hover:bg-zinc-800'}`}>
                    <div className="text-left"><p className="font-bold text-sm uppercase leading-tight">{e.nombre}</p><p className="text-[9px] text-zinc-500 uppercase font-black">{e.paquetes?.nombre}</p></div>
                    <button onClick={() => toggleAsistencia(e.id)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${asistido ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40' : 'bg-white/5 text-zinc-700 hover:bg-white/10'}`}>{asistido ? "✓" : "+"}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* INSCRIPCION */}
        {vistaActual === 'inscripciones' && (
            <div className="max-w-xl mx-auto bg-zinc-900/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
                <h2 className="text-xl font-bold text-center uppercase tracking-widest mb-4">Nueva Alumna Elite</h2>
                <InputStyled label="Nombre Completo" placeholder="Nombre..." value={formNombre} onChange={(e: any) => setFormNombre(e.target.value)} />
                <InputStyled label="Clave Inicial (Contraseña temporal)" placeholder="Ej: 123456 o Doc. Identidad" value={formClave} onChange={(e: any) => setFormClave(e.target.value)} />
                <InputStyled label="Fecha de Registro" type="date" value={formFechaManual} onChange={(e: any) => setFormFechaManual(e.target.value)} />
                
                <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                        <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-1">Plan Mensual</label>
                        <select className="bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-xs font-bold uppercase focus:border-cyan-500 transition-colors" value={formPaqueteId} onChange={(e: any) => setFormPaqueteId(e.target.value)}>
                            <option value="" className="bg-zinc-900">PLAN...</option>
                            {paquetes.map(p => <option key={p.id} value={p.id} className="bg-zinc-900">{p.nombre} - $ {p.precio.toLocaleString()}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-1">Profesor Responsable</label>
                        <select className="bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-xs font-bold uppercase focus:border-cyan-500 transition-colors" value={formProfesor} onChange={(e: any) => setFormProfesor(e.target.value)}>{listaProfesores.map(p => <option key={p.id} value={p.nombre} className="bg-zinc-900">{p.nombre}</option>)}</select>
                    </div>
                </div>

                <div className="text-left">
                     <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-2">Días de Clase</label>
                     <div className="flex flex-wrap gap-2">
                         {diasSemana.map(dia => (
                            <button key={dia} onClick={() => toggleDia(dia)} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 ${formDias.includes(dia) ? 'bg-cyan-600 text-white shadow-md' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}>
                                {dia.substring(0,3)}
                            </button>
                         ))}
                     </div>
                </div>
                
                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] active:scale-95 ${formEsHermana ? 'bg-purple-600/10 border-purple-500/30' : 'bg-white/5 border-white/10'}`} onClick={() => setFormEsHermana(!formEsHermana)}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${formEsHermana ? 'bg-purple-600 text-white font-bold' : 'bg-zinc-800'}`}>{formEsHermana && "✓"}</div>
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Aplicar Descuento Hermana (50%)</span>
                </div>

                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] active:scale-95 ${formPagoInmediato ? 'bg-green-600/10 border-green-500/30' : 'bg-white/5 border-white/10'}`} onClick={() => setFormPagoInmediato(!formPagoInmediato)}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${formPagoInmediato ? 'bg-green-600 text-white font-bold' : 'bg-zinc-800'}`}>{formPagoInmediato && "✓"}</div>
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">¿Pagó el primer mes al inscribirse?</span>
                </div>

                <button onClick={inscribirGimnasta} className="w-full bg-cyan-600 hover:bg-cyan-500 font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-cyan-900/40 hover:scale-[1.02] active:scale-95 transition-all">Completar Registro</button>
            </div>
        )}

        {/* GASTOS Y CAJA */}
        {vistaActual === 'gastos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="mb-8">
                        <h2 className="text-xs font-black uppercase text-zinc-400 mb-3 tracking-widest text-center">Cajas Menores / Conceptos Variables</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <CardCajaMenor titulo="Uniformes" valor={`$${cajaUniformes.toLocaleString()}`} icono="👕" colorTexto="text-purple-400" />
                            <CardCajaMenor titulo="Competencias" valor={`$${cajaCompetencias.toLocaleString()}`} icono="🏆" colorTexto="text-yellow-400" />
                            <CardCajaMenor titulo="Personalizadas" valor={`$${cajaPersonalizadas.toLocaleString()}`} icono="⭐️" colorTexto="text-cyan-400" />
                            <CardCajaMenor titulo="Otros" valor={`$${cajaOtros.toLocaleString()}`} icono="📦" colorTexto="text-zinc-300" />
                        </div>
                    </div>

                    <div className="flex gap-2 mb-6 p-1 bg-black/40 rounded-2xl shadow-inner">
                        <button onClick={() => setTabCaja('egreso')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/5 ${tabCaja === 'egreso' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-zinc-600'}`}>Registrar Salida</button>
                        <button onClick={() => setTabCaja('ingreso')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/5 ${tabCaja === 'ingreso' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-zinc-600'}`}>Registrar Ingreso Extra</button>
                    </div>

                    {tabCaja === 'egreso' ? (
                        <div className="space-y-4 animate-in fade-in">
                            <h2 className="text-lg font-bold mb-4 text-red-400 uppercase tracking-tighter">Nueva Salida de Caja</h2>
                            <InputStyled label="Monto" type="number" placeholder="0" value={nuevoGastoMonto} onChange={(e: any) => setNuevoGastoMonto(e.target.value)} />
                            <InputStyled label="Concepto / Detalle" type="text" placeholder="Ej: Pago de Luz" value={nuevoGastoConcepto} onChange={(e: any) => setNuevoGastoConcepto(e.target.value)} />
                            <div className="text-left">
                                <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Categoría</label>
                                <select className="w-full bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white text-[10px] font-black uppercase" value={nuevoGastoCategoria} onChange={(e: any) => setNuevoGastoCategoria(e.target.value)}>
                                    <option>Arriendo</option><option>Servicios</option><option>Mantenimiento</option><option>Implementos</option><option>Otros</option>
                                </select>
                            </div>
                            <button onClick={registrarGasto} className="w-full bg-red-600 hover:bg-red-500 font-black py-4 rounded-xl uppercase text-[10px] shadow-lg shadow-red-900/40 hover:scale-[1.02] active:scale-95 transition-all">Registrar Egreso</button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in">
                            <h2 className="text-lg font-bold mb-4 text-green-400 uppercase tracking-tighter">Nuevo Ingreso Extra</h2>
                            <InputStyled label="Monto" type="number" placeholder="0" value={nuevoIngresoMonto} onChange={(e: any) => setNuevoIngresoMonto(e.target.value)} />
                            <div className="text-left">
                                <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Tipo de Ingreso</label>
                                <select className="w-full bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white text-[10px] font-black uppercase" value={nuevoIngresoCategoria} onChange={(e: any) => setNuevoIngresoCategoria(e.target.value)}>
                                    <option>Uniforme</option><option>Competencia</option><option>Clase Personalizada</option><option>Otros</option>
                                </select>
                            </div>
                            <div className="text-left">
                                <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-1">Nota Puntual</label>
                                <textarea rows={3} className="w-full bg-white/5 p-4 rounded-xl border border-white/10 outline-none text-white focus:border-cyan-500 transition-all placeholder-zinc-700 text-sm font-bold uppercase resize-none" placeholder="Ej: Pago de uniforme talla S para Luci..." value={nuevoIngresoNota} onChange={(e) => setNuevoIngresoNota(e.target.value)}></textarea>
                            </div>
                            <button onClick={registrarIngresoExtra} className="w-full bg-green-600 hover:bg-green-500 font-black py-4 rounded-xl uppercase text-[10px] shadow-lg shadow-green-900/40 hover:scale-[1.02] active:scale-95 transition-all">Registrar Ingreso</button>
                        </div>
                    )}
                </div>

                <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 max-h-[600px] overflow-y-auto shadow-2xl">
                    <h2 className="text-[10px] font-black uppercase text-zinc-400 mb-6 text-center tracking-widest">Historial de Movimientos</h2>
                    <div className="space-y-2">
                        {ingresosExtra.map(i => (
                            <div key={i.id} className="flex justify-between items-center p-4 bg-green-500/10 rounded-2xl border border-green-500/20 group hover:bg-green-500/20 transition-colors">
                                <div className="text-left">
                                    <p className="font-bold text-xs uppercase leading-tight text-green-300">{i.categoria}</p>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase">{new Date(i.created_at).toLocaleDateString()}</p>
                                    <p className="text-[8px] text-zinc-500 mt-1 uppercase leading-tight max-w-[150px]">{i.nota}</p>
                                </div>
                                <span className="text-green-400 font-black text-xs">+$ {i.monto.toLocaleString()}</span>
                            </div>
                        ))}
                        {gastosVarios.map(g => (
                            <div key={g.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                                <div className="text-left"><p className="font-bold text-xs uppercase leading-tight">{g.concepto}</p><p className="text-[9px] text-zinc-500 font-black uppercase">{new Date(g.created_at).toLocaleDateString()} • {g.categoria}</p></div>
                                <span className="text-red-400 font-black text-xs">-$ {g.monto.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* NÓMINA DE PROFESORES */}
        {vistaActual === 'nomina' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-left">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 text-white">Nómina de Profesores</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-6">Calcular Pago</h3>
                        <div className="space-y-4">
                            <div className="text-left">
                                <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-1">Profesor</label>
                                <select className="bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-xs font-bold uppercase focus:border-cyan-500" value={nominaProfe} onChange={(e: any) => setNominaProfe(e.target.value)}>
                                    {listaProfesores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputStyled label="Fecha Inicio" type="date" value={nominaFechaInicio} onChange={(e: any) => setNominaFechaInicio(e.target.value)} />
                                <InputStyled label="Fecha Fin" type="date" value={nominaFechaFin} onChange={(e: any) => setNominaFechaFin(e.target.value)} />
                            </div>
                            <div className="text-left">
                                <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-1">Método de Pago</label>
                                <select className="bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-xs font-bold uppercase focus:border-cyan-500" value={nominaMetodo} onChange={(e: any) => setNominaMetodo(e.target.value)}>
                                    <option>Nequi</option><option>Bancolombia</option><option>Efectivo</option>
                                </select>
                            </div>
                            <div className="bg-cyan-900/20 p-6 rounded-2xl border border-cyan-500/20 text-center mt-6">
                                <p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1">Clases Calculadas</p>
                                <p className="text-4xl font-black text-white">{clasesCalculadas}</p>
                                <p className="text-[9px] text-zinc-400 font-bold mt-2 uppercase">Total a pagar: ${(clasesCalculadas * 45000).toLocaleString()}</p>
                            </div>
                            <button onClick={registrarPagoNomina} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-cyan-900/40 hover:scale-[1.02] active:scale-95 transition-all">Registrar Pago</button>
                        </div>
                    </div>

                    <div className="bg-zinc-900/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl overflow-y-auto max-h-[600px] custom-scrollbar">
                        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-6 text-center">Historial de Nómina</h3>
                        <div className="space-y-3">
                            {pagosProfes.map(p => (
                                <div key={p.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                                    <div className="text-left">
                                        <p className="text-xs font-bold uppercase text-white">{p.profesor}</p>
                                        <p className="text-[9px] text-zinc-500 font-black uppercase">{p.clases_pagadas} clases • {new Date(p.fecha_pago).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-cyan-400 font-black text-sm">${p.monto.toLocaleString()}</p>
                                        <p className="text-[8px] text-zinc-600 font-bold uppercase">{p.metodo}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL PERFIL */}
        {perfilSeleccionado && (
            <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[100] backdrop-blur-xl animate-in fade-in duration-200 text-left">
                <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden shadow-2xl">
                    <img src="/logob.png" className="absolute -top-4 -right-4 w-32 h-32 opacity-10 grayscale pointer-events-none" />
                    <button onClick={() => setPerfilSeleccionado(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors hover:rotate-90 duration-300">✕</button>
                    
                    {!modoEdicionPerfil ? (
                        <>
                            <h2 className="text-2xl font-bold uppercase tracking-tighter mb-1">{perfilSeleccionado.nombre}</h2>
                            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em] mb-4">{perfilSeleccionado.profesor}</p>
                            <button onClick={() => iniciarEdicion(perfilSeleccionado)} className="text-[9px] bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full uppercase font-bold text-zinc-400 mb-8 transition-colors hover:scale-105 active:scale-95">⚙️ Modificar Datos</button>
                        </>
                    ) : (
                        <div className="mb-8 space-y-3 animate-in fade-in">
                             <h2 className="text-lg font-bold uppercase tracking-tighter mb-4 text-cyan-400">Editando Perfil</h2>
                             <InputStyled label="Nombre" value={editNombre} onChange={(e: any) => setEditNombre(e.target.value)} />
                             <InputStyled label="Restablecer Contraseña (Se pedirá cambiar al entrar)" value={editClave} onChange={(e: any) => setEditClave(e.target.value)} />
                             <InputStyled label="Próximo Vencimiento (Corte)" type="date" value={editVencimiento} onChange={(e: any) => setEditVencimiento(e.target.value)} />
                             <div className="text-left">
                                <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-1">Plan</label>
                                <select className="bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-xs font-bold uppercase" value={editPaquete} onChange={(e: any) => setEditPaquete(e.target.value)}>{paquetes.map(p => <option key={p.id} value={p.id} className="bg-zinc-900">{p.nombre}</option>)}</select>
                            </div>
                            <div className="text-left">
                                <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-1">Profesor</label>
                                <select className="bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-xs font-bold uppercase" value={editProfesor} onChange={(e: any) => setEditProfesor(e.target.value)}>{listaProfesores.map(p => <option key={p.id} value={p.nombre} className="bg-zinc-900">{p.nombre}</option>)}</select>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => setModoEdicionPerfil(false)} className="flex-1 py-3 bg-zinc-800 rounded-xl text-[10px] font-bold uppercase hover:bg-zinc-700">Cancelar</button>
                                <button onClick={guardarCambiosPerfil} className="flex-1 py-3 bg-cyan-600 rounded-xl text-[10px] font-bold uppercase hover:scale-[1.02] active:scale-95 transition-all">Guardar</button>
                            </div>
                        </div>
                    )}
                    
                    {!modoEdicionPerfil && (
                        <>
                            <div className="flex gap-2 mb-6 p-1 bg-black/40 rounded-2xl shadow-inner">
                                <button onClick={() => setTabPerfil('finanzas')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabPerfil === 'finanzas' ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-600'}`}>Pagos / Mora</button>
                                <button onClick={() => setTabPerfil('asistencia')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tabPerfil === 'asistencia' ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-600'}`}>Asistencias</button>
                            </div>

                            <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar text-left">
                                {tabPerfil === 'finanzas' ? (
                                    <div className="space-y-4">
                                        {(() => {
                                            const mora = calcularMora(perfilSeleccionado);
                                            return mora.meses > 0 && (
                                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl animate-pulse">
                                                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Deuda Pendiente</p>
                                                    <p className="text-white text-xs font-bold uppercase leading-tight">Debe {mora.meses} Meses:</p>
                                                    <p className="text-red-200 text-[10px] uppercase font-bold tracking-tighter mb-3">{mora.nombres.join(", ")}</p>
                                                    <div className="bg-red-900/40 p-2 rounded-lg mb-3 text-center border border-red-500/20">
                                                        <span className="text-[9px] text-red-300 uppercase font-black">Total a Pagar: </span>
                                                        <span className="text-lg font-bold text-white">${mora.deudaTotal.toLocaleString()}</span>
                                                    </div>
                                                    <button onClick={() => generarMensajeCobro(perfilSeleccionado, mora.nombres, mora.deudaTotal)} className="w-full py-2 bg-green-600 rounded-lg text-white font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-green-500 transition-colors">
                                                        <span>📱</span> Enviar Cobro WhatsApp
                                                    </button>
                                                </div>
                                            );
                                        })()}

                                        <div className="p-6 bg-black/40 rounded-3xl border border-white/5 text-center shadow-lg">
                                            <p className="text-[9px] text-zinc-500 uppercase font-black mb-1 tracking-widest">Próximo Vencimiento</p>
                                            <p className="text-xl font-bold text-white mb-6 leading-none">{new Date(perfilSeleccionado.proximo_vencimiento).toLocaleDateString()}</p>
                                            <button onClick={() => registrarPagoMensualidad(perfilSeleccionado)} className="w-full bg-cyan-600 py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-cyan-900/40 active:scale-95 transition-transform">Cobrar Mensualidad</button>
                                        </div>
                                        
                                        <div className="space-y-2 text-left pt-2">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase mb-1 ml-1 tracking-widest">Abonos Realizados</p>
                                            {pagos.filter(p => p.gimnasta_id === perfilSeleccionado.id).map(p => (
                                                <div key={p.id} className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5 items-center group">
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-bold text-white uppercase leading-tight">{p.concepto}</p>
                                                        <p className="text-[9px] text-zinc-500 font-bold">{new Date(p.created_at).toLocaleDateString()}</p>
                                                        <p className="text-green-400 font-black text-xs mt-0.5">$ {p.monto.toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => editarPago(p)} className="p-2.5 bg-white/5 rounded-xl hover:bg-cyan-600/20 text-xs transition-all opacity-50 hover:opacity-100">✏️</button>
                                                        <button onClick={() => borrarPago(p.id)} className="p-2.5 bg-white/5 rounded-xl hover:bg-red-600/20 text-xs transition-all opacity-50 hover:opacity-100">🗑️</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => eliminarGimnasta(perfilSeleccionado.id)} className="w-full py-4 text-red-500/40 hover:text-red-500 text-[9px] font-black uppercase tracking-[0.3em] transition-colors border-t border-white/5 mt-8">Retirar Alumna</button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2 text-left">
                                        {todasAsistencias.filter(a => a.gimnasta_id === perfilSeleccionado.id).map(a => (
                                            <div key={a.id} className="bg-white/5 p-3 rounded-2xl text-center border border-white/5 shadow-sm">
                                                <p className="text-xl font-bold text-white mb-1 leading-none">{new Date(a.fecha).getDate()}</p>
                                                <p className="text-[8px] opacity-40 uppercase font-black">{new Date(a.fecha).toLocaleDateString('es-ES', {month:'short'})}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
      </main>
    </div>
  );
}