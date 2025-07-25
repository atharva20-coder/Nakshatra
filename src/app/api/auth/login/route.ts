import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bankId, password } = body;

    // Validation
    if (!bankId || !password) {
      return NextResponse.json(
        { error: 'Bank ID and password are required' },
        { status: 400 }
      );
    }

    // Find user with profile data
    const user = await prisma.user.findUnique({
      where: { bankId },
      include: {
        agencyProfile: true,
        auditorProfile: true,
        collectionManagerProfile: true,
        axisEmployeeProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Account is not active. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        bankId: user.bankId,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Get profile name based on role
    let profileName = '';
    switch (user.role) {
      case 'AGENCY':
        profileName = user.agencyProfile?.agencyName || '';
        break;
      case 'AUDITOR':
        profileName = user.auditorProfile?.auditorName || '';
        break;
      case 'COLLECTION_MANAGER':
        profileName = user.collectionManagerProfile?.managerName || '';
        break;
      case 'AXIS_EMPLOYEE':
        profileName = user.axisEmployeeProfile?.employeeName || '';
        break;
    }

    // Update first time login status if needed
    if (user.isFirstTime) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          isFirstTime: false,
          status: 'ACTIVE' // Activate user on first successful login
        },
      });
    }

    // Prepare user data for response (without password)
    const { password: _, ...userWithoutPassword } = user;
    const userData = {
      ...userWithoutPassword,
      profileName,
    };

    // Set HTTP-only cookie for authentication
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: userData
      },
      { status: 200 }
    );

    // Set cookie with JWT token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}