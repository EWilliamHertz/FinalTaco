import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const groupId = searchParams.get('groupId');

  if (!categoryId || !groupId) {
    return NextResponse.json({ error: 'Missing categoryId or groupId' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/${groupId}/products`, {
      headers: {
        'User-Agent': 'HatakeSocial/1.0.0',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`Failed to fetch from TCGCSV: ${res.status}`);
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}
