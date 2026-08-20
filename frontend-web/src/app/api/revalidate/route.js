import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { secret, tag } = await request.json();

    // En producción, usa una variable de entorno sólida. Para desarrollo local, usaremos un token simple.
    const REVALIDATE_TOKEN = process.env.REVALIDATE_SECRET || 'dirogsa-super-secret-revalidate-token';

    if (secret !== REVALIDATE_TOKEN) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    if (!tag) {
      return NextResponse.json({ message: 'Missing tag param' }, { status: 400 });
    }

    revalidateTag(tag);

    return NextResponse.json({ revalidated: true, tag, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating', error: err.message }, { status: 500 });
  }
}
