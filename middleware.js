import { NextResponse } from 'next/server';

export function middleware(request) {
	try {
		console.log('[middleware] ', request.nextUrl.pathname);
	} catch (e) {

	}

	return NextResponse.next();
}
export const config = {
	matcher: ['/:path*']
};
