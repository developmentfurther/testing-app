'use server'

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { cookies } from 'next/headers';

// Configuración de cookies
const SESSION_COOKIE_NAME = 'further-admin-session';

export async function verify2FA(token) {
  const secret = process.env.ADMIN_TOTP_SECRET;
  
  if (!secret) return { success: false, message: "Falta configurar ADMIN_TOTP_SECRET" };

  try {
    // 1. Verificar el token contra el secreto
    const isValid = authenticator.check(token, secret);

    if (!isValid) {
      return { success: false, message: "Código incorrecto o expirado." };
    }

    // 2. Si es válido, seteamos una cookie HTTP-Only para indicar que pasó el 2FA
    // Esto es lo que protege al dashboard realmente.
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, 'verified', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 24 horas
        path: '/',
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: "Error verificando token." };
  }
}

// Acción para generar el QR la primera vez (Solo para que lo escanees tú)
export async function generateQR() {
    const secret = process.env.ADMIN_TOTP_SECRET;
    const user = "Admin@Further";
    const service = "FurtherCorporate";
    
    // Formato estándar otpauth
    const otpauth = authenticator.keyuri(user, service, secret);
    
    try {
        const imageUrl = await QRCode.toDataURL(otpauth);
        return { success: true, imageUrl };
    } catch (err) {
        return { success: false, message: "Error generando QR" };
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { success: true };
}
