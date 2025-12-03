import { NextRequest, NextResponse } from "next/server";
import { obtenerUsuarioDesdeTokenServer } from "@/lib/authServer";

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Intentar obtener el usuario desde token
    const usuario = obtenerUsuarioDesdeTokenServer(req);

    if (!usuario) {
      return NextResponse.json(
        { success: false, message: "No se recibió token o no se pudo decodificar" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, usuario },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
