import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { encryptCardNumber } from '@/lib/encryption';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json() as { name: string; number: string; expiry: string; amount: number };
    const { name, number, expiry, amount } = body;

    if (!name || !number || !expiry || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Extract last 4 digits (strip non-digits)
    const digitsOnly = number.replace(/\D/g, '');
    const numberLast4 = digitsOnly.slice(-4);

    // Encrypt the full number
    const encryptedNumber = await encryptCardNumber(digitsOnly);

    const db = getAdminDb();

    // Auto-share with anyone in the user's sharedListWith
    const userDoc = await db.collection('users').doc(uid).get();
    const sharedListWith: string[] = userDoc.data()?.sharedListWith || [];

    const ref = await db.collection('cards').add({
      ownerId: uid,
      name,
      number: encryptedNumber,
      numberLast4,
      expiry,
      amount,
      originalAmount: amount,
      sharedWith: sharedListWith,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/cards error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
