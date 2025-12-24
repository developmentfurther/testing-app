'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { logoutAction } from "@/actions/auth-actions";

// --- IMPORTAMOS TUS FUNCIONES (SERVER ACTIONS) ---
import { testCampusChat } from '@/lib/test-campus-chat';
import { testWebChatbot } from '@/lib/test-web-chatbot';
import { testResendEmail } from '@/lib/test-web-email';
import { testAcademyChat } from '@/lib/test-academy-chat';
import { testExamsEvaluate } from '@/lib/test-exams-evaluate';
import { testWhatsappExtraction } from '@/lib/test-whatsapp-extraction';

// --- CONFIGURACIÓN DE LA UI ---
const COLORS = {
  primary: "bg-[#0C212D]", // Azul Oscuro Further
  accent: "bg-[#EE7203]",  // Naranja Further
  success: "text-emerald-600 bg-emerald-50 border-emerald-200",
  error: "text-red-600 bg-red-50 border-red-200",
  neutral: "text-slate-600 bg-slate-50 border-slate-200",
};

export default function Dashboard() {
  const [results, setResults] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const router = useRouter()

  // --- LÓGICA DE LOGOUT ---
  const handleLogout = async () => {
    // 1. Cerramos sesión en Firebase (Limpia el cliente)
    await signOut(auth);
    
    // 2. Cerramos sesión en el Servidor (Borra la cookie 2FA)
    await logoutAction();
    
    // 3. Nos vamos al login
    router.push('/login');
    router.refresh(); // Asegura que se limpie cualquier caché de ruta
  };

  // Definición de las tarjetas de prueba
  const TESTS = [
    {
      id: 'campus',
      title: 'Campus Tutor AI',
      description: 'Valida conexión con OpenAI, Streaming y System Prompt del Campus.',
      icon: <IconBrain />,
      fn: testCampusChat
    },
    {
      id: 'web-bot',
      title: 'Web Assistant (Mr. Further)',
      description: 'Valida Knowledge Base institucional y respuestas sobre sedes.',
      icon: <IconBot />,
      fn: testWebChatbot
    },
    {
      id: 'email',
      title: 'Email Transaccional',
      description: 'Envía un correo real vía Resend API al mail de desarrollo.',
      icon: <IconMail />,
      fn: testResendEmail
    },
    {
      id: 'academy',
      title: 'Academy Integration',
      description: 'Prueba el Webhook de n8n y la lógica de respuesta JSON/HTML.',
      icon: <IconSchool />,
      fn: testAcademyChat
    },
    {
      id: 'exams',
      title: 'Exams Grading Engine',
      description: 'Simula corrección de Writing + Listening con Rúbricas complejas.',
      icon: <IconChecklist />,
      fn: testExamsEvaluate
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Data Extraction',
      description: 'Analiza historial de chat y extrae JSON estructurado (B2B/B2C).',
      icon: <IconWhatsapp />,
      fn: testWhatsappExtraction
    },
  ];

  const runTest = async (test) => {
    setLoadingId(test.id);
    // Limpiamos resultado previo
    setResults((prev) => ({ ...prev, [test.id]: null }));

    try {
      const start = Date.now();
      const response = await test.fn();
      const duration = Date.now() - start;

      setResults((prev) => ({
        ...prev,
        [test.id]: { ...response, duration } // Guardamos respuesta + tiempo
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [test.id]: { success: false, message: "Error crítico en cliente: " + error.message }
      }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* HEADER CORPORATIVO */}
      <header className={`${COLORS.primary} text-white py-6 shadow-lg`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Logo Simulado */}
            <div className={`h-10 w-10 rounded-lg ${COLORS.accent} flex items-center justify-center font-bold text-xl`}>
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Further Corporate</h1>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                Centralized Testing Environment
              </p>
            </div>
          </div>
          
          {/* Lado Derecho: Estado y Logout */}
          <div className="flex items-center gap-6">
            
            {/* Indicador de Estado */}
            <div className="hidden md:flex items-center gap-2 text-xs bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-200">System Operational</span>
            </div>

            {/* BOTÓN DE LOGOUT */}
            <button 
              onClick={handleLogout}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <span>Cerrar Sesión</span>
              <svg 
                className="w-4 h-4 text-slate-500 group-hover:text-[#EE7203] transition-colors" 
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

          </div>
        
        </div>
      </header>

      {/* GRID DE TARJETAS */}
      <main className="max-w-7xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTS.map((test) => {
            const result = results[test.id];
            const isLoading = loadingId === test.id;
            
            return (
              <div 
                key={test.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
              >
                {/* Card Header */}
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-slate-100 text-slate-700`}>
                      {test.icon}
                    </div>
                    {result && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${result.success ? COLORS.success : COLORS.error}`}>
                        {result.success ? 'PASSED' : 'FAILED'}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{test.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{test.description}</p>
                </div>

                {/* Result Area (Collapsible) */}
                {result && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 text-xs">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-slate-700">Resultado:</span>
                      <span className="text-slate-400">{result.duration}ms</span>
                    </div>
                    <p className={`mb-2 font-medium ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                      {result.message}
                    </p>
                    
                    {/* JSON Viewer Simple */}
                    <details className="group">
                      <summary className="cursor-pointer text-slate-400 hover:text-[#EE7203] transition-colors list-none flex items-center gap-1 font-medium select-none">
                        <span className="group-open:rotate-90 transition-transform">›</span> Ver JSON Técnico
                      </summary>
                      <pre className="mt-2 p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto font-mono leading-tight">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

                {/* Card Footer / Action */}
                <div className="p-4 border-t border-slate-100 bg-white">
                  <button
                    onClick={() => runTest(test)}
                    disabled={loadingId !== null}
                    className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2
                      ${isLoading 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-slate-900 text-white hover:bg-[#EE7203] hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]'
                      }
                    `}
                  >
                    {isLoading ? (
                      <>
                        <IconLoader className="animate-spin h-4 w-4" /> Ejecutando...
                      </>
                    ) : (
                      <>Ejecutar Test</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-20 text-center text-slate-400 text-xs pb-10">
        <p>© {new Date().getFullYear()} Further Corporate - Internal Testing Tool.</p>
        <p className="mt-1 opacity-60">Powered by Next.js 16 & OpenAI GPT-5o Mini</p>
      </footer>
    </div>
  );
}

// --- ICONOS SVG SIMPLES (Para no instalar librerías extra) ---

function IconBrain(props) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
}

function IconBot(props) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x1="16" x2="16" y1="16" y2="16"/></svg>
}

function IconMail(props) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
}

function IconSchool(props) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg>
}

function IconChecklist(props) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m9 7 1 1 2-2"/><rect x="14" y="5" width="7" height="2" rx="1"/><rect x="14" y="9" width="7" height="2" rx="1"/><rect x="3" y="14" width="6" height="6" rx="1"/><path d="m9 16 1 1 2-2"/><rect x="14" y="14" width="7" height="2" rx="1"/><rect x="14" y="18" width="7" height="2" rx="1"/></svg>
}

function IconWhatsapp(props) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/><path d="M8 12a2 2 0 1 0 4 0"/></svg>
}

function IconLoader(props) {
    return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
}