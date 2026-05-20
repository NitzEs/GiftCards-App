import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Exchanges a Google OAuth2 authorization code for an id_token.
 * Called by /auth/google-popup (the popup callback page).
 * Returns JSON { idToken } on success, { error } on failure.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 });
  }

  const host      = request.headers.get('host') ?? '';
  const proto     = host.startsWith('localhost') ? 'http' : 'https';
  const redirectUri = `${proto}://${host}/auth/google-popup`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    });

    const tokens: { id_token?: string; error?: string; error_description?: string } =
      await tokenRes.json();

    if (!tokens.id_token) {
      console.error('[google-token] Exchange failed:', tokens);
      return NextResponse.json(
        { error: tokens.error ?? 'exchange_failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ idToken: tokens.id_token });
  } catch (err) {
    console.error('[google-token] Server error:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
