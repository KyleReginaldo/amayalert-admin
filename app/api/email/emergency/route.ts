import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '../../../../database.types';
import { emailService } from '../../../lib/email-service';

// POST /api/email/emergency - Send emergency alert via email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, title, content, alertLevel, location } = body;

    // Validate required fields
    if (!title || !content || !alertLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, alertLevel' },
        { status: 400 },
      );
    }

    // Validate alert level
    const validLevels = ['low', 'medium', 'high', 'critical'];
    if (!validLevels.includes(alertLevel)) {
      return NextResponse.json(
        { error: 'Invalid alert level. Must be one of: low, medium, high, critical' },
        { status: 400 },
      );
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE!;
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get recipients' emails
    let recipients: string[] = [];

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Get specific users' emails
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('email')
        .in('id', userIds)
        .not('email', 'is', null);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return NextResponse.json({ error: 'Failed to fetch user emails' }, { status: 500 });
      }

      recipients = users?.map((user) => user.email).filter(Boolean) || [];
    } else {
      // Get all users' emails for broadcast
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('email')
        .not('email', 'is', null);

      if (usersError) {
        console.error('Error fetching all users:', usersError);
        return NextResponse.json({ error: 'Failed to fetch user emails' }, { status: 500 });
      }

      recipients = users?.map((user) => user.email).filter(Boolean) || [];
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid email recipients found' }, { status: 400 });
    }

    // Send emergency alert emails
    const result = await emailService.sendEmergencyAlert(recipients, {
      title,
      content,
      alertLevel,
      location,
    });

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: `Emergency alert sent to ${recipients.length} recipients`,
          recipientsCount: recipients.length,
          messageId: result.messageId,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Emergency email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
