'use client'

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

// Importaciones para el gráfico de Recharts
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Importa tus componentes reales
import ImageUploader from "@/components/ImageUploader"
import MealItem from "@/components/MealItem"


export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [meals, setMeals] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [lastAnalyzedMeal, setLastAnalyzedMeal] = useState(null); // Estado para la última comida analizada
  const [isClient, setIsClient] = useState(false); // Nuevo estado para verificar si estamos en el cliente

  // 🔐 Redirigir si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [status, router]);

  // ✅ Cargar comidas solo si está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  // Efecto para marcar que el componente se ha montado en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch("/api/meals"); // Asume que esta API está disponible
      if (!res.ok) throw new Error("No autorizado");
      const data = await res.json();
      console.log("DEBUG: Datos de comidas recibidos de /api/meals:", data); // Log de todos los datos

      setMeals(data);

      // Calcular totales del día actual
      const today = new Date().toISOString().split("T")[0];
      console.log("DEBUG: Fecha de hoy para filtrado:", today);

      const todayMeals = data.filter((meal) => {
        const createdAt = meal.createdAt;
        if (!createdAt) {
          console.warn("DEBUG: Comida sin createdAt:", meal);
          return false;
        }
        const date = new Date(createdAt);
        if (isNaN(date)) {
          console.warn("DEBUG: Fecha inválida para comida:", meal);
          return false;
        }
        const mealDateISO = date.toISOString();
        const isToday = mealDateISO.startsWith(today);
        console.log(`DEBUG: Comida: ${meal.food}, Creada: ${createdAt}, ISO: ${mealDateISO}, Es hoy: ${isToday}`); // Log detallado por comida
        return isToday;
      });

      console.log("DEBUG: Comidas de hoy filtradas:", todayMeals); // Log de comidas filtradas

      const calculatedTotals = todayMeals.reduce(
        (acc, meal) => {
          acc.calories += meal.calories || 0;
          acc.protein += meal.protein || 0;
          acc.carbs += meal.carbs || 0;
          acc.fat += meal.fat || 0;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      console.log("DEBUG: Totales calculados para hoy:", calculatedTotals); // Log de totales calculados
      setTotals(calculatedTotals);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Callback para cuando una imagen se sube exitosamente
  // Ahora recibe el objeto meal completo, incluyendo la URL de la imagen
  const handleUploadSuccess = (newMealDataWithImage) => {
    setLastAnalyzedMeal(newMealDataWithImage); // Guarda la última comida analizada (incluyendo la URL de la imagen)
    fetchData(); // Recarga todos los datos para actualizar los totales y el historial
  };

  // Preparar datos para el gráfico de pastel de macronutrientes
  const proteinCalories = totals.protein * 4;
  const carbsCalories = totals.carbs * 4;
  const fatCalories = totals.fat * 9;
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

  const macroData = [
    { name: 'Proteínas', value: proteinCalories },
    { name: 'Carbohidratos', value: carbsCalories },
    { name: 'Grasas', value: fatCalories },
  ].filter(item => item.value > 0);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658']; // Colores para Proteínas, Carbohidratos, Grasas

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
        <p className="text-xl text-gray-700">Cargando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex flex-col items-center justify-center p-4 sm:p-8 font-inter">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-4xl w-full text-center border border-gray-200">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-800 mb-4 tracking-tight">
          Tu Panel Nutricional <span className="text-green-500">SmartDietAI</span> 🥗
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto">
          Un vistazo rápido a tu ingesta nutricional de hoy y tu historial de comidas.
        </p>

        {/* Sección de Subida de Imagen */}
        <div className="mb-8 sm:mb-10 p-4 sm:p-6 bg-blue-50 rounded-2xl border border-blue-200 shadow-inner">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-4">Analiza tu próxima comida</h2>
          {/* Pasa la nueva función de callback para la subida exitosa */}
          <ImageUploader onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Sección de Última Comida Analizada */}
        {lastAnalyzedMeal && (
          <div className="mt-6 sm:mt-8 mb-8 sm:mb-10 p-4 sm:p-6 bg-yellow-50 rounded-2xl border border-yellow-200 shadow-md text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-yellow-700 mb-4">Última Comida Analizada</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{lastAnalyzedMeal.food}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3">
                  {new Date(lastAnalyzedMeal.createdAt).toLocaleString()}
                </p>
                <ul className="text-base sm:text-lg text-gray-700 space-y-2">
                  <li>🔥 Calorías: <span className="font-semibold">{lastAnalyzedMeal.calories}</span> kcal</li>
                  <li>🍗 Proteínas: <span className="font-semibold">{lastAnalyzedMeal.protein}</span> g</li>
                  <li>🍞 Carbohidratos: <span className="font-semibold">{lastAnalyzedMeal.carbs}</span> g</li>
                  <li>🥑 Grasas: <span className="font-semibold">{lastAnalyzedMeal.fat}</span> g</li>
                </ul>
              </div>
              <div className="flex justify-center items-center">
                {lastAnalyzedMeal.imageUrl ? (
                  <img
                    src={lastAnalyzedMeal.imageUrl}
                    alt={lastAnalyzedMeal.food}
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                    [No Image Preview]
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resumen de Hoy y Gráfico */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
          <div className="bg-green-50 p-4 sm:p-6 rounded-2xl border border-green-200 shadow-md h-full flex flex-col justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4 text-left">Resumen Nutricional de Hoy</h2>
            {isLoadingData ? (
              <div className="flex items-center justify-center h-full">
                <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="ml-2 sm:ml-3 text-gray-600 text-sm sm:text-base">Cargando datos...</p>
              </div>
            ) : (
              <ul className="text-gray-700 text-left text-base sm:text-xl space-y-2 sm:space-y-3">
                <li className="flex items-center">
                  <span className="text-xl sm:text-2xl mr-2">🔥</span>
                  <span className="font-semibold">Calorías:</span> {totals.calories} kcal
                </li>
                <li className="flex items-center">
                  <span className="text-xl sm:text-2xl mr-2">🍗</span>
                  <span className="font-semibold">Proteínas:</span> {totals.protein} g
                </li>
                <li className="flex items-center">
                  <span className="text-xl sm:text-2xl mr-2">🍞</span>
                  <span className="font-semibold">Carbohidratos:</span> {totals.carbs} g
                </li>
                <li className="flex items-center">
                  <span className="text-xl sm:text-2xl mr-2">🥑</span>
                  <span className="font-semibold">Grasas:</span> {totals.fat} g
                </li>
                {totalMacroCalories > 0 && (
                  <li className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-4">
                    Basado en {totalMacroCalories} kcal de macronutrientes.
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="bg-purple-50 p-4 sm:p-6 rounded-2xl border border-purple-200 shadow-md h-full flex flex-col justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-purple-700 mb-4 text-left">Distribución de Macronutrientes</h2>
            {isLoadingData ? (
              <div className="flex items-center justify-center h-full">
                <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="ml-2 sm:ml-3 text-gray-600 text-sm sm:text-base">Generando gráfico...</p>
              </div>
            ) : macroData.length > 0 && isClient ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    // El prop 'fill' debe estar dentro de la etiqueta de apertura de Pie,
                    // no en su propia línea como si fuera un atributo HTML independiente.
                    fill="#8884d8" // <-- Aseguramos que este prop esté correctamente dentro de la etiqueta <Pie>
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent, x, y, cx, cy }) => (
                      <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs sm:text-sm">
                        {`${name}: ${(percent * 100).toFixed(0)}%`}
                      </text>
                    )}
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Math.round(value)} kcal`} />
                  <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600 text-center h-full flex items-center justify-center">
                No hay datos de macronutrientes para mostrar el gráfico hoy.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 sm:mt-12 p-4 sm:p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-left">Tu Historial de Comidas</h2>
          {isLoadingData ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="ml-2 sm:ml-3 text-gray-600 text-sm sm:text-base">Cargando historial...</p>
            </div>
          ) : Array.isArray(meals) && meals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {meals.map((meal) => (
                <MealItem key={meal._id} meal={meal} onUpdate={fetchData} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-6 sm:py-8 text-sm sm:text-base">
              Aún no has registrado ninguna comida. ¡Sube una imagen para empezar!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
