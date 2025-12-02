import { supabase } from '@/app/client/supabase';
import { logAdminAction, logUserAction } from '@/app/lib/activity-logger';
import emailService from '@/app/lib/email-service';
import { Database } from '@/database.types';
import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Types
type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserRole = Database['public']['Enums']['user_role'];

interface UserFilters {
  search?: string;
  role?: UserRole;
  created_after?: string;
  created_before?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

// Secure password generator: 8 characters with upper, lower, digit, and symbol
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
// Keep a conservative symbol set to avoid email or form escaping issues

function getRandomUint32Array(count: number): Uint32Array {
  if (typeof globalThis.crypto !== 'undefined' && 'getRandomValues' in globalThis.crypto) {
    const arr = new Uint32Array(count);
    globalThis.crypto.getRandomValues(arr);
    return arr;
  }
  // Fallback to Node's crypto
  const buf = randomBytes(count * 4);
  const arr = new Uint32Array(count);
  for (let i = 0; i < count; i++) {
    arr[i] = buf.readUInt32LE(i * 4);
  }
  return arr;
}

function randomInt(maxExclusive: number): number {
  // Avoid modulo bias by using 32-bit space; bias is negligible for our small max
  const [n] = getRandomUint32Array(1);
  return n % maxExclusive;
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateStrongPassword(length = 8): string {
  const minLen = 8;
  const L = Math.max(length, minLen);

  // Ensure at least one from each pool
  const required = [
    UPPER[randomInt(UPPER.length)],
    LOWER[randomInt(LOWER.length)],
    DIGITS[randomInt(DIGITS.length)],
  ];

  const all = UPPER + LOWER + DIGITS;
  const remaining: string[] = [];
  for (let i = required.length; i < L; i++) {
    remaining.push(all[randomInt(all.length)]);
  }

  // Combine and shuffle
  const passwordChars = shuffle([...required, ...remaining]);
  return passwordChars.slice(0, L).join('');
}

// GET /api/users - Fetch all users with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const filters: UserFilters = {
      search: searchParams.get('search') || undefined,
      role: (searchParams.get('role') as UserRole) || undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
    };

    // Build query
    let query = supabase.from('users').select('*').order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`,
      );
    }

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch users',
          message: error.message,
        } as ApiResponse<User[]>,
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: users || [],
      total: count || users?.length || 0,
      message: `Found ${users?.length || 0} users`,
    } as ApiResponse<User[]>);
  } catch (error) {
    console.error('Unexpected error in GET /api/users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse<User[]>,
      { status: 500 },
    );
  }
}

// POST /api/users - Create a new user (if needed for admin creation)
export async function POST(request: NextRequest) {
  try {
    // Allow optional userId for activity logging without polluting DB type
    const body = (await request.json()) as UserInsert & { userId?: string };

    // Extract userId from request body (optional; may be undefined)
    const userId = body.userId;
    console.log('🔐 User ID from request:', userId);

    // Validate required fields
    if (!body.email || !body.full_name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Email and full name are required',
        } as ApiResponse<User>,
        { status: 400 },
      );
    }
    const password = generateStrongPassword(8);
    // Ensure phone_number is provided (database requires it)
    const { data: userAuth, error: errorAuth } = await supabase.auth.admin.createUser({
      email: body.email,
      password,
      email_confirm: true,
    });
    if (errorAuth) {
      console.error('Error creating user:', errorAuth);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user',
          message: errorAuth.message,
        } as ApiResponse<User>,
        { status: 500 },
      );
    }
    const userData: UserInsert = {
      ...body,
      phone_number:
        body.phone_number && body.phone_number.trim() !== '' ? body.phone_number.trim() : '',
      // Ensure we have a valid UUID for the ID
      id: userAuth.user?.id ?? '',
    };

    const { data: user, error } = await supabase.from('users').insert([userData]).select().single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user',
          message: error.message,
        } as ApiResponse<User>,
        { status: 500 },
      );
    }
    // Determine sign-in URL based on user role
    const signInUrl =
      body.role === 'sub_admin' || body.role === 'admin'
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signin`
        : 'https://amayalert.site'; // Mobile app or user portal URL

