import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');

  if (!categoryId) {
    return NextResponse.json({ error: 'Missing categoryId' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/groups`, {
      headers: {
        'User-Agent': 'HatakeSocial/1.0.0 (Contact: admin@hatake.social)',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`Failed to fetch from TCGCSV: ${res.status}`);
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 });
  }
}
