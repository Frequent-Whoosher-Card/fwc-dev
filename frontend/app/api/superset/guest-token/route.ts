import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dashboardId = searchParams.get('dashboardId');

  if (!dashboardId) {
    return NextResponse.json({ success: false, message: 'dashboardId required' }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`http://127.0.0.1:3001/superset/guest-token?dashboardId=${dashboardId}`, {
      method: 'GET',
    });

    if (!backendRes.ok) {
      throw new Error('Failed to get guest token from backend');
    }

    const data = await backendRes.json();
    
    if (data.success) {
      return NextResponse.json({ success: true, token: data.token });
    } else {
      throw new Error(data.message || 'Backend returned unsuccessful response');
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to fetch guest token' 
    }, { status: 500 });
  }
}
