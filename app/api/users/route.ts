import { supabase } from '@/app/client/supabase';
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
const SYMBOLS = '!@#$%^&*()-_=+';

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
  const pools = [UPPER, LOWER, DIGITS, SYMBOLS];

  // Ensure at least one from each pool
  const required = [
    UPPER[randomInt(UPPER.length)],
    LOWER[randomInt(LOWER.length)],
    DIGITS[randomInt(DIGITS.length)],
    SYMBOLS[randomInt(SYMBOLS.length)],
  ];

  const all = UPPER + LOWER + DIGITS + SYMBOLS;
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
    const body: UserInsert = await request.json();

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
    await emailService.sendEmail({
      from: 'amayalert.site@gmail.com',
      to: body.email,
      subject: 'Welcome to AmayAlert!',
      text: `Hello ${body.full_name},\n\nYour account has been created successfully\n\nYou can now login with you account\nEmail: ${body.email}\nPassword: ${password}\n\nBest regards,\nAmayAlert Team`,
    });
    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully',
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
