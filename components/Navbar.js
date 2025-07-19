
"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Sparkles, LogOut, LogIn, UserPlus } from 'lucide-react'; // Importa iconos de lucide-react

export default function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="w-full bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap justify-between items-center shadow-lg relative z-10">
      <Link href="/" className="flex items-center text-xl sm:text-2xl font-extrabold text-white tracking-tight hover:text-gray-100 transition-colors duration-300">
        <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 mr-1 sm:mr-2 text-yellow-300" /> {/* Icono de Sparkles */}
        SmartDietAI
      </Link>

      {status === "loading" ? (
        // Muestra un spinner o un mensaje de carga mientras se verifica la sesión
        <div className="flex items-center ml-auto"> {/* ml-auto para empujar a la derecha en móvil */}
          <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white mr-2 sm:mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-white text-xs sm:text-sm">Cargando...</span>
        </div>
      ) : session ? (
        // Si el usuario está autenticado
        <div className="flex items-center space-x-2 sm:space-x-4 mt-2 sm:mt-0 w-full sm:w-auto justify-end"> {/* Ajuste para envolver y alinear en móvil */}
          <span className="text-white text-sm sm:text-lg font-medium truncate max-w-[100px] sm:max-w-none">Hola, {session.user.name || session.user.email.split('@')[0]}</span>
          <Link href="/dashboard" className="bg-white text-green-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-sm sm:text-base hover:bg-gray-100 transition-all duration-300 shadow-md">
            Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-red-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-sm sm:text-base hover:bg-red-600 transition-all duration-300 shadow-md flex items-center"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
            Cerrar sesión
          </button>
        </div>
      ) : (
        // Si el usuario no está autenticado
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 space-x-0 sm:space-x-3 mt-2 sm:mt-0 w-full sm:w-auto justify-end"> {/* Ajuste para apilar en móvil */}
          <Link
            href="/auth/signin"
            className="bg-white text-green-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-sm sm:text-base hover:bg-gray-100 transition-all duration-300 shadow-md flex items-center justify-center"
          >
            <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
            Iniciar sesión
          </Link>
          <Link
            href="/auth/register"
            className="border border-white text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-sm sm:text-base hover:bg-white hover:text-green-600 transition-all duration-300 shadow-md flex items-center justify-center"
          >
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
            Registrarse
          </Link>
        </div>
      )}
    </nav>
  )
}
