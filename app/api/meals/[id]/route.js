import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const body = await req.json();

  const client = await clientPromise;
  const db = client.db();

  // CAMBIO AQUÍ: Usar userEmail en lugar de user para la condición de actualización
  await db.collection("meals").updateOne(
    { _id: new ObjectId(id), userEmail: session.user.email },
    { $set: body }
  );

  return NextResponse.json({ success: true });
}
