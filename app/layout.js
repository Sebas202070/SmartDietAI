import './globals.css' // Ruta correcta a tus estilos globales
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth" // Asegúrate de que la ruta sea correcta
import SessionWrapper from "@/components/SessionWrapper" // Asegúrate de que la ruta sea correcta
import NavbarWrapper from "@/components/NavbarWrapper"   // Asegúrate de que la ruta sea correcta

export const metadata = {
  title: 'SmartDietAI',
  description: 'Nutrición personalizada con IA',
}

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="es">
      {/* Añade flex, flex-col y min-h-screen al body para un layout de página completa */}
      {/* Esto asegura que el body ocupe al menos el 100% de la altura de la viewport */}
      <body className="flex flex-col min-h-screen">
        <SessionWrapper session={session}>
          {/* La Navbar se renderiza aquí, una sola vez, fuera del contenido principal */}
          <NavbarWrapper />
          {/* El contenido principal de la página. flex-grow para que ocupe el espacio restante. */}
          {/* pt- para dejar espacio debajo de la navbar. Ajusta los valores si tu navbar tiene otra altura. */}
          {/* max-w-4xl mx-auto centra el contenido y w-full asegura que ocupe el ancho disponible */}
          {/* px-4 para padding horizontal en móviles, sm:px-6 para pantallas más grandes */}
          <main className="flex-grow max-w-4xl mx-auto w-full px-4 pt-16 sm:pt-20 md:pt-24">
            {children}
          </main>
        </SessionWrapper>
      </body>
    </html>
  )
}
