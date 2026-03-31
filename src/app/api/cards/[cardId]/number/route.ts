import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { decryptCardNumber } from '@/lib/encryption';

export async function GET(req: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const db = getAdminDb();
    const cardSnap = await db.collection('cards').doc(cardId).get();

    if (!cardSnap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = cardSnap.data()!;
    // Only owner or shared users may access the number
    const sharedWith: string[] = data.sharedWith || [];
    if (data.ownerId !== uid && !sharedWith.includes(uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const number = await decryptCardNumber(data.number as string);

    return NextResponse.json({ number });
  } catch (err) {
    console.error('GET /api/cards/[cardId]/number error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
