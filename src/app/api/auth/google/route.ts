import { NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth2 Authorization Code callback.
 * Google redirects here with ?code=... after the user picks an account.
 * We exchange the code for an id_token server-side (requires GOOGLE_CLIENT_SECRET),
 * store it in a short-lived cookie, and redirect to /auth/callback for Firebase sign-in.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const host       = request.headers.get('host') ?? '';
  const proto      = host.startsWith('localhost') ? 'http' : 'https';
  const appUrl     = `${proto}://${host}`;
  const redirectUri = `${appUrl}/api/auth/google`;

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

    const tokens: { id_token?: string; error?: string } = await tokenRes.json();

    if (!tokens.id_token) {
      console.error('Google token exchange failed:', tokens);
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }

    // Pass the id_token to the client via a short-lived cookie (60 s)
    const response = NextResponse.redirect(new URL('/auth/callback', request.url));
    response.cookies.set('google_id_token', tokens.id_token, {
      httpOnly: false,   // client JS needs to read it
      secure:   proto === 'https',
      sameSite: 'lax',
      maxAge:   60,
      path:     '/',
    });
    return response;

  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }
}
