// app/utils/whatsapp.ts

// 🧹 Limpiador de números a prueba de fallos
const limpiarNumero = (telefono: any) => {
  if (!telefono) return "";
  let limpio = String(telefono).replace(/\D/g, ''); 
  if (limpio.length === 10) { limpio = '57' + limpio; }
  return limpio;
};

// 1. MENSAJE DE ASISTENCIA
export const enviarNotificacionAsistencia = (alumna: any) => {
  if (!alumna.telefono_acudiente) return alert("Esta alumna no tiene teléfono registrado.");
  const numeroLimpio = limpiarNumero(alumna.telefono_acudiente);
  
  const mensaje = `*Elite Gymnastics Barranquilla* 🤸‍♀️
  
¡Hola! Te informamos que *${alumna.nombre}* acaba de ingresar a su clase de gimnasia hoy. ¡Ya está lista para entrenar! 💪`;

  const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
};

// 2. MENSAJE DE PAGO EXITOSO (RECIBO) ✅ -> ESTE ES EL QUE DEBE DECIR "CONFIRMADO"
export const enviarReciboPago = (alumna: any, monto: string | number, mes: string) => {
  if (!alumna.telefono_acudiente) return alert("Esta alumna no tiene teléfono registrado.");
  const numeroLimpio = limpiarNumero(alumna.telefono_acudiente);

  const mensaje = `*Elite Gymnastics Barranquilla* 
  
¡Hola! Esperamos que estés teniendo un excelente día. 

Queremos confirmarte que hemos recibido con éxito el pago de la mensualidad de *${alumna.nombre}*, correspondiente al mes de *${mes}*, por un valor de *$${monto}*. 

¡Muchísimas gracias por tu puntualidad y por confiar en nosotros! Nos alegra muchísimo seguir acompañando sus avances y verla disfrutar en cada entrenamiento.`;

  const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
};

// 3. MENSAJE DE RECORDATORIO (INICIO DE MES)
export const enviarRecordatorioPago = (alumna: any) => {
  if (!alumna.telefono_acudiente) return alert("Esta alumna no tiene teléfono registrado.");
  const numeroLimpio = limpiarNumero(alumna.telefono_acudiente);

  const mensaje = `*Elite Gymnastics Barranquilla* 📣
  
¡Hola! Te recordamos que ya inició el nuevo periodo de clases. Puedes revisar el estado de cuenta de *${alumna.nombre}* y realizar el pago a través de nuestro portal oficial: 

https://elite-gymnastics.vercel.app/padres 
  
¡Te esperamos! 🤸‍♀️`;

  const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
};