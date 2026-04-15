"use client";
import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { UserPlus, Camera, Check, MinusCircle, HelpCircle, Cake, CalendarDays, Gift } from "lucide-react";

// --- CONEXIÓN DIRECTA ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- UTILIDADES LOCALES ---
const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]; 

const obtenerFechaColombia = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
};

const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const InputStyled = (props: any) => (
  <div className="text-left w-full">
    {props.label && <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">{props.label}</label>}
    <input {...props} className="w-full bg-zinc-950/50 p-4 rounded-2xl border border-white/10 outline-none text-white focus:border-cyan-500 transition-all focus:scale-[1.01] focus:bg-zinc-900/80 placeholder-zinc-700 text-xs font-bold uppercase shadow-inner" />
  </div>
);

// --- INTERFAZ DE PROPS ---
interface InscripcionesProps {
    paquetes: any[];
    listaProfesores: any[];
    gruposExistentes: string[];
    estudiantes: any[]; // <--- NUEVO: Necesario para leer los cumpleaños
    setModalAlerta: (alerta: { titulo: string, mensaje: string, tipo: 'exito'|'error' } | null) => void;
    cargarTodo: () => void;
    setVistaActual: (vista: string) => void;
}

export default function InscripcionesModulo({ 
    paquetes, 
    listaProfesores, 
    gruposExistentes, 
    estudiantes, // <--- NUEVO
    setModalAlerta, 
    cargarTodo, 
    setVistaActual 
}: InscripcionesProps) {
    
    // --- ESTADOS LOCALES ---
    const [formNombre, setFormNombre] = useState("");
    const [formTelefono, setFormTelefono] = useState("57");
    const [formClave, setFormClave] = useState("");
    const [formFechaNacimiento, setFormFechaNacimiento] = useState(""); // <--- NUEVO ESTADO
    const [formPaqueteId, setFormPaqueteId] = useState("");
    const [formDias, setFormDias] = useState<string[]>([]);
    const [formProfesor, setFormProfesor] = useState(listaProfesores.length > 0 ? listaProfesores[0].nombre : ""); 
    const [formPagoInmediato, setFormPagoInmediato] = useState(true);
    const [formEsHermana, setFormEsHermana] = useState(false);
    const [formFechaManual, setFormFechaManual] = useState(obtenerFechaColombia());
    const [formFoto, setFormFoto] = useState<File | null>(null);
    const [formFotoPreview, setFormFotoPreview] = useState<string | null>(null);
    const [formGrupoFamiliar, setFormGrupoFamiliar] = useState("");

    const toggleDia = (dia: string) => {
        if (formDias.includes(dia)) setFormDias(formDias.filter(d => d !== dia));
        else setFormDias([...formDias, dia]);
    };

    // 📸 FUNCIÓN PARA SUBIR FOTO
    const subirFotoSupabase = async (archivo: File) => {
        const fileExt = archivo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`; 

        const { error: uploadError } = await supabase.storage
            .from('fotos_alumnas')
            .upload(filePath, archivo);

        if (uploadError) {
            console.error("Error al subir foto:", uploadError);
            return null;
        }
        const { data } = supabase.storage.from('fotos_alumnas').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const inscribirGimnasta = async () => {
        // Validación actualizada para exigir fecha de nacimiento
        if (!formNombre || !formPaqueteId || !formClave || !formFechaNacimiento) {
            return setModalAlerta({ titulo: "Faltan Datos", mensaje: "Nombre, plan, clave y fecha de nacimiento son obligatorios.", tipo: "error" });
        }
        
        setModalAlerta({ titulo: "Procesando...", mensaje: "Guardando ficha técnica y subiendo foto...", tipo: "exito" });

        let urlFotoGuardada = null;
        if (formFoto) {
            urlFotoGuardada = await subirFotoSupabase(formFoto);
        }

        const fechaBase = new Date(formFechaManual); 
        const vencimiento = new Date(fechaBase);
        if (formPagoInmediato) vencimiento.setDate(fechaBase.getDate() + 30); else vencimiento.setDate(fechaBase.getDate() - 1);
        
        const precioFull = paquetes.find(p => p.id == formPaqueteId)?.precio || 0;
        const montoInicial = formEsHermana ? (precioFull / 2) : precioFull;
        
        const { data: nueva, error } = await supabase.from("gimnastas").insert([{ 
            nombre: formNombre, 
            telefono_acudiente: formTelefono, 
            paquete_id: formPaqueteId, 
            dias: formDias, 
            profesor: formProfesor, 
            estado: formPagoInmediato ? "Activo" : "Pendiente", 
            proximo_vencimiento: vencimiento.toISOString(), 
            created_at: fechaBase.toISOString(),
            fecha_nacimiento: formFechaNacimiento, // <--- ENVIADO A SUPABASE
            es_hermana: formEsHermana, 
            clave_acceso: formClave, 
            requiere_cambio_clave: true,
            foto_url: urlFotoGuardada,
            grupo_familiar: formGrupoFamiliar || null 
        }]).select().single();

        if (error) {
             console.error("Error BD:", error);
             setModalAlerta({ titulo: "Error", mensaje: "Hubo un problema al conectar con la base de datos.", tipo: "error" });
             return;
        }

        if (formPagoInmediato && nueva) {
          await supabase.from("pagos").insert([{ gimnasta_id: nueva.id, monto: montoInicial, concepto: formEsHermana ? "Inscripción (Desc. Hermana)" : "Inscripción", created_at: fechaBase.toISOString() }]);
        }
        
        setModalAlerta({ titulo: "¡Bienvenida a Elite!", mensaje: "Alumna inscrita con éxito.", tipo: "exito" });
        
        // Limpiar
        setFormNombre(""); setFormTelefono("57"); setFormClave(""); setFormDias([]); 
        setFormFoto(null); setFormFotoPreview(null); setFormGrupoFamiliar(""); setFormFechaNacimiento("");
        
        cargarTodo(); 
        setVistaActual('directorio');
    };

    // --- LÓGICA DE CUMPLEAÑOS ---
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1; // 1-12
    const anioActual = fechaActual.getFullYear();

    const cumpleanerasMes = estudiantes.filter(e => {
        if (!e.fecha_nacimiento) return false;
        // Supabase guarda fechas como YYYY-MM-DD
        const [, mesNac] = e.fecha_nacimiento.split('-');
        return parseInt(mesNac) === mesActual;
    }).sort((a, b) => {
        const diaA = parseInt(a.fecha_nacimiento.split('-')[2]);
        const diaB = parseInt(b.fecha_nacimiento.split('-')[2]);
        return diaA - diaB;
    });

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* WIDGET DE CUMPLEAÑOS DEL MES */}
            {cumpleanerasMes.length > 0 && (
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-pink-900/20 to-purple-900/20 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-pink-500/20 shadow-2xl relative overflow-hidden text-left">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-pink-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 border border-pink-500/30">
                            <Cake size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-white">Cumpleaños de {nombresMeses[mesActual - 1]}</h2>
                            <p className="text-[10px] text-pink-300/70 font-bold uppercase tracking-[0.2em]">Celebraciones de este mes</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 relative z-10">
                        {cumpleanerasMes.map(g => {
                            const [anioNac, , diaNac] = g.fecha_nacimiento.split('-');
                            const edadCumplida = anioActual - parseInt(anioNac);
                            const diaDeHoy = fechaActual.getDate();
                            const esHoy = parseInt(diaNac) === diaDeHoy;

                            return (
                                <div key={g.id} className={`flex items-center gap-4 p-4 pr-6 rounded-2xl border transition-all ${esHoy ? 'bg-pink-600 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.4)] scale-105' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}>
                                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-inner ${esHoy ? 'bg-white text-pink-600' : 'bg-zinc-800 text-zinc-400'}`}>
                                        <span className="text-[8px] font-black uppercase tracking-widest">{nombresMeses[mesActual - 1].substring(0,3)}</span>
                                        <span className="text-lg font-black leading-none">{diaNac}</span>
                                    </div>
                                    <div>
                                        <p className={`font-black uppercase text-sm leading-tight mb-1 ${esHoy ? 'text-white' : 'text-zinc-200'}`}>{g.nombre.split(' ')[0]} {g.nombre.split(' ')[1] || ''}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1 ${esHoy ? 'text-pink-200' : 'text-zinc-500'}`}>
                                            {esHoy ? <Gift size={10} /> : <CalendarDays size={10} />}
                                            {esHoy ? '¡CUMPLE HOY!' : `Cumple ${edadCumplida} años`}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* FORMULARIO DE INSCRIPCIÓN */}
            <div className="max-w-2xl mx-auto bg-zinc-900/60 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-600 to-blue-600"></div>
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-500/20 mx-auto mb-4"><UserPlus size={28} /></div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">FICHA de LA GIMNASTA</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Creación de Perfil Oficial</p>
                </div>
            
                <div className="space-y-5 bg-black/20 p-8 rounded-[2rem] border border-white/5">
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
                    
                    {/* NUEVA FILA: FECHA NACIMIENTO Y TELÉFONO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputStyled label="Teléfono (WhatsApp)" placeholder="Ej: 573001234567" value={formTelefono} onChange={(e: any) => setFormTelefono(e.target.value)} /> 
                        <InputStyled label="Fecha de Nacimiento" type="date" value={formFechaNacimiento} onChange={(e: any) => setFormFechaNacimiento(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputStyled label="Clave de Seguridad" placeholder="Ej: Doc. Identidad" value={formClave} onChange={(e: any) => setFormClave(e.target.value)} />
                        <InputStyled label="Fecha de Registro Base" type="date" value={formFechaManual} onChange={(e: any) => setFormFechaManual(e.target.value)} />
                    </div>
                </div>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left mt-5">
                    <div className="bg-black/20 p-5 rounded-3xl border border-white/5">
                        <label className="text-[9px] font-black text-cyan-500 uppercase tracking-widest block mb-2 ml-1">Plan Contratado</label>
                        <select className="bg-zinc-900 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-xs font-bold uppercase focus:border-cyan-500 transition-colors shadow-inner" value={formPaqueteId} onChange={(e: any) => setFormPaqueteId(e.target.value)}><option value="" className="bg-zinc-900">SELECCIONAR PLAN...</option>{paquetes.map(p => <option key={p.id} value={p.id} className="bg-zinc-900">{p.nombre} - $ {p.precio.toLocaleString()}</option>)}</select>
                    </div>
                    <div className="bg-black/20 p-5 rounded-3xl border border-white/5">
                        <label className="text-[9px] font-black text-cyan-500 uppercase tracking-widest block mb-2 ml-1">Profesor Responsable</label>
                        <select className="bg-zinc-900 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-xs font-bold uppercase focus:border-cyan-500 transition-colors shadow-inner" value={formProfesor} onChange={(e: any) => setFormProfesor(e.target.value)}>{listaProfesores.map(p => <option key={p.id} value={p.nombre} className="bg-zinc-900">{p.nombre}</option>)}</select>
                    </div>
                </div>

                <div className="text-left bg-black/20 p-6 rounded-[2rem] border border-white/5 mt-5">
                     <label className="text-[9px] font-black text-cyan-500 uppercase tracking-widest block mb-4 ml-1">Asignación de Horario (Días)</label>
                     <div className="flex flex-wrap gap-3">
                         {diasSemana.map(dia => (
                            <button key={dia} onClick={() => toggleDia(dia)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-90 ${formDias.includes(dia) ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border border-white/5'}`}>{dia}</button>
                         ))}
                     </div>
                </div>
            
                <div className="space-y-4 mt-5">
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

                <button onClick={inscribirGimnasta} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-5 rounded-[1.5rem] uppercase tracking-[0.3em] text-[10px] shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 transition-all mt-6">REGISTRAR INSCRIPCIÓN</button>
            </div>
        </div>
    );
}