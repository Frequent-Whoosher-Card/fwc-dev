import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Ambil cookie HttpOnly dari request
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ message: 'Belum login' }, { status: 401 });

  const body = await req.json();

  const res = await fetch('http://localhost:3001/stock/stock/in/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
