import './globals.css'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import SessionWrapper from "@/components/SessionWrapper"
import NavbarWrapper from "@/components/NavbarWrapper"

export const metadata = {
  title: 'SmartDietAI',
  description: 'Nutrición personalizada con IA',
}

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="es">
      <body>
        <SessionWrapper session={session}>
          <NavbarWrapper />
          <main className="max-w-4xl mx-auto mt-6 px-4">
            {children}
          </main>
        </SessionWrapper>
      </body>
    </html>
  )
}
