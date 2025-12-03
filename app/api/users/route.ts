import { NextRequest } from 'next/server';
import { userController } from '@/controllers/userController';

export async function GET(req: NextRequest) {
  return userController.getAll(req);
}

export async function POST(req: NextRequest) {
  return userController.create(req);
}
