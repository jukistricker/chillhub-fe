import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Chỉ áp dụng cho route /upload
  if (request.nextUrl.pathname === '/upload') {
    response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  }

  return response;
}

export const config = {
  matcher: '/upload',
};