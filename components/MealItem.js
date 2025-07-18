
'use client'

import { useState } from "react"

export default function MealItem({ meal, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    food: meal.food,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    // Asegúrate de que onUpdate se pase correctamente desde DashboardPage
    // y que la API de PATCH use 'userEmail' en lugar de 'user'
    await fetch(`/api/meals/${meal._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
      }),
    })
    setEditing(false)
    if (onUpdate) onUpdate() // Recarga los datos en el dashboard
  }

  return (
    <div className="py-3 border-b bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-left">
      {editing ? (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <input name="food" value={form.food} onChange={handleChange} className="border p-1 rounded-md" />
          <input name="calories" value={form.calories} onChange={handleChange} type="number" className="border p-1 rounded-md" />
          <input name="protein" value={form.protein} onChange={handleChange} type="number" className="border p-1 rounded-md" />
          <input name="carbs" value={form.carbs} onChange={handleChange} type="number" className="border p-1 rounded-md" />
          <input name="fat" value={form.fat} onChange={handleChange} type="number" className="border p-1 rounded-md" />
          <button onClick={handleSave} className="bg-green-600 text-white px-2 py-1 rounded-full col-span-2 hover:bg-green-700 transition-colors">Guardar</button>
        </div>
      ) : (
        <>
          <div className="font-medium text-lg text-gray-800">{meal.food}</div>
          <div className="text-sm text-gray-600 mb-2">
            {meal.createdAt ? new Date(meal.createdAt).toLocaleString() : 'Fecha desconocida'}
          </div>
          <div className="text-sm text-gray-700">
            <p>🔥 Cal: {meal.calories}</p>
            <p>🍗 Prot: {meal.protein}g</p>
            <p>🍞 Carbs: {meal.carbs}g</p>
            <p>🥑 Grasa: {meal.fat}g</p>
          </div>
          <button onClick={() => setEditing(true)} className="text-blue-600 text-sm mt-2 hover:underline">Editar</button>
        </>
      )}
    </div>
  )
}
