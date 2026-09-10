import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const fileUrl = 'https://github.com/ploiu123/zpi-wsiz/releases/download/v1.0.0/zpi-wsiz-main.Setup.1.0.0.exe';
  
  try {
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      return new NextResponse('Error fetching file', { status: response.status });
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Disposition': 'attachment; filename="ZloteMiody-Windows.exe"',
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return new NextResponse('Error fetching file', { status: 500 });
  }
}
