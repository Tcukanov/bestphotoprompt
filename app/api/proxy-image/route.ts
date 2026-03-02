import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = [
  'scontent-lga3-3.cdninstagram.com',
  'scontent-lga3-2.cdninstagram.com',
  'scontent-lga3-1.cdninstagram.com',
  'scontent.cdninstagram.com',
  'instagram.fxxx1-1.fna.fbcdn.net',
];

function isAllowedHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname.endsWith('.cdninstagram.com') ||
      hostname.endsWith('.fbcdn.net') ||
      ALLOWED_HOSTS.includes(hostname)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  if (!isAllowedHost(imageUrl)) {
    return new NextResponse('Host not allowed', { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        // Impersonate a browser visiting threads.net — this satisfies Instagram CDN's referer check
        Referer: 'https://www.threads.net/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'sec-fetch-dest': 'image',
        'sec-fetch-mode': 'no-cors',
        'sec-fetch-site': 'cross-site',
      },
      // Don't follow too many redirects
      redirect: 'follow',
    });

    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/webp';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache for 24 hours in browser, 1 hour at CDN edge
        'Cache-Control': 'public, max-age=86400, s-maxage=3600',
        'X-Proxied': '1',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Proxy error: ${msg}`, { status: 500 });
  }
}
