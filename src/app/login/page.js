'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Firestore
import { auth, db } from "@/lib/firebase"; 
import { verify2FA, generateQR } from "@/actions/auth-actions"; 
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  
  // Estados
  const [step, setStep] = useState(1); // 1: Credenciales, 2: 2FA
  const [isFirstTime, setIsFirstTime] = useState(false); // ¿Es usuario nuevo en 2FA?
  const [qrUrl, setQrUrl] = useState(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // PASO 1: Login + Chequeo de Seguridad en Base de Datos
  const handleFirebaseLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Logueamos en Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Consultamos Firestore: ¿Este usuario ya configuró 2FA?
      // Buscamos en la colección '2fa_users' el documento con el ID del usuario
      const docRef = doc(db, "2fa_users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().enabled) {
        // YA TIENE 2FA: No mostramos QR, vamos directo a pedir código
        setIsFirstTime(false);
      } else {
        // NO TIENE 2FA: Generamos el QR para configuración inicial
        setIsFirstTime(true);
        const res = await generateQR(); // Server Action
        if (res.success) {
            setQrUrl(res.imageUrl);
        } else {
            throw new Error("Error generando seguridad.");
        }
      }

      setLoading(false);
      setStep(2);

    } catch (err) {
      setLoading(false);
      setError("Credenciales inválidas o error de conexión.");
      console.error(err);
    }
  };

  // PASO 2: Validar Código + Guardar estado si es nuevo
  const handle2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // 1. Validamos el código en el servidor (Next.js)
    const res = await verify2FA(code);

    if (res.success) {
        // Si era la primera vez, AHORA guardamos en base de datos que ya lo tiene.
        // Así la próxima vez no le mostrará el QR a nadie.
        if (isFirstTime && auth.currentUser) {
            try {
                await setDoc(doc(db, "2fa_users", auth.currentUser.uid), {
                    email: auth.currentUser.email,
                    enabled: true,
                    setupAt: new Date().toISOString()
                });
            } catch (err) {
                console.error("Error guardando estado 2FA", err);
                // No bloqueamos el login, pero logueamos el error
            }
        }

        router.push('/'); 
    } else {
        setError(res.message || "Código incorrecto.");
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C212D] text-slate-200 p-4">
      <div className="w-full max-w-md bg-[#112C3E] border border-white/10 rounded-3xl p-8 shadow-2xl relative">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-12 w-12 bg-[#EE7203] rounded-xl mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4">
            F
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Further Secure Access</h1>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center mb-4">
              {error}
            </div>
        )}

        {/* PASO 1: LOGIN */}
        {step === 1 && (
            <form onSubmit={handleFirebaseLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 ml-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0C212D] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#EE7203] focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0C212D] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#EE7203] focus:border-transparent transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 mt-2
                  ${loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-white text-[#0C212D] hover:bg-[#EE7203] hover:text-white'}
                `}
              >
                {loading ? "Verificando..." : "Continuar"}
              </button>
            </form>
        )}

        {/* PASO 2: TOTP */}
        {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               
               {/* CASO: CONFIGURACIÓN INICIAL (Solo se ve 1 vez en la vida) */}
               {isFirstTime && qrUrl && (
                   <div className="flex flex-col items-center gap-3 mb-6 p-4 bg-white rounded-xl text-slate-800 animate-in zoom-in duration-300 border-l-4 border-[#EE7203]">
                       <p className="text-xs font-bold text-[#EE7203] uppercase tracking-wide">Configuración Requerida</p>
                       <p className="text-xs text-center text-slate-600">
                           Esta cuenta no tiene 2FA. Escanea este código ahora. <br/>
                           <span className="font-bold">No volverás a ver este código.</span>
                       </p>
                       <img src={qrUrl} alt="QR Code" className="w-32 h-32" />
                   </div>
               )}

               {/* CASO: YA CONFIGURADO (Lo normal) */}
               {!isFirstTime && (
                   <div className="text-center mb-6">
                       <p className="text-sm text-slate-300">Ingresa el código de tu Authenticator.</p>
                   </div>
               )}

               <form onSubmit={handle2FA} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full bg-[#0C212D] border border-white/10 rounded-xl px-4 py-4 text-white tracking-[0.8em] text-center font-mono text-xl focus:outline-none focus:ring-2 focus:ring-[#EE7203] focus:border-transparent transition-all"
                      placeholder="000 000"
                      inputMode="numeric"
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200
                      ${loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-white text-[#0C212D] hover:bg-[#EE7203] hover:text-white'}
                    `}
                  >
                    {loading ? "Validando..." : isFirstTime ? "Activar Seguridad y Entrar" : "Ingresar"}
                  </button>
               </form>
            </div>
        )}

      </div>
    </div>
  );
}