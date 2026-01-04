import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path') || '';
  const cookie = req.headers.get('cookie'); // ambil cookie otomatis

  try {
    const res = await axios.get(`http://localhost:3001/${path}`, {
      headers: { Cookie: cookie || '' },
    });
    return NextResponse.json(res.data);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path') || '';
  const cookie = req.headers.get('cookie');
  const body = await req.json();

  try {
    const res = await axios.post(`http://localhost:3001/${path}`, body, {
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie || '',
      },
    });
    return NextResponse.json(res.data);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
