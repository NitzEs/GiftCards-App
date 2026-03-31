import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { decryptCardNumber } from '@/lib/encryption';
import { fetchCardBalance } from '@/lib/multipass';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const cardId = req.nextUrl.searchParams.get('cardId');
    if (!cardId) return NextResponse.json({ error: 'Missing cardId' }, { status: 400 });

    const db = getAdminDb();
    const cardSnap = await db.collection('cards').doc(cardId).get();

    if (!cardSnap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = cardSnap.data()!;
    const sharedWith: string[] = data.sharedWith || [];
    if (data.ownerId !== uid && !sharedWith.includes(uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const number = await decryptCardNumber(data.number as string);
    const balance = await fetchCardBalance(number);

    if (balance === null) {
      return NextResponse.json({ error: 'Could not fetch balance' }, { status: 502 });
    }

    return NextResponse.json({ balance });
  } catch (err) {
    console.error('GET /api/balance error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
