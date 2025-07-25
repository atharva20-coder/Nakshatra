import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      bankId, 
      email, 
      password, 
      phoneNumber, 
      role,
      ...profileData 
    } = body;

    // Validation
    if (!bankId || !email || !password || !phoneNumber || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { bankId },
          { email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this Bank ID or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with profile in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create user
      const user = await tx.user.create({
        data: {
          bankId,
          email,
          password: hashedPassword,
          phoneNumber,
          role,
          status: 'PENDING',
          isFirstTime: true,
        },
      });

      // Create role-specific profile
      switch (role) {
        case 'AGENCY':
          await tx.agencyProfile.create({
            data: {
              userId: user.id,
              agencyName: profileData.agencyName,
              registrationNumber: profileData.registrationNumber,
              address: profileData.address,
              city: profileData.city,
              state: profileData.state,
              pincode: profileData.pincode,
              contactPerson: profileData.contactPerson,
              businessType: profileData.businessType,
              panNumber: profileData.panNumber,
              gstNumber: profileData.gstNumber,
            },
          });
          break;

        case 'AUDITOR':
          await tx.auditorProfile.create({
            data: {
              userId: user.id,
              auditorName: profileData.auditorName,
              firmName: profileData.firmName,
              licenseNumber: profileData.licenseNumber,
              qualification: profileData.qualification,
              experience: profileData.experience,
              specialization: profileData.specialization,
              address: profileData.address,
              city: profileData.city,
              state: profileData.state,
              pincode: profileData.pincode,
              panNumber: profileData.panNumber,
            },
          });
          break;

        case 'COLLECTION_MANAGER':
          await tx.collectionManagerProfile.create({
            data: {
              userId: user.id,
              managerName: profileData.managerName,
              employeeId: profileData.employeeId,
              department: profileData.department,
              designation: profileData.designation,
              reportingManager: profileData.reportingManager,
              region: profileData.region,
              territory: profileData.territory,
              experience: profileData.experience,
            },
          });
          break;

        case 'AXIS_EMPLOYEE':
          await tx.axisEmployeeProfile.create({
            data: {
              userId: user.id,
              employeeName: profileData.employeeName,
              employeeId: profileData.employeeId,
              department: profileData.department,
              designation: profileData.designation,
              branch: profileData.branch,
              reportingManager: profileData.reportingManager,
              grade: profileData.grade,
              zone: profileData.zone,
              region: profileData.region,
            },
          });
          break;

        default:
          throw new Error('Invalid role');
      }

      return user;
    });

    // Return success response (without password)
    const { password: _, ...userWithoutPassword } = result;
    
    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userWithoutPassword
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}