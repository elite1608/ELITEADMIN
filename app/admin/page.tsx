"use client";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldAlert, Lock, UserCheck, ChevronRight, Activity, 
  Users, LayoutDashboard, UserPlus, Wallet, CreditCard, 
  Briefcase, CalendarCheck, LogOut, Menu, X, ArrowRight, Trophy,
  ChevronLeft, DollarSign, TrendingUp, CheckCircle2, User, Phone, 
  Edit, Trash2, Check, HelpCircle, Shirt, Star, Package, Send,
  MinusCircle, PlusCircle, FileText, BadgeDollarSign, Key,
  AlertCircle, Camera,
} from "lucide-react";

import CompetenciasModulo from "./Competencias";
import Dashboard from "./components/Dashboard"; 
import MensajesModulo from "./Mensajes";
import { enviarReciboPago, enviarRecordatorioPago } from '../utils/whatsapp';

// --- CONEXIÓN DIRECTA ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- UTILIDADES ---
const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]; 
const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const obtenerFechaColombia = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
};

const obtenerNombreDia = (fechaStr: string) => {
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const d = new Date(fechaStr + "T12:00:00");
    return dias[d.getDay()];
};

// --- COMPONENTES UI PREMIUM ---
const BotonMenu = ({ icono, texto, activo, onClick }: any) => (
  <button onClick={onClick} className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${activo ? 'bg-gradient-to-r from-cyan-600 to-cyan-800 text-white shadow-lg shadow-cyan-900/30 border border-cyan-500/30 translate-x-2' : 'text-zinc-500 hover:bg-white/5 hover:text-white border border-transparent'}`}>
      <span className={`${activo ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-zinc-500'}`}>{icono}</span> 
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{texto}</span>
  </button>
);

const CardDato = ({ titulo, valor, color, icono, onClick }: any) => (
  <div onClick={onClick} className={`bg-zinc-900/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/5 relative overflow-hidden shadow-2xl text-left group transition-all duration-500 hover:-translate-y-2 hover:shadow-cyan-900/20 hover:border-cyan-500/30 hover:bg-zinc-800/60 ${onClick ? 'cursor-pointer active:scale-95' : ''}`}>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-all duration-500 rotate-12 text-zinc-100 [&>svg]:w-32 [&>svg]:h-32">{icono}</div>
      <h3 className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.25em] mb-2 group-hover:text-cyan-400 transition-colors">{titulo}</h3>
      <p className={`text-3xl font-black tracking-tighter ${color} drop-shadow-md group-hover:scale-105 transition-transform origin-left`}>{valor}</p>
      {onClick && <p className="text-[8px] text-zinc-500 mt-3 uppercase font-black tracking-widest flex items-center gap-1 group-hover:text-cyan-400 transition-colors">Ver análisis <ArrowRight size={10} className="group-hover:translate-x-2 transition-transform" /></p>}
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

const InputStyled = (props: any) => (
  <div className="text-left w-full">
    {props.label && <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">{props.label}</label>}
    <input {...props} className="w-full bg-zinc-950/50 p-4 rounded-2xl border border-white/10 outline-none text-white focus:border-cyan-500 transition-all focus:scale-[1.01] focus:bg-zinc-900/80 placeholder-zinc-700 text-xs font-bold uppercase shadow-inner" />
  </div>
);

export default function EliteManager() {
  // --- ESTADOS ---
  const [usuarioActual, setUsuarioActual] = useState<'admin' | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorLogin, setErrorLogin] = useState(false);
  const [vistaActual, setVistaActual] = useState("inicio");
  
  // ESTADOS DE ALERTAS MODERNAS
  const [modalAlerta, setModalAlerta] = useState<{ titulo: string, mensaje: string, tipo: 'exito'|'error' } | null>(null);
  const [modalInteractivo, setModalInteractivo] = useState<{
      abierto: boolean;
      tipo: 'confirmacion' | 'peligro' | 'prompt';
      titulo: string;
      mensaje: string;
      placeholder?: string;
      accionConfirmar: (inputTexto?: string) => void;
  } | null>(null);
  const [inputPromptValue, setInputPromptValue] = useState("");
  const [modalCobroMultiple, setModalCobroMultiple] = useState<{ abierto: boolean, gimnasta: any, mora: any, mesesSeleccionados: number, montoMora: number, montoAbono: string } | null>(null);
  // Estados de Perfil y Filtros
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<any | null>(null);
  const [tabPerfil, setTabPerfil] = useState<'finanzas' | 'asistencia'>('finanzas');
  const [modoEdicionPerfil, setModoEdicionPerfil] = useState(false);
  const [filtroDeudores, setFiltroDeudores] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mesSeleccionadoFiltro, setMesSeleccionadoFiltro] = useState(nombresMeses[new Date().getMonth()]);
  const [mesReporteDashboard, setMesReporteDashboard] = useState(nombresMeses[new Date().getMonth()]);
  
  // Estados de Edición
  const [editNombre, setEditNombre] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editPaquete, setEditPaquete] = useState("");
  const [editProfesor, setEditProfesor] = useState("");
  const [editEsHermana, setEditEsHermana] = useState(false);
  // VARIABLES PARA HERMANAS
  const [formGrupoFamiliar, setFormGrupoFamiliar] = useState("");
  const [editGrupoFamiliar, setEditGrupoFamiliar] = useState("");
  const [editVencimiento, setEditVencimiento] = useState("");
  const [editDias, setEditDias] = useState<string[]>([]);
  const [editClave, setEditClave] = useState("");
  const [editFoto, setEditFoto] = useState<File | null>(null);
  const [editFotoPreview, setEditFotoPreview] = useState<string | null>(null); 
  
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

  // --- MÁQUINA DEL TIEMPO & FILTROS (ADMIN) ---
  const [fechaAdmin, setFechaAdmin] = useState(obtenerFechaColombia());
  const [filtroProfeAsistencia, setFiltroProfeAsistencia] = useState("Todos");

  // --- FORMULARIOS ---
  const [formNombre, setFormNombre] = useState("");
  const [formTelefono, setFormTelefono] = useState("57");
  const [formClave, setFormClave] = useState("");
  const [formPaqueteId, setFormPaqueteId] = useState("");
  const [formDias, setFormDias] = useState<string[]>([]);
  const [formProfesor, setFormProfesor] = useState(""); 
  const [formPagoInmediato, setFormPagoInmediato] = useState(true);
  const [formEsHermana, setFormEsHermana] = useState(false);
  const [formFechaManual, setFormFechaManual] = useState(obtenerFechaColombia());
  const [formFoto, setFormFoto] = useState<File | null>(null);
  const [formFotoPreview, setFormFotoPreview] = useState<string | null>(null);
  
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
  const [nuevoProfePin, setNuevoProfePin] = useState("1234");

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

  useEffect(() => { 
      if (usuarioActual) {
          cargarTodo(); 

          // ⚡ MAGIA EN TIEMPO REAL: Escuchar lo que hacen los profes
          const canalSincronizacion = supabase
              .channel('cambios-en-vivo')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias' }, (payload) => {
                  // Cuando un profe marca o quita asistencia, recargamos los datos silenciosamente
                  cargarTodo();
              })
              .subscribe();

          // Limpiar el canal si cierras sesión
          return () => {
              supabase.removeChannel(canalSincronizacion);
          };
      }
  }, [usuarioActual]);

  // CÁLCULO DE NÓMINA - CORREGIDO
  useEffect(() => {
    if (nominaProfe && nominaFechaInicio && nominaFechaFin) {
        const asistEnRango = todasAsistencias.filter(a => a.fecha >= nominaFechaInicio && a.fecha <= nominaFechaFin);
        const asistProfe = asistEnRango.filter(a => {
            // Si el admin tomó la clase, el sistema registró "admin". En ese caso, leemos de quién es la alumna realmente.
            let profeReal = a.profesor_turno;
            if (!profeReal || profeReal === 'admin') {
                const alumna = estudiantes.find(e => e.id === a.gimnasta_id);
                profeReal = alumna?.profesor;
            }
            return profeReal === nominaProfe;
        });
        const diasUnicos = Array.from(new Set(asistProfe.map(a => a.fecha))).length;
        setClasesCalculadas(diasUnicos);
    } else { 
        setClasesCalculadas(0); 
    }
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
        setVistaActual('inicio'); 
        setFiltroDeudores(false);
        setErrorLogin(false);
    } else {
        setErrorLogin(true);
    }
  };

  const fondoApp = "url('/logob.png')";

  // 🔴 PUERTA DE SEGURIDAD PREMIUM (SOLO ADMIN)
  if (!usuarioActual) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 relative overflow-hidden text-left font-sans">
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: fondoApp, backgroundSize: '400px', backgroundRepeat: 'repeat', backgroundPosition: 'center'}}></div>
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-900/20 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="flex justify-center mb-8 relative">
            <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-150"></div>
            <img src="/logob.png" alt="Logo" className="w-32 h-32 relative z-10 object-contain drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]" />
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-in zoom-in duration-700">
            <div className="text-center mb-10">
              <h1 className="text-white text-2xl font-black mb-1 uppercase tracking-tighter">Acceso Dirección</h1>
              <p className="text-cyan-500 text-[8px] font-black tracking-[0.5em] uppercase">Control Maestro Elite</p>
            </div>

            <form onSubmit={loginAdmin} className="space-y-8">
              <div className="relative group">
                <input 
                  type="password" 
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)} 
                  className={`w-full bg-transparent border-b-2 py-4 text-center text-white text-2xl tracking-[0.5em] focus:outline-none transition-all duration-300 placeholder-zinc-700 ${errorLogin ? 'border-red-500 text-red-400' : 'border-white/20 focus:border-cyan-400'}`} 
                  placeholder="••••••••" 
                  autoFocus 
                />
              </div>

              {errorLogin && (
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center animate-in shake">Credenciales Incorrectas</p>
              )}

              <button type="submit" className="w-full bg-white text-black py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:scale-[1.03] active:scale-95 transition-all duration-300">
                Desbloquear Sistema
              </button>
            </form>
          </div>
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

  const proyeccionMensual = estudiantes.reduce((acc, e) => {
      let precio = e.paquetes?.precio || 0;
      if (e.es_hermana) precio = precio / 2;
      return acc + precio;
  }, 0);

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

  const calcularDeudaTotalDashboard = () => estudiantes.reduce((acc, e) => acc + calcularMora(e).deudaTotal, 0);

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
      if (!gimnasta.telefono_acudiente || gimnasta.telefono_acudiente.trim() === "") {
          setModalAlerta({ titulo: "Falta el Teléfono", mensaje: "Esta alumna no tiene un número de WhatsApp registrado.", tipo: "error" });
          return;
      }

      // 🧹 LIMPIADOR AUTOMÁTICO DE NÚMEROS
      // 1. Quita espacios, símbolos '+' y guiones
      let numeroLimpio = gimnasta.telefono_acudiente.replace(/\D/g, ''); 
      
      // 2. Si el número tiene 10 dígitos (ej: 3001234567), le agregamos el 57 de Colombia automáticamente
      if (numeroLimpio.length === 10) {
          numeroLimpio = '57' + numeroLimpio;
      }

      let textoMeses = meses.join(", ");
      let montoTexto = deuda.toLocaleString();
      
      const mensaje = esFiltroMes 
  ? `¡Hola! Un saludo especial de Elite Gymnastics.
  
Queremos recordarle que *${gimnasta.nombre}* tiene pendiente el pago de la mensualidad del mes de *${mesSeleccionadoFiltro}* por un valor de *$${montoTexto}*. 
  
Agradecemos su gestión para ponerse al día.`
  
  : `¡Hola! Un saludo especial de Elite Gymnastics. ✨
  
Queremos recordarle que *${gimnasta.nombre}* presenta un saldo pendiente de *$${montoTexto}* correspondiente a los meses de: *${textoMeses}*. 
  
Agradecemos su gestión para ponerse al día.`;
      
      // 🚀 Ahora usamos el 'numeroLimpio' en lugar del original
      window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const agregarProfesor = async () => {
      if (!nuevoProfeNombre) return setModalAlerta({ titulo: "Faltan Datos", mensaje: "Escribe un nombre para el nuevo profesor.", tipo: "error" });
      setModalInteractivo({
          abierto: true, tipo: 'confirmacion', titulo: 'Confirmar Contratación', mensaje: `¿Estás seguro de que quieres contratar a ${nuevoProfeNombre}?`,
          accionConfirmar: async () => {
              const { error } = await supabase.from("profesores").insert([{ nombre: nuevoProfeNombre, activo: true, pin_acceso: '1234', requiere_cambio_pin: true }]);
              if (error) setModalAlerta({ titulo: "Error", mensaje: "Hubo un problema al agregar el profesor.", tipo: "error" });
              else { setModalAlerta({ titulo: "¡Contratación Exitosa!", mensaje: "El profesor ha sido agregado.", tipo: "exito" }); setNuevoProfeNombre(""); cargarTodo(); }
          }
      });

  const restablecerPinProfesor = (id: number, nombre: string) => {
      setInputPromptValue("");
      setModalInteractivo({
          abierto: true, tipo: 'prompt', titulo: 'Restablecer PIN', mensaje: `Escribe la nueva contraseña temporal para ${nombre}:`, placeholder: 'Ej: 1234',
          accionConfirmar: async (val) => {
              if (!val) return setModalAlerta({ titulo: "Error", mensaje: "No ingresaste un PIN.", tipo: "error" });
              const { error } = await supabase.from("profesores").update({ pin_acceso: val, requiere_cambio_pin: true }).eq('id', id);
              if (error) setModalAlerta({ titulo: "Error", mensaje: "Hubo un error.", tipo: "error" });
              else { setModalAlerta({ titulo: "PIN Actualizado", mensaje: `El profesor debe cambiar la clave al entrar.`, tipo: "exito" }); cargarTodo(); }
          }
      });
  };
  };
  const restablecerPinProfesor = (id: number, nombre: string) => {
      setInputPromptValue("");
      setModalInteractivo({
          abierto: true, 
          tipo: 'prompt', 
          titulo: 'Restablecer PIN', 
          mensaje: `Escribe la nueva contraseña temporal para ${nombre}:`, 
          placeholder: 'Ej: 1234',
          accionConfirmar: async (val) => {
              if (!val) return setModalAlerta({ titulo: "Error", mensaje: "No ingresaste un PIN.", tipo: "error" });
              const { error } = await supabase.from("profesores").update({ pin_acceso: val, requiere_cambio_pin: true }).eq('id', id);
              if (error) setModalAlerta({ titulo: "Error", mensaje: "Hubo un error de conexión.", tipo: "error" });
              else { 
                  setModalAlerta({ titulo: "PIN Actualizado", mensaje: `El profesor debe cambiar la clave al entrar.`, tipo: "exito" }); 
                  cargarTodo(); 
              }
          }
      });
  };

  const eliminarProfesor = async (id: number, nombre: string) => {
      setModalInteractivo({
          abierto: true, tipo: 'peligro', titulo: 'Despedir Profesor', mensaje: `¿Estás seguro de que quieres eliminar a ${nombre}?`,
          accionConfirmar: async () => {
              const { error } = await supabase.from("profesores").update({ activo: false }).eq('id', id);
              if (error) setModalAlerta({ titulo: "Error", mensaje: "Hubo un problema al eliminar.", tipo: "error" });
              else { setModalAlerta({ titulo: "Profesor Eliminado", mensaje: "El perfil ha sido desactivado.", tipo: "exito" }); cargarTodo(); }
          }
      });
  };

  const iniciarEdicion = (gimnasta: any) => {
      setEditNombre(gimnasta.nombre); setEditTelefono(gimnasta.telefono_acudiente || "57"); setEditPaquete(gimnasta.paquete_id);
      setEditProfesor(gimnasta.profesor); setEditEsHermana(gimnasta.es_hermana || false); setEditDias(gimnasta.dias || []);
      setEditVencimiento(new Date(gimnasta.proximo_vencimiento).toISOString().split('T')[0]); setEditClave(gimnasta.clave_acceso || "");
      setEditGrupoFamiliar(gimnasta.grupo_familiar || "");
      
      // NUEVO: Limpiamos la foto nueva y mostramos la que ya tiene (si existe)
      setEditFoto(null);
      setEditFotoPreview(gimnasta.foto_url || null);
      
      setModoEdicionPerfil(true);
  };

  const toggleEditDia = (dia: string) => {
    if (editDias.includes(dia)) setEditDias(editDias.filter(d => d !== dia));
    else setEditDias([...editDias, dia]);
  };

  const guardarCambiosPerfil = async () => {
      setInputPromptValue("");
      setModalInteractivo({
          abierto: true, tipo: 'prompt', titulo: 'Verificación de Seguridad', mensaje: 'Para guardar los cambios de esta alumna, escribe CONFIRMAR en mayúsculas:', placeholder: 'Escribe CONFIRMAR',
          accionConfirmar: async (val) => {
              if (val !== "CONFIRMAR") return setModalAlerta({ titulo: "Cancelado", mensaje: "No escribiste la palabra clave.", tipo: "error" });
              
              setModalAlerta({ titulo: "Procesando...", mensaje: "Guardando cambios y actualizando foto...", tipo: "exito" });

              // 1. Subir foto nueva si se seleccionó una
              let urlFotoActualizada = perfilSeleccionado.foto_url;
              if (editFoto) {
                  const nuevaUrl = await subirFotoSupabase(editFoto);
                  if (nuevaUrl) urlFotoActualizada = nuevaUrl;
              }

              // 2. Guardar en base de datos
              const { error } = await supabase.from("gimnastas").update({ 
                  nombre: editNombre, telefono_acudiente: editTelefono, paquete_id: editPaquete, profesor: editProfesor,
                  es_hermana: editEsHermana, dias: editDias, proximo_vencimiento: new Date(editVencimiento).toISOString(),
                  clave_acceso: editClave, requiere_cambio_clave: true,
                  foto_url: urlFotoActualizada, // Guardamos el link de la foto
                  grupo_familiar: editGrupoFamiliar
              }).eq('id', perfilSeleccionado.id);

              if (error) setModalAlerta({ titulo: "Error", mensaje: "Hubo un problema al guardar los cambios.", tipo: "error" });
              else { 
                  setModalAlerta({ titulo: "Guardado", mensaje: "Perfil actualizado exitosamente.", tipo: "exito" });
                  setModoEdicionPerfil(false); 
                  
                  // Actualizar la vista en vivo
                  setPerfilSeleccionado({ ...perfilSeleccionado, nombre: editNombre, telefono_acudiente: editTelefono, paquete_id: editPaquete, profesor: editProfesor, es_hermana: editEsHermana, dias: editDias, proximo_vencimiento: new Date(editVencimiento).toISOString(), clave_acceso: editClave, foto_url: urlFotoActualizada, paquetes: paquetes.find(p => p.id == editPaquete) }); 
                  cargarTodo(); 
              }
          }
      });
  };

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

  const toggleDia = (dia: string) => {
    if (formDias.includes(dia)) setFormDias(formDias.filter(d => d !== dia));
    else setFormDias([...formDias, dia]);
  };

  // 📸 FUNCIÓN PARA SUBIR FOTO A SUPABASE STORAGE
  const subirFotoSupabase = async (archivo: File) => {
      const fileExt = archivo.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`; // Se guarda en la raíz de fotos_alumnas

      const { error: uploadError } = await supabase.storage
          .from('fotos_alumnas')
          .upload(filePath, archivo);

      if (uploadError) {
          console.error("Error al subir foto:", uploadError);
          return null;
      }

      // Obtener el link público para guardarlo en la base de datos
      const { data } = supabase.storage.from('fotos_alumnas').getPublicUrl(filePath);
      return data.publicUrl;
  };



  const inscribirGimnasta = async () => {
    if (!formNombre || !formPaqueteId || !formClave) return setModalAlerta({ titulo: "Faltan Datos", mensaje: "Nombre, plan y contraseña obligatorios.", tipo: "error" });
    
    // 1. Mostrar que estamos procesando (la foto puede tardar 1 o 2 segundos)
    setModalAlerta({ titulo: "Procesando...", mensaje: "Guardando ficha técnica y subiendo foto...", tipo: "exito" });

    // 2. Subir la foto si el usuario seleccionó una
    let urlFotoGuardada = null;
    if (formFoto) {
        urlFotoGuardada = await subirFotoSupabase(formFoto);
    }

    const fechaBase = new Date(formFechaManual); const vencimiento = new Date(fechaBase);
    if (formPagoInmediato) vencimiento.setDate(fechaBase.getDate() + 30); else vencimiento.setDate(fechaBase.getDate() - 1);
    const precioFull = paquetes.find(p => p.id == formPaqueteId)?.precio || 0;
    const montoInicial = formEsHermana ? (precioFull / 2) : precioFull;
    
    // 3. Guardar en la base de datos (Incluyendo la nueva foto_url)
    const { data: nueva } = await supabase.from("gimnastas").insert([{ 
        nombre: formNombre, telefono_acudiente: formTelefono, paquete_id: formPaqueteId, dias: formDias, profesor: formProfesor, 
        estado: formPagoInmediato ? "Activo" : "Pendiente", proximo_vencimiento: vencimiento.toISOString(), created_at: fechaBase.toISOString(),
        es_hermana: formEsHermana, 
        clave_acceso: formClave, requiere_cambio_clave: true,
        foto_url: urlFotoGuardada,
        grupo_familiar: formGrupoFamiliar || null // <--- AQUÍ ESTÁ EL ARREGLO, YA NO DEPENDE DEL BOTÓN
    }]).select().single();

    if (formPagoInmediato && nueva) {
      await supabase.from("pagos").insert([{ gimnasta_id: nueva.id, monto: montoInicial, concepto: formEsHermana ? "Inscripción (Desc. Hermana)" : "Inscripción", created_at: fechaBase.toISOString() }]);
    }
    setModalAlerta({ titulo: "¡Bienvenida a Elite!", mensaje: "Alumna inscrita con éxito.", tipo: "exito" });
    
    // 4. Limpiar el formulario
    setFormNombre(""); setFormTelefono("57"); setFormClave(""); setFormDias([]); 
    setFormFoto(null); setFormFotoPreview(null); // Limpiar foto
    cargarTodo(); setVistaActual('directorio');
  };

  const editarPago = async (pago: any) => {
      setInputPromptValue(pago.monto.toString());
      setModalInteractivo({
          abierto: true, tipo: 'prompt', titulo: 'Editar Recibo', mensaje: 'Ingresa el nuevo monto exacto:', placeholder: 'Nuevo monto...',
          accionConfirmar: async (val) => {
              if (val) { await supabase.from("pagos").update({ monto: Number(val) }).eq('id', pago.id); cargarTodo(); setModalAlerta({ titulo: "Actualizado", mensaje: "Monto corregido.", tipo: "exito" }); }
          }
      });
  };

  const borrarPago = async (id: number) => {
      setModalInteractivo({
          abierto: true, tipo: 'peligro', titulo: 'Eliminar Recibo', mensaje: '¿Eliminar este recibo permanente?',
          accionConfirmar: async () => {
              await supabase.from("pagos").delete().eq('id', id); 
              setTimeout(() => {
                  setModalInteractivo({
                      abierto: true, tipo: 'confirmacion', titulo: 'Ajuste de Vencimiento', mensaje: '¿Revertir también el mes de la alumna? (-30 días).',
                      accionConfirmar: async () => {
                          const fVence = new Date(perfilSeleccionado.proximo_vencimiento); fVence.setDate(fVence.getDate() - 30);
                          await supabase.from("gimnastas").update({ proximo_vencimiento: fVence.toISOString() }).eq('id', perfilSeleccionado.id);
                          setPerfilSeleccionado({ ...perfilSeleccionado, proximo_vencimiento: fVence.toISOString() }); cargarTodo();
                      }
                  });
              }, 400); 
              cargarTodo(); 
          }
      });
  };

  const eliminarGimnasta = async (id: number) => {
      setModalInteractivo({
          abierto: true, tipo: 'peligro', titulo: 'Retirar Alumna', mensaje: 'Esta acción borrará PERMANENTEMENTE a la alumna y su historial. ¿Seguro?',
          accionConfirmar: async () => {
              await supabase.from("pagos").delete().eq('gimnasta_id', id); await supabase.from("asistencias").delete().eq('gimnasta_id', id);
              await supabase.from("gimnastas").delete().eq('id', id); setPerfilSeleccionado(null); cargarTodo(); 
              setModalAlerta({ titulo: "Retirada", mensaje: "Historial borrado.", tipo: "exito" });
          }
      });
  };

  const iniciarCobro = (gimnasta: any) => {
    const mora = calcularMora(gimnasta);
    // Si debe meses, cobramos la mora. Si está al día, asumimos que pagará 1 mes por adelantado.
    const mesesPagar = mora.meses > 0 ? mora.meses : 1;
    const deudaCalculada = mora.precioIndividual * mesesPagar;

    setModalCobroMultiple({ 
        abierto: true, 
        gimnasta, 
        mora, 
        mesesSeleccionados: mesesPagar,
        montoMora: deudaCalculada,
        montoAbono: deudaCalculada.toString() // Permite al admin editar el número para abonos
    });
  };

  const procesarPago = async () => {
    if (!modalCobroMultiple) return;
    const { gimnasta, mora, montoAbono } = modalCobroMultiple;
    const montoFinal = Number(montoAbono);

    if (isNaN(montoFinal) || montoFinal <= 0) return setModalAlerta({ titulo: "Error", mensaje: "Ingresa un monto válido.", tipo: "error" });

    const precioFull = gimnasta.paquetes?.precio || 0;
    const precioIndividual = gimnasta.es_hermana ? (precioFull / 2) : precioFull;

    // Calcula cuántos días de entrenamiento compra este dinero
    const diasComprados = Math.round((montoFinal / precioIndividual) * 30);

    let conceptoFinal = gimnasta.es_hermana ? "Mensualidad / Abono (Hermana)" : "Mensualidad / Abono";
    
    // 🧠 LÓGICA INTELIGENTE DE MENSAJES PARA WHATSAPP
    let saldoRestante = mora.deudaTotal - montoFinal;
    let mensajeRecibo = "";

    if (saldoRestante > 0) {
        // CASO 1: Queda debiendo dinero (Abono o pago parcial de meses)
        if (montoFinal >= precioIndividual) {
            // Pagó al menos 1 mes completo, pero debe más (Ej: Debía 3, pagó 2)
            let mesesPagados = Math.floor(montoFinal / precioIndividual);
            let mesesCubiertos = mora.nombres.slice(0, mesesPagados).join(", ");
            mensajeRecibo = `¡Hola! Un saludo de Elite Gymnastics.\n\nHemos recibido exitosamente tu pago de *$${montoFinal.toLocaleString()}* correspondiente a: *${mesesCubiertos}* para la alumna *${gimnasta.nombre}*.\n\nAún presenta un saldo pendiente de *$${saldoRestante.toLocaleString()}*. ¡Gracias por tu apoyo!`;
        } else {
            // Es un abono menor a un mes entero (Ej: Debía $100.000, abonó $50.000)
            let mesActualCobro = mora.nombres.length > 0 ? mora.nombres[0] : nombresMeses[new Date().getMonth()];
            mensajeRecibo = `¡Hola! Un saludo de Elite Gymnastics.\n\nHemos registrado exitosamente tu abono de *$${montoFinal.toLocaleString()}* a la mensualidad de *${mesActualCobro}* para la alumna *${gimnasta.nombre}*.\n\nQueda un saldo pendiente de *$${saldoRestante.toLocaleString()}*. ¡Gracias por tu apoyo!`;
        }
    } else {
        // CASO 2: Pagó toda la deuda (Al día)
        let mesesCubiertos = mora.nombres.length > 0 ? mora.nombres.join(", ") : nombresMeses[new Date().getMonth()];
        mensajeRecibo = `¡Hola! Un saludo de Elite Gymnastics.\n\nHemos recibido exitosamente tu pago de *$${montoFinal.toLocaleString()}* correspondiente a: *${mesesCubiertos}* para la alumna *${gimnasta.nombre}*.\n\nLa cuenta se encuentra al día. ¡Gracias por tu apoyo!`;
    }

    // 🚀 ANTI-BLOQUEO WHATSAPP: Lógica directa para Safari/Mac
    if (!gimnasta.telefono_acudiente || gimnasta.telefono_acudiente === "57" || gimnasta.telefono_acudiente.trim() === "") {
        setModalAlerta({ titulo: "Pago Registrado", mensaje: `Abono de $${montoFinal.toLocaleString()} guardado, pero la alumna no tiene teléfono registrado.`, tipo: "exito" });
    } else {
        // Limpiador automático de números
        let numeroLimpio = gimnasta.telefono_acudiente.replace(/\D/g, ''); 
        if (numeroLimpio.length === 10) numeroLimpio = '57' + numeroLimpio;
        
        // Apertura directa para evitar bloqueos del navegador
        window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensajeRecibo)}`, '_blank');
        
        setModalAlerta({ titulo: "¡Recibo Enviado!", mensaje: `El pago de $${montoFinal.toLocaleString()} se procesó exitosamente.`, tipo: "exito" });
    }

    // Actualización de base de datos
    const fVence = new Date(gimnasta.proximo_vencimiento); 
    fVence.setDate(fVence.getDate() + diasComprados);

    await supabase.from("gimnastas").update({ proximo_vencimiento: fVence.toISOString() }).eq('id', gimnasta.id);
    await supabase.from("pagos").insert({ gimnasta_id: gimnasta.id, monto: montoFinal, concepto: conceptoFinal });
    
    cargarTodo(); 
    setModalCobroMultiple(null); 
    if (perfilSeleccionado && perfilSeleccionado.id === gimnasta.id) setPerfilSeleccionado({ ...perfilSeleccionado, proximo_vencimiento: fVence.toISOString() });
  };

  // --- LÓGICA DE ASISTENCIA ULTRARRÁPIDA (CON CORRECCIÓN DE NÓMINA) ---
  const cambiarDiaAdmin = (dias: number) => {
      const current = new Date(fechaAdmin + "T12:00:00");
      current.setDate(current.getDate() + dias);
      setFechaAdmin(current.toLocaleDateString('en-CA'));
  };

  const toggleAsistencia = async (gimnastaId: number) => {
    const asistido = todasAsistencias.find(a => a.gimnasta_id === gimnastaId && a.fecha === fechaAdmin);
    
    if (asistido) { 
        // ⚡ Actualización Optimista: Removemos visualmente inmediato
        setTodasAsistencias(prev => prev.filter(a => a.id !== asistido.id));
        await supabase.from("asistencias").delete().match({ id: asistido.id }); 
    } else { 
        // ⚡ Actualización Optimista: Agregamos visualmente inmediato
        // Asignamos a su propio profesor para no dañar la nómina
        const alumna = estudiantes.find(e => e.id === gimnastaId);
        const profeResponsable = alumna?.profesor || 'admin';
        
        const nuevaAsis = { id: Math.random(), gimnasta_id: gimnastaId, fecha: fechaAdmin, presente: true, profesor_turno: profeResponsable };
        setTodasAsistencias(prev => [...prev, nuevaAsis]);
        await supabase.from("asistencias").insert({ gimnasta_id: gimnastaId, fecha: fechaAdmin, presente: true, profesor_turno: profeResponsable }); 
    }
    // Sincronización silenciosa final
    cargarTodo();
  };

  const diaVisualizacion = obtenerNombreDia(fechaAdmin);


  // 📲 ENVÍO DE COBROS INTELIGENTE (HERMANAS Y NORMALES)
  const enviarRecordatorioMora = (gimnastaPrincipal: any, moraPrincipal: any) => {
      let numeroLimpio = gimnastaPrincipal.telefono_acudiente?.replace(/\D/g, '') || "";
      if (numeroLimpio.length === 10) numeroLimpio = '57' + numeroLimpio;
      if (!numeroLimpio) return alert("La alumna no tiene teléfono registrado.");

      let mensajeFinal = "";

      if (gimnastaPrincipal.grupo_familiar) {
          // 👯‍♀️ LÓGICA PARA HERMANAS
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
          // 👤 LÓGICA NORMAL (ALUMNA INDIVIDUAL)
          if (moraPrincipal.meses === 0) return alert("La alumna está al día.");
          
          mensajeFinal = `Hola! Un saludo especial de Elite Gymnastics.\n\nCompartimos la información de que ${gimnastaPrincipal.nombre.toUpperCase()} hasta la fecha presenta un saldo pendiente de $${moraPrincipal.deudaTotal.toLocaleString()} correspondiente a los meses de: ${moraPrincipal.nombres.join(", ")} que va en curso.\n\nQuedamos atentos a cualquier inquietud.\n\nFeliz día`;
      }

      window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensajeFinal)}`, '_blank');
  };

// Extraer lista de grupos únicos que ya existen en la base de datos (sin repetir)
  const gruposExistentes = Array.from(new Set(estudiantes.map((e: any) => e.grupo_familiar).filter(Boolean)));

  // --- INTERFAZ PRINCIPAL ---

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans relative">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: fondoApp, backgroundSize: '300px', backgroundRepeat: 'repeat', backgroundPosition: 'center'}}></div>
      
      {/* NAVEGACION MOVIL */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-black/80 backdrop-blur-lg p-4 z-40 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2 text-left"><img src="/logob.png" className="w-8 h-8 object-contain" /><h1 className="text-[10px] font-bold uppercase tracking-tight">Elite Barranquilla</h1></div>
        <button onClick={() => setMenuMovilAbierto(!menuMovilAbierto)} className="p-2 bg-white/5 rounded-lg text-xl text-white">
            {menuMovilAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900/95 backdrop-blur-2xl border-r border-white/10 p-6 transform transition-transform duration-300 ${menuMovilAbierto ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:block text-left shadow-2xl flex flex-col`}>
        <div className="flex items-center gap-3 mb-10 hidden md:flex cursor-pointer hover:scale-105 transition-transform" onClick={() => setVistaActual('inicio')}>
             <img src="/logob.png" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
             <div className="leading-none text-left"><h1 className="text-sm font-black uppercase tracking-tighter text-white">Elite Gymnastics</h1><p className="text-cyan-500 text-[8px] font-black tracking-widest uppercase">Barranquilla</p></div>
        </div>
        
        <nav className="space-y-2 flex-1 mt-12 md:mt-0">
          <BotonMenu icono={<LayoutDashboard size={18} />} texto="Dashboard" activo={vistaActual === 'inicio'} onClick={() => {setVistaActual('inicio'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<Users size={18} />} texto="Directorio" activo={vistaActual === 'directorio'} onClick={() => {setVistaActual('directorio'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<UserPlus size={18} />} texto="Inscripciones" activo={vistaActual === 'inscripciones'} onClick={() => {setVistaActual('inscripciones'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<CalendarCheck size={18} />} texto="Auditoría Asistencia" activo={vistaActual === 'asistencia'} onClick={() => {setVistaActual('asistencia'); setMenuMovilAbierto(false)}} />
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4"></div>
          <BotonMenu icono={<Wallet size={18} />} texto="Gastos y Caja" activo={vistaActual === 'gastos'} onClick={() => {setVistaActual('gastos'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<CreditCard size={18} />} texto="Nómina Profes" activo={vistaActual === 'nomina'} onClick={() => {setVistaActual('nomina'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<Briefcase size={18} />} texto="Gestión Staff" activo={vistaActual === 'equipo'} onClick={() => {setVistaActual('equipo'); setMenuMovilAbierto(false)}} />
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4"></div>
          <BotonMenu icono={<Send size={18} />} texto="Comunicaciones" activo={vistaActual === 'mensajes'}  onClick={() => {setVistaActual('mensajes'); setMenuMovilAbierto(false)}} />
          <BotonMenu icono={<Trophy size={18} />} texto="Competencias" activo={vistaActual === 'competencias'} onClick={() => {setVistaActual('competencias'); setMenuMovilAbierto(false)}} />
        </nav>
        
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-white/5 mb-4 text-left shadow-inner">
            <p className="text-[8px] text-zinc-500 uppercase font-black mb-1 flex items-center gap-1"><ShieldAlert size={10} className="text-cyan-500"/> SESIÓN MAESTRA</p>
            <p className="text-xs font-black text-white truncate uppercase tracking-widest">DIRECCIÓN ELITE</p>
        </div>
        <button onClick={() => setUsuarioActual(null)} className="text-zinc-600 flex items-center justify-center gap-2 hover:text-red-400 text-[10px] uppercase font-black tracking-widest pt-4 border-t border-white/5 w-full transition-colors group">
            <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" /> Cerrar Sistema
        </button>
      </aside>

      <main className="flex-1 p-4 pt-24 md:p-10 lg:p-14 overflow-x-hidden relative z-10 text-left">
        

        {/* DASHBOARD */}
        {vistaActual === 'inicio' && (
          <Dashboard 
            estudiantes={estudiantes}
            balanceReal={balanceReal}
            calcularDeudaTotalDashboard={calcularDeudaTotalDashboard}
            proyeccionMensual={proyeccionMensual}
            setFiltroDeudores={setFiltroDeudores}
            setVistaActual={setVistaActual}
            mesReporteDashboard={mesReporteDashboard}
            setMesReporteDashboard={setMesReporteDashboard}
            nombresMeses={nombresMeses}
            ingresosMesSeleccionado={ingresosMesSeleccionado}
            deudorasMesSeleccionado={deudorasMesSeleccionado}
          />
        )}

        {/* COMPETENCIAS */}
        {vistaActual === 'competencias' && <CompetenciasModulo estudiantes={estudiantes} esAdmin={true} />}
        {/* MENSAJES */}
        {vistaActual === 'mensajes' && <MensajesModulo estudiantes={estudiantes} />}
        
        {/* DIRECTORIO */}
        {vistaActual === 'directorio' && (
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
                    {estudiantes.filter(e => {
                        const mora = calcularMora(e); const coincideMes = filtroDeudores ? mora.nombres.includes(mesSeleccionadoFiltro) : true; const coincideBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
                        return coincideMes && coincideBusqueda;
                    }).map(e => {
                        const mora = calcularMora(e);
                        return (
                            <div key={e.id} onClick={() => {setPerfilSeleccionado(e); setTabPerfil('finanzas'); setModoEdicionPerfil(false);}} className={`p-5 backdrop-blur-xl border rounded-[1.5rem] flex items-center gap-5 cursor-pointer hover:-translate-y-1 hover:shadow-xl active:scale-95 transition-all duration-300 text-left group ${mora.meses > 0 ? 'bg-red-950/20 border-red-500/30 hover:bg-red-900/30 hover:border-red-500/50' : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-800/80 hover:border-cyan-500/30'}`}>
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
                                        {/* Pequeño indicador si es de un grupo familiar */}
                                        {e.grupo_familiar && <span className="block text-[8px] text-cyan-500 tracking-widest mt-0.5">{e.grupo_familiar}</span>}
                                    </p>
                                    <p className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em]">
                                        {filtroDeudores 
                                            ? <span className="text-red-400">DEBE {mesSeleccionadoFiltro}: ${mora.precioIndividual.toLocaleString()}</span> 
                                            : (mora.meses > 0 ? <span className="text-red-400">DEBE ${mora.deudaTotal.toLocaleString()}</span> : <span className="text-emerald-500">AL DÍA</span>)}
                                    </p>
                                </div>
                                
                                {/* BOTÓN INTELIGENTE CONECTADO */}
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
                {estudiantes.filter(e => filtroDeudores && calcularMora(e).nombres.includes(mesSeleccionadoFiltro)).length === 0 && filtroDeudores && (
                    <div className="text-center py-24 opacity-40 border border-dashed border-white/10 rounded-[2rem] bg-white/5">
                        <CheckCircle2 size={64} className="mx-auto mb-4 text-green-500" />
                        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Staff al día. Cero deudas.</p>
                    </div>
                )}
            </div>
        )}

        {/* EQUIPO */}
        {vistaActual === 'equipo' && (
            <div className="max-w-2xl mx-auto bg-zinc-900/60 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-500/20 mx-auto mb-4"><Briefcase size={28} /></div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Gestión de Staff</h2>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] mt-2">Administración de Entrenadores</p>
                </div>
                
                <div className="space-y-4 bg-black/20 p-6 rounded-[2rem] border border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <InputStyled label="Nombre Completo del Profesor" placeholder="Ej: Profe Juan" value={nuevoProfeNombre} onChange={(e: any) => setNuevoProfeNombre(e.target.value)} />
                        </div>
                        <div>
                            <InputStyled label="PIN Temporal" placeholder="1234" value={nuevoProfePin} onChange={(e: any) => setNuevoProfePin(e.target.value)} />
                        </div>
                    </div>
                    <button onClick={agregarProfesor} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-cyan-900/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"><UserPlus size={16}/> Contratar y Habilitar Sistema</button>
                </div>

                <div className="mt-8">
                    <p className="text-[9px] font-black text-cyan-500 uppercase mb-4 ml-2 tracking-[0.2em]">Nómina Activa ({listaProfesores.length})</p>
                    <div className="space-y-3">
                        {listaProfesores.map(p => (
                            <div key={p.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all hover:shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors"><User size={18}/></div>
                                    <div>
                                        <p className="text-sm font-black uppercase text-white leading-tight">{p.nombre}</p>
                                        <p className="text-[8px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Acceso Concedido</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => restablecerPinProfesor(p.id, p.nombre)} className="text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all p-3 rounded-xl active:scale-90" title="Restablecer Contraseña">
                                        <Key size={16}/>
                                    </button>
                                    <button onClick={() => eliminarProfesor(p.id, p.nombre)} className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all p-3 rounded-xl active:scale-90" title="Dar de baja">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* ASISTENCIA CON MÁQUINA DEL TIEMPO (ADMIN) Y FILTROS */}
        {vistaActual === 'asistencia' && (
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
                            {listaProfesores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
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
                  const estudiantesFiltrados = estudiantes.filter(e => 
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

                  return estudiantesFiltrados.map(e => {
                    const asistido = todasAsistencias.some(a => a.gimnasta_id === e.id && a.fecha === fechaAdmin);
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
        )}

        {/* INSCRIPCION */}
{vistaActual === 'inscripciones' && (
    <div className="max-w-2xl mx-auto bg-zinc-900/60 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-600 to-blue-600"></div>
        <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-500/20 mx-auto mb-4"><UserPlus size={28} /></div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">FICHA de LA GIMNASTA</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Creación de Perfil Oficial</p>
        </div>
    
        <div className="space-y-5 bg-black/20 p-8 rounded-[2rem] border border-white/5">
            {/* BOTÓN CIRCULAR PARA SUBIR FOTO */}
            <div className="flex flex-col items-center justify-center mb-6">
                <label className="cursor-pointer relative group">
                    <div className={`w-24 h-24 rounded-full border-2 border-dashed ${formFotoPreview ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-zinc-600'} flex items-center justify-center overflow-hidden bg-zinc-900/50 group-hover:bg-zinc-800 transition-all`}>
                        {formFotoPreview ? (
                            <img src={formFotoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <Camera size={32} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                        )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setFormFoto(e.target.files[0]);
                            setFormFotoPreview(URL.createObjectURL(e.target.files[0]));
                        }
                    }} />
                </label>
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-3">Toca para añadir foto (Opcional)</p>
            </div>

            <InputStyled label="Nombre Completo" placeholder="Ej: Isabella Santos..." value={formNombre} onChange={(e: any) => setFormNombre(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputStyled label="Teléfono (WhatsApp)" placeholder="Ej: 573001234567" value={formTelefono} onChange={(e: any) => setFormTelefono(e.target.value)} /> 
                <InputStyled label="Clave de Seguridad" placeholder="Ej: Doc. Identidad" value={formClave} onChange={(e: any) => setFormClave(e.target.value)} />
            </div>
            <InputStyled label="Fecha de Registro Base" type="date" value={formFechaManual} onChange={(e: any) => setFormFechaManual(e.target.value)} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            <div className="bg-black/20 p-5 rounded-3xl border border-white/5">
                <label className="text-[9px] font-black text-cyan-500 uppercase tracking-widest block mb-2 ml-1">Plan Contratado</label>
                <select className="bg-zinc-900 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-xs font-bold uppercase focus:border-cyan-500 transition-colors shadow-inner" value={formPaqueteId} onChange={(e: any) => setFormPaqueteId(e.target.value)}><option value="" className="bg-zinc-900">SELECCIONAR PLAN...</option>{paquetes.map(p => <option key={p.id} value={p.id} className="bg-zinc-900">{p.nombre} - $ {p.precio.toLocaleString()}</option>)}</select>
            </div>
            <div className="bg-black/20 p-5 rounded-3xl border border-white/5">
                <label className="text-[9px] font-black text-cyan-500 uppercase tracking-widest block mb-2 ml-1">Profesor Responsable</label>
                <select className="bg-zinc-900 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-xs font-bold uppercase focus:border-cyan-500 transition-colors shadow-inner" value={formProfesor} onChange={(e: any) => setFormProfesor(e.target.value)}>{listaProfesores.map(p => <option key={p.id} value={p.nombre} className="bg-zinc-900">{p.nombre}</option>)}</select>
            </div>
        </div>

        <div className="text-left bg-black/20 p-6 rounded-[2rem] border border-white/5">
             <label className="text-[9px] font-black text-cyan-500 uppercase tracking-widest block mb-4 ml-1">Asignación de Horario (Días)</label>
             <div className="flex flex-wrap gap-3">
                 {diasSemana.map(dia => (
                    <button key={dia} onClick={() => toggleDia(dia)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-90 ${formDias.includes(dia) ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border border-white/5'}`}>{dia}</button>
                 ))}
             </div>
        </div>
        
        {/* SECCIÓN DE HERMANAS Y CAJA (MEJORADO) */}
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 group ${formEsHermana ? 'bg-purple-900/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'bg-black/20 border-white/5 hover:border-white/10'}`} onClick={() => setFormEsHermana(!formEsHermana)}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${formEsHermana ? 'bg-purple-600 text-white shadow-inner' : 'bg-zinc-800 text-zinc-600 group-hover:text-zinc-400'}`}>{formEsHermana ? <Check size={16} strokeWidth={4}/> : <MinusCircle size={16}/>}</div>
                    <span className="text-[10px] font-black uppercase text-white tracking-widest leading-tight">Beca Hermana<br/><span className="text-purple-400 text-[8px] tracking-[0.2em]">-50% Descuento</span></span>
                </div>

                <div className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 group ${formPagoInmediato ? 'bg-green-900/20 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 'bg-black/20 border-white/5 hover:border-white/10'}`} onClick={() => setFormPagoInmediato(!formPagoInmediato)}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${formPagoInmediato ? 'bg-green-600 text-white shadow-inner' : 'bg-zinc-800 text-zinc-600 group-hover:text-zinc-400'}`}>{formPagoInmediato ? <Check size={16} strokeWidth={4}/> : <HelpCircle size={16}/>}</div>
                    <span className="text-[10px] font-black uppercase text-white tracking-widest leading-tight">Estado de Caja<br/><span className={formPagoInmediato ? "text-green-400 text-[8px] tracking-[0.2em]" : "text-zinc-500 text-[8px] tracking-[0.2em]"}>{formPagoInmediato ? "Pagó inscripción hoy" : "Entra con Deuda"}</span></span>
                </div>
            </div>

            {/* GRUPO FAMILIAR INTELIGENTE (FUERA DE LOS BOTONES) */}
            <div className="text-left bg-black/20 p-6 rounded-[2rem] border border-white/5">
                <div className="flex justify-between items-end mb-2">
                    <label className="text-[9px] font-black text-cyan-500 uppercase tracking-widest block ml-1">Grupo Familiar (Para unificar cobros)</label>
                    {gruposExistentes.length > 0 && (
                        <select 
                            className="bg-zinc-900 border border-cyan-500/30 text-cyan-400 text-[9px] font-black uppercase rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-zinc-800 transition-colors"
                            onChange={(e) => { if(e.target.value) setFormGrupoFamiliar(e.target.value); }}
                            value=""
                        >
                            <option value="">+ Elegir Existente...</option>
                            {gruposExistentes.map((g: any) => <option key={g} value={g}>{g}</option>)}
                        </select>
                    )}
                </div>
                <input 
                    type="text" 
                    value={formGrupoFamiliar} 
                    onChange={e => setFormGrupoFamiliar(e.target.value)} 
                    className="w-full bg-zinc-950/50 border border-cyan-500/30 text-cyan-400 text-xs uppercase font-bold px-5 py-4 rounded-xl outline-none focus:border-cyan-400 placeholder:text-cyan-900/50 transition-all" 
                    placeholder="Escribe uno nuevo o elige de la lista 👆" 
                />
            </div>
        </div>

        <button onClick={inscribirGimnasta} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-5 rounded-[1.5rem] uppercase tracking-[0.3em] text-[10px] shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 transition-all mt-6">REGISTAR INSCRIPCION</button>
    </div>
)}

        {/* GASTOS Y CAJA */}
        {vistaActual === 'gastos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-left">
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
                        {ingresosExtra.map(i => (
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
                        {gastosVarios.map(g => (
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

        {/* NÓMINA DE PROFESORES */}
        {vistaActual === 'nomina' && (
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
                                <select className="bg-zinc-950/80 p-5 rounded-2xl border border-white/10 outline-none text-white w-full text-xs font-black uppercase focus:border-cyan-500 shadow-inner" value={nominaProfe} onChange={(e: any) => setNominaProfe(e.target.value)}>{listaProfesores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}</select>
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
                            {pagosProfes.map(p => (
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
        )}

        {/* MODAL PERFIL MAESTRO */}
        {perfilSeleccionado && (
            <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[100] backdrop-blur-2xl animate-in fade-in duration-300 text-left">
                <div className="bg-zinc-900 w-full max-w-md rounded-[3rem] p-10 border border-white/10 relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]">
                    <img src="/logob.png" className="absolute -top-10 -right-10 w-48 h-48 opacity-[0.03] pointer-events-none rotate-12" />
                    <button onClick={() => setPerfilSeleccionado(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-all hover:rotate-90 duration-300 bg-white/5 p-2 rounded-full"><X size={20}/></button>
                    
                    {!modoEdicionPerfil ? (
                        <>
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-16 h-16 rounded-full bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shadow-inner overflow-hidden">
                                    {perfilSeleccionado.foto_url ? (
                                        <img src={perfilSeleccionado.foto_url} alt="Perfil" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={28}/>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">{perfilSeleccionado.nombre}</h2>
                                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em] flex items-center gap-1 mt-1"><Briefcase size={10} className="text-cyan-500"/> {perfilSeleccionado.profesor}</p>
                                    {perfilSeleccionado.grupo_familiar && (
                                        <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mt-1 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 inline-block">{perfilSeleccionado.grupo_familiar}</p>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => iniciarEdicion(perfilSeleccionado)} className="w-full text-[9px] bg-white/5 hover:bg-white/10 py-3 rounded-xl uppercase font-black text-zinc-400 mb-8 transition-colors flex items-center justify-center gap-2"><Edit size={12}/> Modificar Ficha Técnica</button>
                        </>
                    ) : (
                        <div className="mb-8 space-y-4 animate-in fade-in">
                             <h2 className="text-lg font-black uppercase tracking-widest mb-6 text-cyan-400 border-b border-white/5 pb-4"><Edit size={16} className="inline mr-2 -mt-1"/> Edición de Perfil</h2>
                             <div className="flex flex-col items-center justify-center mb-6">
                                <label className="cursor-pointer relative group">
                                    <div className={`w-20 h-20 rounded-full border-2 border-dashed ${editFotoPreview ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-zinc-600'} flex items-center justify-center overflow-hidden bg-zinc-900/50 group-hover:bg-zinc-800 transition-all`}>
                                        {editFotoPreview ? (
                                            <img src={editFotoPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera size={24} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setEditFoto(e.target.files[0]);
                                            setEditFotoPreview(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }} />
                                </label>
                                <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mt-2">Cambiar Foto</p>
                            </div>
                            
                            <InputStyled label="Nombre" value={editNombre} onChange={(e: any) => setEditNombre(e.target.value)} />
                            <InputStyled label="Teléfono" value={editTelefono} onChange={(e: any) => setEditTelefono(e.target.value)} /> 
                            
                            {/* TOGGLE DE DESCUENTO Y GRUPO FAMILIAR (SEPARADOS) */}
                            <div className="flex items-center gap-3 bg-zinc-950/50 p-4 rounded-xl border border-white/5 mb-2 mt-4">
                                <input type="checkbox" id="editEsHermana" checked={editEsHermana} onChange={(e) => setEditEsHermana(e.target.checked)} className="w-5 h-5 accent-cyan-500 cursor-pointer rounded-sm" />
                                <label htmlFor="editEsHermana" className="text-[10px] font-black text-cyan-400 uppercase tracking-widest cursor-pointer">Activar Descuento 50% (Solo para 2da hermana)</label>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Grupo Familiar (Para unificar cobros)</label>
                                    {gruposExistentes.length > 0 && (
                                        <select 
                                            className="bg-zinc-900 border border-cyan-500/30 text-cyan-400 text-[9px] font-black uppercase rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-zinc-800 transition-colors"
                                            onChange={(e) => { if(e.target.value) setEditGrupoFamiliar(e.target.value); }}
                                            value=""
                                        >
                                            <option value="">+ Elegir Existente...</option>
                                            {gruposExistentes.map((g: any) => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    )}
                                </div>
                                <input 
                                    type="text" 
                                    value={editGrupoFamiliar} 
                                    onChange={e => setEditGrupoFamiliar(e.target.value)} 
                                    className="w-full bg-zinc-950/50 border border-cyan-500/30 text-cyan-400 text-xs uppercase font-bold px-4 py-3 rounded-xl outline-none focus:border-cyan-400 placeholder:text-cyan-900/50 transition-all" 
                                    placeholder="Escribe uno nuevo o elige de la lista 👆" 
                                />
                            </div>
                            
                            <InputStyled label="Clave Portal" value={editClave} onChange={(e: any) => setEditClave(e.target.value)} />
                            <InputStyled label="Fecha de Corte" type="date" value={editVencimiento} onChange={(e: any) => setEditVencimiento(e.target.value)} />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-left"><label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-2 tracking-widest">Plan</label><select className="bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-[10px] font-black uppercase" value={editPaquete} onChange={(e: any) => setEditPaquete(e.target.value)}>{paquetes.map(p => <option key={p.id} value={p.id} className="bg-zinc-900">{p.nombre}</option>)}</select></div>
                                <div className="text-left"><label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-2 tracking-widest">Profesor</label><select className="bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-[10px] font-black uppercase" value={editProfesor} onChange={(e: any) => setEditProfesor(e.target.value)}>{listaProfesores.map(p => <option key={p.id} value={p.nombre} className="bg-zinc-900">{p.nombre}</option>)}</select></div>
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setModoEdicionPerfil(false)} className="flex-1 py-4 bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors">Cancelar</button>
                                <button onClick={guardarCambiosPerfil} className="flex-1 py-4 bg-cyan-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">Guardar Cambios</button>
                            </div>
                        </div>
                    )}
                    
                    {!modoEdicionPerfil && (
                        <>
                            <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5 shadow-inner">
                                <button onClick={() => setTabPerfil('finanzas')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${tabPerfil === 'finanzas' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 shadow-lg' : 'text-zinc-600 hover:text-white'}`}><DollarSign size={14}/> Finanzas</button>
                                <button onClick={() => setTabPerfil('asistencia')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${tabPerfil === 'asistencia' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 shadow-lg' : 'text-zinc-600 hover:text-white'}`}><CalendarCheck size={14}/> Asistencia</button>
                            </div>

                            <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar text-left">
                                {tabPerfil === 'finanzas' ? (
                                    <div className="space-y-6">
                                        {(() => {
                                            const mora = calcularMora(perfilSeleccionado);
                                            return mora.meses > 0 && (
                                                <div className="p-6 bg-red-950/40 border border-red-500/30 rounded-[2rem] animate-in slide-in-from-bottom-2 shadow-lg">
                                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><ShieldAlert size={14}/> Alerta de Mora</p>
                                                    <p className="text-white text-sm font-black uppercase leading-tight mb-1">Deuda de {mora.meses} Meses:</p>
                                                    <p className="text-red-300 text-[10px] uppercase font-bold tracking-widest mb-4">{mora.nombres.join(", ")}</p>
                                                    <div className="bg-black/40 p-4 rounded-xl mb-4 text-center border border-white/5 flex justify-between items-center"><span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Saldo Pendiente </span><span className="text-xl font-black text-red-400">${mora.deudaTotal.toLocaleString()}</span></div>
                                                    
                                                    {/* BOTÓN INTELIGENTE CONECTADO */}
                                                    <button onClick={() => enviarRecordatorioMora(perfilSeleccionado, mora)} className="w-full py-4 bg-green-600 rounded-xl text-white font-black uppercase text-[10px] tracking-widest shadow-[0_5px_15px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2 hover:bg-green-500 transition-colors hover:scale-[1.02] active:scale-95"><AlertCircle size={14}/> Enviar recordatorio </button>
                                                </div>
                                            );
                                        })()}

                                        <div className="p-8 bg-zinc-950/50 rounded-[2rem] border border-white/5 text-center shadow-inner relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600"></div>
                                            <p className="text-[9px] text-zinc-500 uppercase font-black mb-2 tracking-[0.3em]">Corte de Facturación</p>
                                            <p className="text-2xl font-black text-white mb-6 tracking-tighter">{new Date(perfilSeleccionado.proximo_vencimiento).toLocaleDateString()}</p>
                                            <button onClick={() => iniciarCobro(perfilSeleccionado)} className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-[0_5px_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all"><Check size={14} className="inline mr-2 -mt-0.5"/> Procesar Pago</button>
                                        </div>
                                        
                                        <div className="space-y-3 text-left pt-4 border-t border-white/5">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase mb-3 ml-2 tracking-[0.3em]">Ledger de Transacciones</p>
                                            {pagos.filter(p => p.gimnasta_id === perfilSeleccionado.id).map(p => (
                                                <div key={p.id} className="flex justify-between p-5 bg-black/20 rounded-2xl border border-white/5 items-center group hover:bg-white/5 transition-colors">
                                                    <div className="text-left"><p className="text-[10px] font-black text-white uppercase tracking-wider mb-1">{p.concepto}</p><p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(p.created_at).toLocaleDateString()}</p><p className="text-emerald-400 font-black text-sm mt-1 tracking-tight">$ {p.monto.toLocaleString()}</p></div>
                                                    <div className="flex gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => editarPago(p)} className="p-3 bg-zinc-800 rounded-xl hover:bg-cyan-600 text-zinc-400 hover:text-white transition-colors shadow-lg"><Edit size={14}/></button>
                                                        <button onClick={() => borrarPago(p.id)} className="p-3 bg-zinc-800 rounded-xl hover:bg-red-600 text-zinc-400 hover:text-white transition-colors shadow-lg"><Trash2 size={14}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => eliminarGimnasta(perfilSeleccionado.id)} className="w-full py-5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] transition-all mt-8"><Trash2 size={14} className="inline mr-2 -mt-1"/> Destruir Ficha Técnica</button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-3 text-left">
                                        {todasAsistencias.filter(a => a.gimnasta_id === perfilSeleccionado.id).map(a => (
                                            <div key={a.id} className="bg-cyan-900/10 p-4 rounded-2xl text-center border border-cyan-500/20 shadow-inner">
                                                <p className="text-2xl font-black text-cyan-400 mb-1 leading-none">{new Date(a.fecha).getDate()}</p>
                                                <p className="text-[8px] text-cyan-500/50 uppercase font-black tracking-widest">{new Date(a.fecha).toLocaleDateString('es-ES', {month:'short'})}</p>
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

        {/* MODAL DE ALERTA PREMIUM */}
        {modalAlerta && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[200] backdrop-blur-2xl animate-in fade-in duration-300">
                <div className="bg-zinc-900 border border-white/10 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-[0_0_100px_rgba(0,0,0,0.8)] scale-100 animate-in zoom-in-95 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-2 ${modalAlerta.tipo === 'exito' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-4 ${modalAlerta.tipo === 'exito' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20 shadow-[0_0_40px_rgba(34,197,94,0.3)]' : 'bg-red-900/30 text-red-400 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.3)]'}`}>
                        {modalAlerta.tipo === 'exito' ? <CheckCircle2 size={40}/> : <ShieldAlert size={40}/>}
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-3">{modalAlerta.titulo}</h3>
                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mb-10 leading-relaxed">{modalAlerta.mensaje}</p>
                    <button onClick={() => setModalAlerta(null)} className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] uppercase tracking-[0.2em] text-[10px] transition-all hover:scale-[1.03] active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.1)]">Cerrar Notificación</button>
                </div>
            </div>
        )}

        {/* MODAL INTERACTIVO PREMIUM */}
        {modalInteractivo && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[250] backdrop-blur-2xl animate-in fade-in duration-300">
                <div className="bg-zinc-900 border border-white/10 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-[0_0_100px_rgba(0,0,0,0.8)] scale-100 animate-in zoom-in-95 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-2 ${modalInteractivo.tipo === 'peligro' ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-4 ${modalInteractivo.tipo === 'peligro' ? 'bg-red-900/30 text-red-400 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'bg-cyan-900/30 text-cyan-400 border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.3)]'}`}>
                        {modalInteractivo.tipo === 'peligro' ? <Trash2 size={40}/> : <HelpCircle size={40}/>}
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-3">{modalInteractivo.titulo}</h3>
                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest mb-8 leading-relaxed">{modalInteractivo.mensaje}</p>
                    
                    {modalInteractivo.tipo === 'prompt' && <input type="text" value={inputPromptValue} onChange={(e) => setInputPromptValue(e.target.value)} placeholder={modalInteractivo.placeholder} className="w-full bg-black/40 p-5 rounded-2xl border border-white/10 outline-none text-white focus:border-cyan-500 transition-all text-center mb-8 font-black uppercase text-sm shadow-inner" autoFocus />}
                    
                    <div className="flex gap-4">
                        <button onClick={() => { setModalInteractivo(null); setInputPromptValue(""); }} className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 font-black py-5 rounded-2xl uppercase tracking-widest text-[9px] transition-all active:scale-95 border border-white/5">Cancelar</button>
                        <button onClick={() => { modalInteractivo.accionConfirmar(inputPromptValue); setModalInteractivo(null); setInputPromptValue(""); }} className={`flex-1 font-black py-5 rounded-2xl uppercase tracking-widest text-[9px] transition-all active:scale-95 text-white ${modalInteractivo.tipo === 'peligro' ? 'bg-red-600 hover:bg-red-500 shadow-[0_10px_20px_rgba(239,68,68,0.3)]' : 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_10px_20px_rgba(6,182,212,0.3)]'}`}>Confirmar</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL CAJA REGISTRADORA (ABONOS, MESES Y PAGOS TOTALES) */}
        {modalCobroMultiple && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[150] backdrop-blur-2xl animate-in fade-in duration-300 text-left">
                <div className="bg-zinc-900 border border-white/10 rounded-[3rem] p-10 max-w-md w-full shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                    <button onClick={() => setModalCobroMultiple(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-all hover:rotate-90 duration-300 bg-white/5 p-2 rounded-full"><X size={16}/></button>
                    
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-1"><DollarSign size={20} className="inline mr-1 text-emerald-400"/> Caja de Recaudo</h3>
                    
                    {/* INFO DEUDA TOTAL Y ALUMNA */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-5 mt-4">
                        <div>
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">{modalCobroMultiple.gimnasta.nombre}</p>
                            <p className="text-xs font-black text-white uppercase mt-1 flex items-center gap-2">
                                Estado: {modalCobroMultiple.mora.meses > 0 ? <span className="text-red-400">{modalCobroMultiple.mora.meses} meses en mora</span> : <span className="text-emerald-400">Al día</span>}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Deuda Total</p>
                            <p className="text-xl font-black text-red-400">${modalCobroMultiple.mora.deudaTotal.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* BOTONES DE SELECCIÓN RÁPIDA DINÁMICOS */}
                    <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] mb-3">Autocompletar valor</p>
                    <div className="flex flex-wrap gap-3 mb-6">
                        {/* 1. Dibujamos todos los botones MENOS el último mes */}
                        {Array.from({ length: Math.max(0, modalCobroMultiple.mora.meses - 1) }).map((_, i) => {
                            const mesesAbono = i + 1;

                            return (
                                <button 
                                    key={mesesAbono}
                                    onClick={() => setModalCobroMultiple({...modalCobroMultiple, montoAbono: (modalCobroMultiple.mora.precioIndividual * mesesAbono).toString()})} 
                                    className="flex-1 min-w-[70px] bg-zinc-800 hover:bg-emerald-900/40 hover:text-emerald-400 hover:border-emerald-500/30 text-zinc-300 border border-white/5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                                >
                                    {mesesAbono} {mesesAbono === 1 ? 'Mes' : 'Meses'}
                                </button>
                            );
                        })}
                        
                        {/* 2. Si NO debe nada (o paga adelantado), mostramos "1 Mes". Si debe, mostramos "Pagar Todo" */}
                        <button 
                            onClick={() => setModalCobroMultiple({...modalCobroMultiple, montoAbono: modalCobroMultiple.mora.deudaTotal > 0 ? modalCobroMultiple.mora.deudaTotal.toString() : modalCobroMultiple.mora.precioIndividual.toString()})} 
                            className="flex-[2] min-w-[100px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                        >
                            {modalCobroMultiple.mora.meses <= 0 ? "Pagar 1 Mes" : "Pagar Todo"}
                        </button>
                    </div>
                    
                    {/* CAJÓN DE ENTRADA MANUAL */}
                    <div className="bg-black/30 rounded-[2rem] p-6 border border-white/5 mb-8 text-center shadow-inner relative">
                        <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] mb-4">Monto Exacto a Recibir</p>
                        
                        <div className="relative mb-2">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-500/50">$</span>
                            <input 
                                type="number" 
                                value={modalCobroMultiple.montoAbono} 
                                onChange={(e) => setModalCobroMultiple({...modalCobroMultiple, montoAbono: e.target.value})}
                                className="w-full bg-zinc-950 border border-emerald-500/20 text-emerald-400 text-3xl font-black rounded-2xl py-6 pl-12 pr-6 text-right outline-none focus:border-emerald-400 transition-all shadow-inner"
                                autoFocus
                            />
                        </div>
                        <p className="text-[8px] uppercase font-black tracking-widest text-zinc-500 mt-3">Toca los botones de arriba o edita el valor a mano.</p>
                    </div>

                    <button onClick={procesarPago} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_30px_rgba(34,197,94,0.3)] active:scale-95 transition-all flex justify-center items-center gap-2"><Check size={18}/> APROBAR Y ENVIAR RECIBO</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}