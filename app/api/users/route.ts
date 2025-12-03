// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { userController } from '@/controllers/userController';

export async function GET(req: NextRequest) {
  const users = await userController.getAll(req);
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const newUser = await userController.create(req);
  return NextResponse.json(newUser);
}
