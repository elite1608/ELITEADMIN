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
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Elite Gymnastics",
  description: "Portal digital para familias y dirección deportiva.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-color.png",
    apple: "/icon-color.png",
  },
  // 🟢 Esto es lo que configura la vista previa en WhatsApp
  openGraph: {
    title: "Elite Gymnastics - Portal Oficial",
    description: "Gestión de asistencia y estados de cuenta para nuestras gimnastas.",
    url: "https://tu-enlace.vercel.app", // <- Cambia esto por tu link real de Vercel
    siteName: "Elite Gymnastics",
    images: [
      {
        url: "/icon-color.png", // Usamos el logo a color
        width: 800,
        height: 600,
        alt: "Logo Elite Gymnastics",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  // Esto es para que en iPhone se vea como app nativa
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Elite Gym",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}