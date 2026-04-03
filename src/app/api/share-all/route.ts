import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const myUid = decoded.uid;

    const body = await req.json() as { inviteeEmail: string };
    const { inviteeEmail } = body;
    if (!inviteeEmail) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const db = getAdminDb();

    // Look up invitee
    let inviteeUid: string | null = null;
    try {
      const inviteeUser = await getAdminAuth().getUserByEmail(inviteeEmail);
      inviteeUid = inviteeUser.uid;
    } catch {
      // User not registered yet — create a pending invitation below
    }

    if (!inviteeUid) {
      // Fetch inviter's name for the invitation email
      const inviterSnap = await db.collection('users').doc(myUid).get();
      const inviterName: string = inviterSnap.data()?.displayName || decoded.email || 'מישהו';

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Store pending invitation so it auto-applies when invitee registers
      await db.collection('shareInvitations').add({
        inviterUid: myUid,
        inviterName,
        inviteeEmail,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        expiresAt,
      });

      const appUrl = new URL(req.url).origin;
      return NextResponse.json({
        pending: true,
        inviteLink: `${appUrl}/register`,
        inviterName,
      });
    }

    if (inviteeUid === myUid) {
      return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
    }

    // 1. Update both users' sharedListWith (mutual)
    await db.collection('users').doc(myUid).set(
      { sharedListWith: FieldValue.arrayUnion(inviteeUid) },
      { merge: true }
    );
    await db.collection('users').doc(inviteeUid).set(
      { sharedListWith: FieldValue.arrayUnion(myUid) },
      { merge: true }
    );

    // 2. Add invitee to all MY existing cards
    const myCards = await db.collection('cards').where('ownerId', '==', myUid).get();
    const batch1 = db.batch();
    myCards.docs.forEach((doc) => {
      batch1.update(doc.ref, {
        sharedWith: FieldValue.arrayUnion(inviteeUid),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    if (myCards.docs.length > 0) await batch1.commit();

    // 3. Add ME to all THEIR existing cards (bidirectional)
    const theirCards = await db.collection('cards').where('ownerId', '==', inviteeUid).get();
    const batch2 = db.batch();
    theirCards.docs.forEach((doc) => {
      batch2.update(doc.ref, {
        sharedWith: FieldValue.arrayUnion(myUid),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    if (theirCards.docs.length > 0) await batch2.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/share-all error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
