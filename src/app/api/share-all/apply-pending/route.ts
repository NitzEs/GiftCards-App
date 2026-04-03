import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// Called automatically after every sign-in/register to apply any pending share invitations
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const { uid, email } = decoded;
    if (!email) return NextResponse.json({ applied: 0 });

    const db = getAdminDb();

    const pending = await db.collection('shareInvitations')
      .where('inviteeEmail', '==', email)
      .where('status', '==', 'pending')
      .get();

    if (pending.empty) return NextResponse.json({ applied: 0 });

    let applied = 0;
    for (const invDoc of pending.docs) {
      const { inviterUid } = invDoc.data() as { inviterUid: string };

      // Bidirectional sharedListWith
      await db.collection('users').doc(inviterUid).set(
        { sharedListWith: FieldValue.arrayUnion(uid) },
        { merge: true }
      );
      await db.collection('users').doc(uid).set(
        { sharedListWith: FieldValue.arrayUnion(inviterUid) },
        { merge: true }
      );

      // Add new user to all inviter's existing cards
      const inviterCards = await db.collection('cards').where('ownerId', '==', inviterUid).get();
      if (!inviterCards.empty) {
        const b1 = db.batch();
        inviterCards.docs.forEach((c) => {
          b1.update(c.ref, {
            sharedWith: FieldValue.arrayUnion(uid),
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
        await b1.commit();
      }

      // Add inviter to all new user's existing cards
      const myCards = await db.collection('cards').where('ownerId', '==', uid).get();
      if (!myCards.empty) {
        const b2 = db.batch();
        myCards.docs.forEach((c) => {
          b2.update(c.ref, {
            sharedWith: FieldValue.arrayUnion(inviterUid),
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
        await b2.commit();
      }

      await invDoc.ref.update({ status: 'accepted' });
      applied++;
    }

    return NextResponse.json({ applied });
  } catch (err) {
    console.error('POST /api/share-all/apply-pending error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
