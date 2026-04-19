"use client";
import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Briefcase, UserPlus, User, Key, Trash2 } from "lucide-react";

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

export default function StaffModulo({ listaProfesores, setModalAlerta, setModalInteractivo, cargarTodo }: any) {
    const [nuevoProfeNombre, setNuevoProfeNombre] = useState("");
    const [nuevoProfePin, setNuevoProfePin] = useState("1234");

    const agregarProfesor = async () => {
        if (!nuevoProfeNombre) return setModalAlerta({ titulo: "Faltan Datos", mensaje: "Escribe un nombre para el nuevo profesor.", tipo: "error" });
        setModalInteractivo({
            abierto: true, tipo: 'confirmacion', titulo: 'Confirmar Contratación', mensaje: `¿Estás seguro de que quieres contratar a ${nuevoProfeNombre}?`,
            accionConfirmar: async () => {
                const { error } = await supabase.from("profesores").insert([{ nombre: nuevoProfeNombre, activo: true, pin_acceso: nuevoProfePin, requiere_cambio_pin: true }]);
                if (error) setModalAlerta({ titulo: "Error", mensaje: "Hubo un problema al agregar el profesor.", tipo: "error" });
                else { setModalAlerta({ titulo: "¡Contratación Exitosa!", mensaje: "El profesor ha sido agregado.", tipo: "exito" }); setNuevoProfeNombre(""); cargarTodo(); }
            }
        });
    };

    const restablecerPinProfesor = (id: number, nombre: string) => {
        setModalInteractivo({
            abierto: true, tipo: 'prompt', titulo: 'Restablecer PIN', mensaje: `Escribe la nueva contraseña temporal para ${nombre}:`, placeholder: 'Ej: 1234',
            accionConfirmar: async (val: string) => {
                if (!val) return setModalAlerta({ titulo: "Error", mensaje: "No ingresaste un PIN.", tipo: "error" });
                const { error } = await supabase.from("profesores").update({ pin_acceso: val, requiere_cambio_pin: true }).eq('id', id);
                if (error) setModalAlerta({ titulo: "Error", mensaje: "Hubo un error de conexión.", tipo: "error" });
                else { setModalAlerta({ titulo: "PIN Actualizado", mensaje: `El profesor debe cambiar la clave al entrar.`, tipo: "exito" }); cargarTodo(); }
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

    return (
        <div className="max-w-2xl mx-auto bg-zinc-900/60 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
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

            <div className="mt-8 text-left">
                <p className="text-[9px] font-black text-cyan-500 uppercase mb-4 ml-2 tracking-[0.2em]">Nómina Activa ({listaProfesores.length})</p>
                <div className="space-y-3">
                    {listaProfesores.map((p:any) => (
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
    );
}