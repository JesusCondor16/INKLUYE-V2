import { NextResponse } from "next/server";
import { authController } from "@/controllers/authController";
import { AuthError } from "@/services/authService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Llamada al controller que maneja autenticación
    const result = await authController.login(email.toLowerCase(), password);

    if (!result || !result.token) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      message: "Autenticación exitosa",
      token: result.token,
    });

    res.cookies.set("token", result.token, {
      httpOnly: true,
      path: "/",
      maxAge: 2 * 60 * 60,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { message: error.publicMessage },
        { status: 401 }
      );
    }

    console.error("❌ Error en /api/auth/login:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
