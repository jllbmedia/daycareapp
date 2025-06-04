import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    const response = NextResponse.json({ success: true });

    // ✅ Set the session cookie correctly using NextResponse
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/', // optional, good practice
    });

    return response;
  } catch (error) {
    console.error('Error setting session:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });

    // ✅ Clear the session cookie
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // immediately expires
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error clearing session:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
