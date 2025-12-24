import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    template: '%s | Further Corporate',
    default: 'Systems Health Check | Further Corporate', // Título por defecto
  },
  description: 'Panel de control centralizado para validación de integraciones (OpenAI, Resend, n8n) y estado de servicios del ecosistema Further.',
  generator: 'Next.js',
  applicationName: 'Further QA Dashboard',
  authors: [{ name: 'Further Development Team' }],
  
  // 🚫 IMPORTANTE: Esto evita que Google indexe tu panel de pruebas
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },

  // Iconos (puedes usar la URL de tu bot si no tienes favicon aún)
  icons: {
    icon: 'https://i.imgur.com/EbnS3w8.png', // Usamos el avatar del bot temporalmente
    shortcut: 'https://i.imgur.com/EbnS3w8.png',
    apple: 'https://i.imgur.com/EbnS3w8.png',
  },

  // Open Graph (Para cuando compartas el link por Slack/Teams/WhatsApp)
  openGraph: {
    title: 'Further Corporate | Systems Health Check',
    description: 'Dashboard de estado operativo de Campus, Web y Academy.',
    siteName: 'Further Corporate Internal',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: 'https://i.imgur.com/EbnS3w8.png', // Avatar del bot
        width: 800,
        height: 600,
        alt: 'Further Corporate Dashboard',
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
