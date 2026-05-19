import { NextRequest, NextResponse } from 'next/server';

// Receives Google's POST after the user approves sign-in (ux_mode: "redirect")
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const credential = formData.get('credential') as string;

  if (!credential) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Pass the GIS token back to the client via query param (cleaned immediately by the page)
  const redirectUrl = new URL('/login', req.url);
  redirectUrl.searchParams.set('_gis', credential);
  return NextResponse.redirect(redirectUrl);
}
