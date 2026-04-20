"use client";
import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { 
    X, User, Briefcase, Edit, Camera, DollarSign, CalendarCheck, 
    ShieldAlert, AlertCircle, Check, Trash2, Plus
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const InputStyled = (props: any) => (
  <div className="text-left w-full">
    {props.label && <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">{props.label}</label>}
    <input 
      {...props} 
      className="w-full bg-zinc-950/50 p-4 rounded-2xl border border-white/10 outline-none text-white focus:border-cyan-500 transition-all focus:scale-[1.01] focus:bg-zinc-900/80 placeholder-zinc-700 text-xs font-bold uppercase shadow-inner" 
    />
  </div>
);

export default function PerfilGimnasta({ 
    perfilSeleccionado, setPerfilSeleccionado, estudiantes, paquetes, 
    listaProfesores, pagos, todasAsistencias, cargarTodo, 
    setModalAlerta, setModalInteractivo 
}: any) {
    const [tabPerfil, setTabPerfil] = useState<'finanzas' | 'asistencia'>('finanzas');
    const [modoEdicionPerfil, setModoEdicionPerfil] = useState(false);
    
    // Estados Edición
    const [editNombre, setEditNombre] = useState(perfilSeleccionado.nombre);
    const [editTelefono, setEditTelefono] = useState(perfilSeleccionado.telefono_acudiente || "57");
    const [editPaquete, setEditPaquete] = useState(perfilSeleccionado.paquete_id);
    const [editProfesor, setEditProfesor] = useState(perfilSeleccionado.profesor);
    const [editEsHermana, setEditEsHermana] = useState(perfilSeleccionado.es_hermana || false);
    const [editGrupoFamiliar, setEditGrupoFamiliar] = useState(perfilSeleccionado.grupo_familiar || "");
    const [editVencimiento, setEditVencimiento] = useState(new Date(perfilSeleccionado.proximo_vencimiento).toISOString().split('T')[0]);
    const [editClave, setEditClave] = useState(perfilSeleccionado.clave_acceso || "");
    const [editFechaNacimiento, setEditFechaNacimiento] = useState(perfilSeleccionado.fecha_nacimiento || "");
    const [editFoto, setEditFoto] = useState<File | null>(null);
    const [editFotoPreview, setEditFotoPreview] = useState<string | null>(perfilSeleccionado.foto_url || null);
    
    // NUEVO ESTADO PARA MODAL DE COBRO MULTIPLE
    const [modalCobroMultiple, setModalCobroMultiple] = useState<any>(null);

    const gruposExistentes = Array.from(new Set(estudiantes.map((e: any) => e.grupo_familiar).filter(Boolean)));

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

        return { meses: mesesMora.length, nombres: mesesMora, deudaTotal: mesesMora.length * precioPlan, precioIndividual: precioPlan };
    };

    const subirFotoSupabase = async (archivo: File) => {
        const fileExt = archivo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from('fotos_alumnas').upload(fileName, archivo);
        if (error) return null;
        const { data } = supabase.storage.from('fotos_alumnas').getPublicUrl(fileName);
        return data.publicUrl;
    };

    const guardarCambiosPerfil = async () => {
        setModalInteractivo({
            abierto: true, tipo: 'prompt', titulo: 'Verificación de Seguridad', mensaje: 'Escribe CONFIRMAR en mayúsculas:', placeholder: 'Escribe CONFIRMAR',
            accionConfirmar: async (val: string) => {
                if (val !== "CONFIRMAR") return setModalAlerta({ titulo: "Cancelado", mensaje: "No escribiste la palabra clave.", tipo: "error" });
                setModalAlerta({ titulo: "Procesando...", mensaje: "Guardando cambios...", tipo: "exito" });

                let urlFotoActualizada = perfilSeleccionado.foto_url;
                if (editFoto) {
                    const nuevaUrl = await subirFotoSupabase(editFoto);
                    if (nuevaUrl) urlFotoActualizada = nuevaUrl;
                }

                const { error } = await supabase.from("gimnastas").update({ 
                    nombre: editNombre, telefono_acudiente: editTelefono, paquete_id: editPaquete, profesor: editProfesor,
                    es_hermana: editEsHermana, proximo_vencimiento: new Date(editVencimiento).toISOString(),
                    clave_acceso: editClave, requiere_cambio_clave: true, foto_url: urlFotoActualizada,
                    grupo_familiar: editGrupoFamiliar, fecha_nacimiento: editFechaNacimiento
                }).eq('id', perfilSeleccionado.id);

                if (error) setModalAlerta({ titulo: "Error", mensaje: "Hubo un problema al guardar.", tipo: "error" });
                else { 
                    setModalAlerta({ titulo: "Guardado", mensaje: "Perfil actualizado.", tipo: "exito" });
                    setModoEdicionPerfil(false); 
                    setPerfilSeleccionado({ ...perfilSeleccionado, nombre: editNombre, telefono_acudiente: editTelefono, paquete_id: editPaquete, profesor: editProfesor, es_hermana: editEsHermana, proximo_vencimiento: new Date(editVencimiento).toISOString(), clave_acceso: editClave, foto_url: urlFotoActualizada, grupo_familiar: editGrupoFamiliar, fecha_nacimiento: editFechaNacimiento, paquetes: paquetes.find((p:any) => p.id == editPaquete) }); 
                    cargarTodo(); 
                }
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
        const mesesPagar = mora.meses > 0 ? mora.meses : 1;
        setModalCobroMultiple({ 
            gimnasta, 
            mora, 
            mesesSeleccionados: mesesPagar, 
            montoMensualidad: (mora.precioIndividual * mesesPagar).toString(),
            montoInscripcion: "0" // Por defecto en 0 para que no estorbe si solo pagan mes
        });
    };

    const procesarPago = async () => {
        const { gimnasta, mora, montoMensualidad, montoInscripcion } = modalCobroMultiple;
        
        const valMensualidad = Number(montoMensualidad) || 0;
        const valInscripcion = Number(montoInscripcion) || 0;
        const montoTotal = valMensualidad + valInscripcion;

        if (montoTotal <= 0) return setModalAlerta({ titulo: "Error", mensaje: "Ingresa un monto superior a $0.", tipo: "error" });

        // CÁLCULOS DE MENSUALIDAD Y VENCIMIENTO
        const precioFull = gimnasta.paquetes?.precio || 0;
        const precioIndividual = gimnasta.es_hermana ? (precioFull / 2) : precioFull;
        let diasComprados = 0;
        let saldoRestante = mora.deudaTotal;
        let conceptoMensualidad = gimnasta.es_hermana ? "Mensualidad / Abono (Hermana)" : "Mensualidad / Abono";

        if (valMensualidad > 0 && precioIndividual > 0) {
            diasComprados = Math.round((valMensualidad / precioIndividual) * 30);
            saldoRestante = mora.deudaTotal - valMensualidad;
        }

        // MENSAJE WHATSAPP
        let mensajeRecibo = `¡Hola! Un saludo de Elite Gymnastics.\n\nHemos recibido exitosamente tu pago por un total de *$${montoTotal.toLocaleString()}* para la alumna *${gimnasta.nombre}*.\n\n*Detalle del pago:*\n`;
        
        if (valInscripcion > 0) {
            mensajeRecibo += `• Inscripción / Matrícula: *$${valInscripcion.toLocaleString()}*\n`;
        }
        if (valMensualidad > 0) {
            let mesesPagados = Math.floor(valMensualidad / Math.max(precioIndividual, 1));
            let textoMeses = mesesPagados > 0 && mora.nombres.length > 0 ? ` (${mora.nombres.slice(0, mesesPagados).join(", ")})` : "";
            mensajeRecibo += `• Mensualidad${textoMeses}: *$${valMensualidad.toLocaleString()}*\n`;
        }

        if (saldoRestante > 0) {
            mensajeRecibo += `\nAún presenta un saldo pendiente de *$${saldoRestante.toLocaleString()}* en mensualidades.`;
        } else {
            mensajeRecibo += `\nLa cuenta se encuentra al día. ¡Gracias por tu apoyo!`;
        }

        // REDIRECCIÓN A WHATSAPP
        if (gimnasta.telefono_acudiente && gimnasta.telefono_acudiente.length >= 10) {
            let numeroLimpio = gimnasta.telefono_acudiente.replace(/\D/g, ''); 
            if (numeroLimpio.length === 10) numeroLimpio = '57' + numeroLimpio;
            window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensajeRecibo)}`, '_blank');
        }
        
        // GUARDADO EN BASE DE DATOS
        if (valInscripcion > 0) {
            await supabase.from("pagos").insert({ gimnasta_id: gimnasta.id, monto: valInscripcion, concepto: "Inscripción / Matrícula" });
        }
        
        if (valMensualidad > 0) {
            await supabase.from("pagos").insert({ gimnasta_id: gimnasta.id, monto: valMensualidad, concepto: conceptoMensualidad });
            // Solo rodamos la fecha si pagó algo de mensualidad
            const fVence = new Date(gimnasta.proximo_vencimiento); 
            fVence.setDate(fVence.getDate() + diasComprados);
            await supabase.from("gimnastas").update({ proximo_vencimiento: fVence.toISOString() }).eq('id', gimnasta.id);
            setPerfilSeleccionado({ ...perfilSeleccionado, proximo_vencimiento: fVence.toISOString() });
        }
        
        cargarTodo(); setModalCobroMultiple(null); 
        setModalAlerta({ titulo: "¡Pago Procesado!", mensaje: `Se registró un total de $${montoTotal.toLocaleString()}`, tipo: "exito" });
    };

    const borrarPago = async (id: number) => {
        setModalInteractivo({
            abierto: true, tipo: 'peligro', titulo: 'Eliminar Recibo', mensaje: '¿Eliminar este recibo permanente?',
            accionConfirmar: async () => {
                await supabase.from("pagos").delete().eq('id', id); 
                setTimeout(() => {
                    setModalInteractivo({
                        abierto: true, tipo: 'confirmacion', titulo: 'Ajuste de Vencimiento', mensaje: '¿Revertir también el mes de la alumna? (-30 días). Solo aplica si el recibo era de mensualidad.',
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

    const enviarRecordatorioMora = (gimnastaPrincipal: any, moraPrincipal: any) => {
        let numeroLimpio = gimnastaPrincipal.telefono_acudiente?.replace(/\D/g, '') || "";
        if (numeroLimpio.length === 10) numeroLimpio = '57' + numeroLimpio;
        if (!numeroLimpio) return alert("La alumna no tiene teléfono registrado.");

        let mensajeFinal = "";
        if (gimnastaPrincipal.grupo_familiar) {
            const hermanas = estudiantes.filter((e: any) => e.grupo_familiar?.toLowerCase() === gimnastaPrincipal.grupo_familiar.toLowerCase());
            let totalDeuda = 0; let desgloseTextos: string[] = []; let mesesPendientesSet = new Set<string>();
            hermanas.forEach((h: any) => {
                const moraH = calcularMora(h);
                if (moraH.meses > 0) {
                    totalDeuda += moraH.deudaTotal; moraH.nombres.forEach((m: string) => mesesPendientesSet.add(m));
                    const precioMensual = h.es_hermana ? ((h.paquetes?.precio || 0) / 2) : (h.paquetes?.precio || 0);
                    desgloseTextos.push(`$${(moraH.meses * precioMensual).toLocaleString()} para ${h.nombre}${h.es_hermana ? ' con 50% de descuento' : ''}`);
                }
            });
            if (totalDeuda === 0) return alert("Este grupo familiar está al día.");
            mensajeFinal = `¡Hola! Un saludo especial de Elite Gymnastics.\n\nCompartimos la información de las ${gimnastaPrincipal.grupo_familiar}, tienen pendiente el pago de la mensualidad del mes de ${Array.from(mesesPendientesSet).join(", ")} por un valor de $${totalDeuda.toLocaleString()}. Divididos en ${desgloseTextos.join(" y ")}.\n\nQuedamos atentos a cualquier inquietud.`;
        } else {
            if (moraPrincipal.meses === 0) return alert("La alumna está al día.");
            mensajeFinal = `Hola! Un saludo especial de Elite Gymnastics.\n\nCompartimos la información de que ${gimnastaPrincipal.nombre.toUpperCase()} hasta la fecha presenta un saldo pendiente de $${moraPrincipal.deudaTotal.toLocaleString()} correspondiente a los meses de: ${moraPrincipal.nombres.join(", ")}.\n\nQuedamos atentos a cualquier inquietud.`;
        }
        window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensajeFinal)}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[100] backdrop-blur-2xl animate-in fade-in duration-300 text-left">
            <div className="bg-zinc-900 w-full max-w-md rounded-[3rem] p-10 border border-white/10 relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto custom-scrollbar">
                <img src="/logob.png" className="absolute -top-10 -right-10 w-48 h-48 opacity-[0.03] pointer-events-none rotate-12" />
                <button onClick={() => setPerfilSeleccionado(null)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-all hover:rotate-90 duration-300 bg-white/5 p-2 rounded-full"><X size={20}/></button>
                
                {!modoEdicionPerfil ? (
                    <>
                        <div className="flex items-center gap-5 mb-8 mt-2">
                            <div className="w-16 h-16 rounded-full bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shadow-inner overflow-hidden">
                                {perfilSeleccionado.foto_url ? <img src={perfilSeleccionado.foto_url} alt="Perfil" className="w-full h-full object-cover" /> : <User size={28}/>}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">{perfilSeleccionado.nombre}</h2>
                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em] flex items-center gap-1 mt-1"><Briefcase size={10} className="text-cyan-500"/> {perfilSeleccionado.profesor}</p>
                                {perfilSeleccionado.grupo_familiar && <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mt-1 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 inline-block">{perfilSeleccionado.grupo_familiar}</p>}
                            </div>
                        </div>
                        <button onClick={() => setModoEdicionPerfil(true)} className="w-full text-[9px] bg-white/5 hover:bg-white/10 py-3 rounded-xl uppercase font-black text-zinc-400 mb-8 transition-colors flex items-center justify-center gap-2"><Edit size={12}/> Modificar Ficha Técnica</button>
                    </>
                ) : (
                    <div className="mb-8 space-y-4 animate-in fade-in">
                        <h2 className="text-lg font-black uppercase tracking-widest mb-6 text-cyan-400 border-b border-white/5 pb-4"><Edit size={16} className="inline mr-2 -mt-1"/> Edición de Perfil</h2>
                        <div className="flex flex-col items-center justify-center mb-6">
                            <label className="cursor-pointer relative group">
                                <div className={`w-20 h-20 rounded-full border-2 border-dashed ${editFotoPreview ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-zinc-600'} flex items-center justify-center overflow-hidden bg-zinc-900/50 group-hover:bg-zinc-800 transition-all`}>
                                    {editFotoPreview ? <img src={editFotoPreview} alt="Preview" className="w-full h-full object-cover" /> : <Camera size={24} className="text-zinc-500 group-hover:text-cyan-400" />}
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) { setEditFoto(e.target.files[0]); setEditFotoPreview(URL.createObjectURL(e.target.files[0])); }
                                }} />
                            </label>
                            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mt-2">Cambiar Foto</p>
                        </div>
                        
                        <InputStyled label="Nombre" value={editNombre} onChange={(e: any) => setEditNombre(e.target.value)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <InputStyled label="Teléfono" value={editTelefono} onChange={(e: any) => setEditTelefono(e.target.value)} /> 
                            <InputStyled label="Fecha de Nacimiento" type="date" value={editFechaNacimiento} onChange={(e: any) => setEditFechaNacimiento(e.target.value)} />
                        </div>
                        
                        <div className="flex items-center gap-3 bg-zinc-950/50 p-4 rounded-xl border border-white/5 mb-2 mt-4">
                            <input type="checkbox" id="editEsHermana" checked={editEsHermana} onChange={(e) => setEditEsHermana(e.target.checked)} className="w-5 h-5 accent-cyan-500 cursor-pointer rounded-sm" />
                            <label htmlFor="editEsHermana" className="text-[10px] font-black text-cyan-400 uppercase tracking-widest cursor-pointer">Activar Descuento 50% (Solo para 2da hermana)</label>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-end mb-1">
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Grupo Familiar</label>
                                {gruposExistentes.length > 0 && (
                                    <select className="bg-zinc-900 border border-cyan-500/30 text-cyan-400 text-[9px] font-black uppercase rounded-lg px-2 py-1 outline-none cursor-pointer" onChange={(e) => { if(e.target.value) setEditGrupoFamiliar(e.target.value); }} value=""><option value="">+ Elegir Existente...</option>{gruposExistentes.map((g: any) => <option key={g} value={g}>{g}</option>)}</select>
                                )}
                            </div>
                            <input type="text" value={editGrupoFamiliar} onChange={e => setEditGrupoFamiliar(e.target.value)} className="w-full bg-zinc-950/50 border border-cyan-500/30 text-cyan-400 text-xs uppercase font-bold px-4 py-3 rounded-xl outline-none focus:border-cyan-400" placeholder="Escribe uno nuevo o elige de la lista 👆" />
                        </div>
                        
                        <InputStyled label="Clave Portal" value={editClave} onChange={(e: any) => setEditClave(e.target.value)} />
                        <InputStyled label="Fecha de Corte" type="date" value={editVencimiento} onChange={(e: any) => setEditVencimiento(e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-left"><label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-2 tracking-widest">Plan</label><select className="bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-[10px] font-black uppercase" value={editPaquete} onChange={(e: any) => setEditPaquete(e.target.value)}>{paquetes.map((p:any) => <option key={p.id} value={p.id} className="bg-zinc-900">{p.nombre}</option>)}</select></div>
                            <div className="text-left"><label className="text-[9px] font-black text-zinc-500 uppercase ml-1 block mb-2 tracking-widest">Profesor</label><select className="bg-zinc-950 p-4 rounded-xl border border-white/10 outline-none text-white w-full text-[10px] font-black uppercase" value={editProfesor} onChange={(e: any) => setEditProfesor(e.target.value)}>{listaProfesores.map((p:any) => <option key={p.id} value={p.nombre} className="bg-zinc-900">{p.nombre}</option>)}</select></div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setModoEdicionPerfil(false)} className="flex-1 py-4 bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors">Cancelar</button>
                            <button onClick={guardarCambiosPerfil} className="flex-1 py-4 bg-cyan-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">Guardar Cambios</button>
                        </div>
                    </div>
                )}
                
                {!modoEdicionPerfil && (
                    <>
                        <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5 shadow-inner">
                            <button onClick={() => setTabPerfil('finanzas')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${tabPerfil === 'finanzas' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 shadow-lg' : 'text-zinc-600 hover:text-white'}`}><DollarSign size={14}/> Finanzas</button>
                            <button onClick={() => setTabPerfil('asistencia')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${tabPerfil === 'asistencia' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500/30 shadow-lg' : 'text-zinc-600 hover:text-white'}`}><CalendarCheck size={14}/> Asistencia</button>
                        </div>

                        <div className="max-h-[380px] pr-2 text-left">
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
                                        {pagos.filter((p:any) => p.gimnasta_id === perfilSeleccionado.id).map((p:any) => (
                                            <div key={p.id} className="flex justify-between p-5 bg-black/20 rounded-2xl border border-white/5 items-center group hover:bg-white/5 transition-colors">
                                                <div className="text-left"><p className="text-[10px] font-black text-cyan-400 uppercase tracking-wider mb-1">{p.concepto}</p><p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(p.created_at).toLocaleDateString()}</p><p className="text-emerald-400 font-black text-sm mt-1 tracking-tight">$ {p.monto.toLocaleString()}</p></div>
                                                <div className="flex gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => borrarPago(p.id)} className="p-3 bg-zinc-800 rounded-xl hover:bg-red-600 text-zinc-400 hover:text-white transition-colors shadow-lg"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => eliminarGimnasta(perfilSeleccionado.id)} className="w-full py-5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] transition-all mt-8"><Trash2 size={14} className="inline mr-2 -mt-1"/> Destruir Ficha Técnica</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3 text-left">
                                    {todasAsistencias.filter((a:any) => a.gimnasta_id === perfilSeleccionado.id).map((a:any) => (
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

                {/* MODAL COBRO MULTIPLE (MENSUALIDAD + INSCRIPCION) */}
                {modalCobroMultiple && (
                    <div className="absolute inset-0 bg-zinc-900 z-50 p-6 md:p-8 flex flex-col justify-center animate-in slide-in-from-bottom-10 rounded-[3rem]">
                        <button onClick={() => setModalCobroMultiple(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-all hover:rotate-90 duration-300 bg-white/5 p-2 rounded-full"><X size={16}/></button>
                        <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-1"><DollarSign size={20} className="inline mr-1 text-emerald-400"/> Caja de Recaudo</h3>
                        
                        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 mt-4">
                            <div>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">{modalCobroMultiple.gimnasta.nombre}</p>
                                <p className="text-xs font-black text-white uppercase mt-1 flex items-center gap-2">Estado: {modalCobroMultiple.mora.meses > 0 ? <span className="text-red-400">{modalCobroMultiple.mora.meses} meses en mora</span> : <span className="text-emerald-400">Al día</span>}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Deuda Total (Plan)</p>
                                <p className="text-lg font-black text-red-400">${modalCobroMultiple.mora.deudaTotal.toLocaleString()}</p>
                            </div>
                        </div>

                        <p className="text-[8px] text-zinc-400 font-black uppercase tracking-[0.3em] mb-2">Autocompletar Meses</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {Array.from({ length: Math.max(0, modalCobroMultiple.mora.meses - 1) }).map((_, i) => {
                                const mesesAbono = i + 1;
                                return (
                                    <button 
                                        key={mesesAbono}
                                        onClick={() => setModalCobroMultiple({...modalCobroMultiple, montoMensualidad: (modalCobroMultiple.mora.precioIndividual * mesesAbono).toString()})} 
                                        className="flex-1 min-w-[70px] bg-zinc-800 hover:bg-emerald-900/40 hover:text-emerald-400 hover:border-emerald-500/30 text-zinc-300 border border-white/5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                                    >
                                        {mesesAbono} {mesesAbono === 1 ? 'Mes' : 'Meses'}
                                    </button>
                                );
                            })}
                            <button 
                                onClick={() => setModalCobroMultiple({...modalCobroMultiple, montoMensualidad: modalCobroMultiple.mora.deudaTotal > 0 ? modalCobroMultiple.mora.deudaTotal.toString() : modalCobroMultiple.mora.precioIndividual.toString()})} 
                                className="flex-[2] min-w-[100px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                                {modalCobroMultiple.mora.meses <= 0 ? "Cobrar 1 Mes" : "Saldar Toda la Deuda"}
                            </button>
                        </div>
                        
                        <div className="bg-black/30 rounded-[2rem] p-5 border border-white/5 mb-6 shadow-inner relative text-left">
                            
                            {/* CAMPO 1: MENSUALIDAD */}
                            <div className="mb-4">
                                <label className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] mb-2 block">Abono a Mensualidad / Plan</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-emerald-500/50">$</span>
                                    <input 
                                        type="number" 
                                        value={modalCobroMultiple.montoMensualidad} 
                                        onChange={(e) => setModalCobroMultiple({...modalCobroMultiple, montoMensualidad: e.target.value})} 
                                        className="w-full bg-zinc-950 border border-emerald-500/20 text-emerald-400 text-xl font-black rounded-xl py-3 pl-10 pr-4 text-right outline-none focus:border-emerald-400 transition-all shadow-inner" 
                                        autoFocus 
                                    />
                                </div>
                            </div>

                            {/* CAMPO 2: INSCRIPCION */}
                            <div className="mb-2">
                                <label className="text-[9px] text-cyan-400 font-black uppercase tracking-[0.3em] mb-2 block flex items-center gap-1"><Plus size={10}/> Pago de Inscripción / Matrícula</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-cyan-500/50">$</span>
                                    <input 
                                        type="number" 
                                        value={modalCobroMultiple.montoInscripcion} 
                                        onChange={(e) => setModalCobroMultiple({...modalCobroMultiple, montoInscripcion: e.target.value})} 
                                        className="w-full bg-zinc-950 border border-cyan-500/20 text-cyan-400 text-xl font-black rounded-xl py-3 pl-10 pr-4 text-right outline-none focus:border-cyan-400 transition-all shadow-inner" 
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-[8px] uppercase font-black tracking-widest text-zinc-500 mt-2 text-right">Deja en 0 si ya fue pagada.</p>
                            </div>

                            <div className="border-t border-white/10 pt-4 mt-2 flex justify-between items-center">
                                <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">Total a Recibir:</span>
                                <span className="text-2xl font-black text-white">
                                    ${((Number(modalCobroMultiple.montoMensualidad) || 0) + (Number(modalCobroMultiple.montoInscripcion) || 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <button onClick={procesarPago} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_30px_rgba(34,197,94,0.3)] active:scale-95 transition-all flex justify-center items-center gap-2"><Check size={16}/> APROBAR Y ENVIAR RECIBO</button>
                    </div>
                )}
            </div>
        </div>
    );
}