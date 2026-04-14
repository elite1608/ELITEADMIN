import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#09090b", // Color de la barra en Android
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Evita zoom accidental al escribir, típico de apps
};

export const metadata: Metadata = {
  title: "Elite Gymnastics Barranquilla",
  description: "Portal digital oficial para familias y dirección deportiva.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logob.png",
    shortcut: "/logob.png",
    apple: "/logob.png", // El que busca Safari para el icono del escritorio
  },
  // 🟢 Configuración de vista previa para WhatsApp/Redes Sociales
  openGraph: {
    title: "Elite Gymnastics - Portal Oficial",
    description: "Consulta asistencias, pagos y resultados USAG de nuestras gimnastas.",
    url: "https://elite-gymnastics-app.vercel.app", // Tu link real ya actualizado
    siteName: "Elite Gymnastics",
    images: [
      {
        url: "/logob.png", 
        width: 512,
        height: 512,
        alt: "Logo Elite Gymnastics Barranquilla",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  // 📱 Configuración para que parezca App nativa en iPhone (iOS)
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Elite Gym",
    startupImage: "/logob.png",
  },
  // Otras etiquetas de compatibilidad
  other: {
    "mobile-web-app-capable": "yes", // Para navegadores antiguos de Android
    "apple-mobile-web-app-title": "Elite Gym",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Esto fuerza a que en móviles no se pueda hacer zoom "pellizcando" la pantalla, para que se sienta como app */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}