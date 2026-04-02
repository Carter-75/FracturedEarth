import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

/**
 * Generic KV proxy for the Android app's VercelKvClient.
 * 
 * Supports:
 * - GET /api/kv?cmd=get&key=...
 * - GET /api/kv?cmd=hgetall&key=...
 * - POST /api/kv { cmd: 'set', key: '...', value: '...' }
 * - POST /api/kv { cmd: 'hset', key: '...', field: '...', value: '...' }
 * - POST /api/kv { cmd: 'hincrby', key: '...', field: '...', amount: 1 }
 * - POST /api/kv { cmd: 'zadd', key: '...', score: 1, member: '...' }
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const cmd = searchParams.get('cmd');
    const key = searchParams.get('key');

    if (!cmd || !key) return NextResponse.json({ error: 'Missing cmd or key' }, { status: 400 });

    const redis = await getRedis();

    try {
        switch (cmd.toLowerCase()) {
            case 'get': {
                const val = await redis.get(key);
                return NextResponse.json({ value: val });
            }
            case 'hgetall': {
                const val = await redis.hGetAll(key);
                return NextResponse.json(val);
            }
            default:
                return NextResponse.json({ error: 'Command not supported in GET' }, { status: 405 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    if (!body?.cmd || !body?.key) {
        return NextResponse.json({ error: 'Missing cmd or key' }, { status: 400 });
    }

    const redis = await getRedis();
    const { cmd, key, field, value, amount, score, member } = body;

    try {
        switch (cmd.toLowerCase()) {
            case 'set':
                await redis.set(key, String(value));
                return NextResponse.json({ success: true });
            case 'hset':
                await redis.hSet(key, { [String(field)]: String(value) });
                return NextResponse.json({ success: true });
            case 'hincrby':
                const nextVal = await redis.hIncrBy(key, String(field), Number(amount || 1));
                return NextResponse.json({ value: nextVal });
            case 'zadd':
                await redis.zAdd(key, { score: Number(score || 0), value: String(member) });
                return NextResponse.json({ success: true });
            default:
                return NextResponse.json({ error: 'Command not supported' }, { status: 405 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
