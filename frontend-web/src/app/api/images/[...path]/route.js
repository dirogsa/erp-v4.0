import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  const { path: imagePathArray } = params;
  if (!imagePathArray) return new NextResponse('Not Found', { status: 404 });
  
  const imagePath = imagePathArray.join('/');
  const externalImagesDir = path.resolve(process.cwd(), '../images'); 
  
  const absolutePath = path.join(externalImagesDir, imagePath);
  
  // Security check to prevent directory traversal
  if (!absolutePath.startsWith(externalImagesDir)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    if (!fs.existsSync(absolutePath)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    
    let contentType = 'image/jpeg';
    if (absolutePath.endsWith('.webp')) contentType = 'image/webp';
    if (absolutePath.endsWith('.png')) contentType = 'image/png';
    if (absolutePath.endsWith('.svg')) contentType = 'image/svg+xml';
    if (absolutePath.endsWith('.gif')) contentType = 'image/gif';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200'
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
