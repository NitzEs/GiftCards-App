import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json() as { cardId: string; inviteeEmail: string };
    const { cardId, inviteeEmail } = body;

    if (!cardId || !inviteeEmail) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const db = getAdminDb();

    // Verify card ownership
    const cardSnap = await db.collection('cards').doc(cardId).get();
    if (!cardSnap.exists || cardSnap.data()?.ownerId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already shared
    const existingShared: string[] = cardSnap.data()?.sharedWith || [];

    // Look up user by email
    let inviteeUid: string | null = null;
    try {
      const inviteeUser = await getAdminAuth().getUserByEmail(inviteeEmail);
      inviteeUid = inviteeUser.uid;
    } catch {
      // User doesn't exist yet — create pending invitation
    }

    if (inviteeUid) {
      if (existingShared.includes(inviteeUid)) {
        return NextResponse.json({ error: 'Already shared' }, { status: 409 });
      }
      // Immediately add to sharedWith
      await db.collection('cards').doc(cardId).update({
        sharedWith: FieldValue.arrayUnion(inviteeUid),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Create pending invitation
      const inviterSnap = await db.collection('users').doc(uid).get();
      const inviterEmail = inviterSnap.data()?.email || decoded.email || '';

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.collection('invitations').add({
        inviterUid: uid,
        inviterEmail,
        inviteeEmail,
        cardId,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        expiresAt,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('POST /api/invitations error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