    // Send welcome email with credentials
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Amayalert!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your account has been created</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 0;">
            Hello <strong>${body.full_name}</strong>,
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            ${
              body.role === 'sub_admin' ? 'An administrator' : 'Your account'
            } has been created for you on the Amayalert ${
      body.role === 'sub_admin' ? 'Admin' : ''
    } platform. 
            Below are your login credentials:
          </p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: bold;">Email:</td>
                <td style="padding: 10px 0; color: #333; font-size: 14px;">${body.email}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: bold;">Password:</td>
                <td style="padding: 10px 0;">
                  <code style="background-color: #fff; padding: 8px 12px; border-radius: 4px; border: 1px solid #e5e7eb; font-size: 14px; color: #dc2626; font-weight: bold; display: inline-block;">${password}</code>
                </td>
              </tr>
              ${
                body.role === 'sub_admin'
                  ? `
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: bold;">Role:</td>
                <td style="padding: 10px 0;">
                  <span style="background-color: #dc2626; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Sub Admin</span>
                </td>
              </tr>
              `
                  : ''
              }
              ${
                body.modules && body.modules.length > 0
                  ? `
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: bold; vertical-align: top;">Module Access:</td>
                <td style="padding: 10px 0;">
                  <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${body.modules
                      .map(
                        (module) => `
                      <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 11px; text-transform: capitalize; display: inline-block;">${module}</span>
                    `,
                      )
                      .join('')}
                  </div>
                </td>
              </tr>
              `
                  : ''
              }
            </table>
          </div>

          <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; border: 1px solid #fbbf24; margin: 25px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⚠️ Security Notice:</strong> Please change your password after your first login for security purposes.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${signInUrl}" style="background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Sign In Now
            </a>
          </div>

          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
        </div>
        
        <div style="text-align: center; color: #9ca3af; font-size: 13px; margin-top: 20px; padding: 20px;">
          <p style="margin: 5px 0;">This is an automated message from Amayalert</p>
          <p style="margin: 5px 0;">Please do not reply to this email</p>
          <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Amayalert. All rights reserved.</p>
        </div>
      </div>
    `;

    const textContent = `
Welcome to Amayalert!

Hello ${body.full_name},

${
  body.role === 'sub_admin' ? 'An administrator' : 'Your account'
} has been created for you on the Amayalert ${body.role === 'sub_admin' ? 'Admin' : ''} platform.

Your Login Credentials:
-----------------------
Email: ${body.email}
Password: ${password}
${body.role === 'sub_admin' ? 'Role: Sub Admin' : ''}
${body.modules && body.modules.length > 0 ? `Module Access: ${body.modules.join(', ')}` : ''}

⚠️ Security Notice: Please change your password after your first login for security purposes.

Sign In Here:
${signInUrl}

If you have any questions or need assistance, please contact our support team.

---
This is an automated message from Amayalert.
Please do not reply to this email.

© ${new Date().getFullYear()} Amayalert. All rights reserved.
    `;

    await emailService.sendEmail({
      to: body.email,
      subject:
        body.role === 'sub_admin'
          ? '🔐 Your Amayalert Admin Account - Login Credentials'
          : 'Welcome to Amayalert - Your Account Details',
      text: textContent,
      html: htmlContent,
    });

    // Log the activity
    if (body.role === 'sub_admin' || body.role === 'admin') {
      await logAdminAction('create', body.full_name, body.modules as string[] | undefined, userId);
    } else {
      await logUserAction('create', body.full_name, `Email: ${body.email}`, userId);
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully. Welcome email sent.',
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Unexpected error in POST /api/users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      } as ApiResponse<User>,
      { status: 500 },
    );
  }
}
