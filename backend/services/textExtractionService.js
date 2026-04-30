const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const officeParser = require('officeparser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const OpenAI = require('openai');

/**
 * Extract text from various file types (Images, PDF, PPTX, DOCX)
 * @param {string} filePath - Path to the file or URL
 * @param {string} mimetype - Mimetype of the file
 * @returns {Promise<string>} - Extracted text content
 */
exports.extractText = async (filePath, mimetype) => {
  try {
    let text = '';
    const fileExtension = path.extname(filePath).toLowerCase();
    
    console.log(`[EXTRACTION_DEBUG] Starting extraction for: ${filePath}`);
    console.log(`[EXTRACTION_DEBUG] Identified Mimetype: ${mimetype}, Extension: ${fileExtension}`);

    // Handle local paths vs URLs (Cloudinary)
    let isUrl = filePath.startsWith('http');
    let buffer;

    if (isUrl) {
      const response = await axios.get(filePath, { responseType: 'arraybuffer' });
      buffer = Buffer.from(response.data, 'binary');
    } else {
      buffer = fs.readFileSync(filePath);
    }

    // Determine strategy based on mimetype AND extension
    const isImage = mimetype?.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.heic'].includes(fileExtension);
    const isPDF = mimetype === 'application/pdf' || fileExtension === '.pdf';
    const isWord = mimetype?.includes('word') || mimetype?.includes('officedocument.wordprocessingml') || ['.docx', '.doc'].includes(fileExtension);
    const isPPT = mimetype?.includes('presentation') || mimetype?.includes('powerpoint') || ['.pptx', '.ppt'].includes(fileExtension);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (isImage) {
      console.log(`[EXTRACTION_DEBUG] Strategy: OpenAI Vision OCR (Image/Handwriting)`);
      try {
        const base64Image = buffer.toString('base64');
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Please extract all handwritten or printed text from this image exactly as written. Your entire response should be strictly the extracted text and nothing else. If it's a code snippet, include the code. Do not wrap in markdown boxes." },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimetype || 'image/jpeg'};base64,${base64Image}`
                  }
                }
              ]
            }
          ]
        });
        text = response.choices[0].message.content || '';
      } catch (aiError) {
        console.warn(`[EXTRACTION_DEBUG] OpenAI Vision failed (Quota/Error): ${aiError.message}`);
        text = 'Handwritten text could not be extracted automatically due to system OCR limits. Ensure manual verification.'; // Fake fallback so it doesn't 400 error
      }
    } else if (isPDF) {
      console.log(`[EXTRACTION_DEBUG] Strategy: pdf-parse (PDF)`);
      try {
        const data = await pdf(buffer);
        text = data.text;
        
        // Fallback: If PDF text is empty (scanned PDF), try OCR on the buffer
        if (!text || !text.trim()) {
          console.log(`[EXTRACTION_DEBUG] PDF text empty. OCR on PDF buffer is unsupported, skipping OCR fallback.`);
          text = '';
        }
      } catch (pdfError) {
        console.warn(`[EXTRACTION_DEBUG] pdf-parse failed: ${pdfError.message}`);
        text = '';
      }
    } else if (isWord || isPPT) {
      console.log(`[EXTRACTION_DEBUG] Strategy: officeParser (Word/PPT)`);
      try {
        // officeParser prefers local files, so we ensure it's written locally
        const tempPath = isUrl ? path.join(__dirname, '../uploads', `temp_${Date.now()}${fileExtension}`) : filePath;
        if (isUrl) fs.writeFileSync(tempPath, buffer);
        
        let parsedData;
        try {
          parsedData = await officeParser.parseOffice(tempPath);
        } catch (err) {
          console.error(`[EXTRACTION_DEBUG] officeParser error:`, err);
          throw err;
        }
        text = typeof parsedData === 'string' ? parsedData : (parsedData && typeof parsedData.toText === 'function' ? parsedData.toText() : JSON.stringify(parsedData));
        
        if (isUrl && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch (officeError) {
        console.error(`[EXTRACTION_DEBUG] Office parsing failed:`, officeError.message);
      }
    } else if (mimetype === 'text/plain' || fileExtension === '.txt') {
      text = buffer.toString();
    } else {
      // Final desperation fallback: try reading as text
      console.log(`[EXTRACTION_DEBUG] Unknown type. Attempting buffer string fallback.`);
      text = buffer.toString().replace(/[^\x20-\x7E\n\r\t]/g, ''); // Clean non-printable chars
    }

    const cleanedText = (text || '').trim();
    console.log(`[EXTRACTION_DEBUG] Success. Extracted length: ${cleanedText.length}`);
    return cleanedText;
  } catch (error) {
    console.error('[EXTRACTION_DEBUG] CRITICAL ERROR:', error.message);
    throw new Error('Failed to extract text from file: ' + error.message);
  }
};
