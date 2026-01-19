import { NextRequest, NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use pdf2json which doesn't need canvas
    const pdfParser = new (PDFParser as any)(null, 1);
    
    const text = await new Promise<string>((resolve, reject) => {
      pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError));
      pdfParser.on('pdfParser_dataReady', () => {
        const rawText = (pdfParser as any).getRawTextContent();
        resolve(rawText);
      });
      
      pdfParser.parseBuffer(buffer);
    });
    
    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'PDF appears to be empty or contains only images' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      text: text.trim(),
    });
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract PDF text' },
      { status: 500 }
    );
  }
}
