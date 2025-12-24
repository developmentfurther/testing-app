'use server'

import { Resend } from "resend";

// --- CONFIGURACIÓN ---
const resend = new Resend(process.env.API_RESEND);

// El mail de destino para las pruebas
const MAIL_RECEIVER_TEST = process.env.EMAIL_RECEIVER_TEST; 

// --- DATOS HARDCODEADOS ---
const TEST_DATA = {
  name: "Bot de Prueba",
  email: "test-bot@further.test",
  company: "Further Test App",
  phone: "123-456-789",
  message: "Esta es una prueba automática de conectividad con RESEND. Si lees esto, la API Key funciona.",
  origin: "Panel de Control de Tests"
};

export async function testResendEmail() {
  console.log("🔵 Iniciando Test de Envío de Correo (Resend)...");

  if (!process.env.API_RESEND) {
    return { success: false, message: "❌ Falta API_RESEND en .env" };
  }

  try {
    const result = await resend.emails.send({
      from: "Further Contact <onboarding@resend.dev>", // 👈 USO ESTE POR SI ACASO (si tu dominio no está verificado)
      // from: "Further Contact <no-reply@further.com>", // Usa este si ya tienes el dominio verificado
      
      // 🔴 CORRECCIÓN AQUÍ: Quitamos los corchetes []
      to: MAIL_RECEIVER_TEST, 
      
      replyTo: TEST_DATA.email,
      subject: `[TEST] Nuevo mensaje desde ${TEST_DATA.origin}`,
      html: `
        <div style="font-family:Arial,sans-serif; border: 2px dashed orange; padding: 20px;">
          <h2 style="color: orange;">⚠️ ESTO ES UN TEST ⚠️</h2>
          <h3>Mensaje desde ${TEST_DATA.origin}</h3>
          <p><strong>Nombre:</strong> ${TEST_DATA.name}</p>
          <p><strong>Email simulado:</strong> ${TEST_DATA.email}</p>
          <p><strong>Compañía:</strong> ${TEST_DATA.company}</p>
          <p><strong>Mensaje:</strong></p>
          <p style="background: #eee; padding: 10px;">${TEST_DATA.message}</p>
          <hr/>
          <p>Fecha: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    if (result.error) {
        // Esto captura el error que viste y lo devuelve limpio al front
        return { 
            success: false, 
            message: "Error de Resend: " + result.error.message 
        };
    }

    return { 
      success: true, 
      message: `✅ Mail enviado correctamente. ID: ${result.data?.id}`,
      detail: `Revisa la bandeja de ${MAIL_RECEIVER_TEST}`
    };

  } catch (error) {
    console.error("❌ Error enviando mail:", error);
    return { 
      success: false, 
      message: "Falló el envío de mail: " + error.message 
    };
  }
}