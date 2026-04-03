import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';

/**
 * Handle RevenueCat Webhooks
 * Reference: https://docs.revenuecat.com/docs/webhooks
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.REVENUECAT_WEBHOOK_AUTH;

    // Optional SECURITY: Validate webhook secret if configured
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event } = body;
    
    if (!event) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });

    const userId = event.app_user_id;
    const type = event.type;

    if (!userId) return NextResponse.json({ error: 'No userId' }, { status: 200 });

    await dbConnect();

    // Mapping relevant events to subscription status
    // INITIAL_PURCHASE, RENEWAL, RESTORATION, UNCANCELLATION -> ACTIVE
    // EXPIRATION, CANCELLATION, BILLING_ISSUE -> CHECK_STATUS
    
    let isPro = false;
    const activeStates = ['INITIAL_PURCHASE', 'RENEWAL', 'RESTORATION', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED'];
    const inactiveStates = ['EXPIRATION', 'CANCELLATION', 'BILLING_ISSUE', 'PRODUCT_CHANGE'];

    if (activeStates.includes(type)) {
      isPro = true;
    } else if (inactiveStates.includes(type)) {
      isPro = false;
    } else {
      // For other events, we don't necessarily want to toggle status
      return NextResponse.json({ status: 'ignored' });
    }

    await User.findOneAndUpdate(
      { userId },
      { 
        $set: { isPro, revenueCatId: event.original_app_user_id || userId },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    console.log(`[RevenueCat] Updated user ${userId} to pro=${isPro} (Event: ${type})`);

    return NextResponse.json({ status: 'ok' });
  } catch (e: any) {
    console.error('[RevenueCat Webhook Error]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
