import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  bankId: string;
  email: string;
  role: 'AGENCY' | 'AUDITOR' | 'COLLECTION_MANAGER' | 'AXIS_EMPLOYEE';
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isFirstTime: boolean;
}

export async function verifyToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as { userId: string; bankId: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        bankId: true,
        email: true,
        role: true,
        status: true,
        isFirstTime: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return user as AuthUser;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: AuthUser } | { error: string; status: number }> {
  const user = await verifyToken(request);

  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { error: 'Forbidden', status: 403 };
  }

  return { user };
}

// Helper function to get user from request
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  return await verifyToken(request);
}