import { Song } from '../types';

// Heuristic check for a chord-like string
const isChord = (str: string): boolean => {
  if (str.length > 10) return false; // Chords are typically short
  // Permissive regex to catch most chord variations, including slash chords and extensions
  const chordRegex = /^[A-G](b|#)?(m|maj|min|dim|aug|sus|add|M)?[0-9]?(\s*\(.*\))?(\/[A-G](b|#)?)?$/i;
  return chordRegex.test(str.trim());
};

// Check if a line of text consists mostly of chords
const isChordLine = (line: string): boolean => {
  if (!line.trim()) return false;
  const tokens = line.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const chordTokens = tokens.filter(isChord);
  // If more than 70% of tokens look like chords, it's probably a chord line
  return (chordTokens.length / tokens.length) > 0.7;
};

// Merges a chord line and a lyric line into ChordPro format
const convertTwoLineToChordPro = (chordLine: string, lyricLine: string): string => {
    const chords: { text: string; index: number }[] = [];
    const tokenRegex = /(\S+)/g;
    let match;

    while ((match = tokenRegex.exec(chordLine)) !== null) {
        if (isChord(match[0])) {
            chords.push({ text: match[0], index: match.index });
        }
    }

    if (chords.length === 0) return lyricLine;

    const words: { text: string; index: number }[] = [];
    while ((match = tokenRegex.exec(lyricLine)) !== null) {
        words.push({ text: match[0], index: match.index });
    }

    if (words.length === 0) { // Line with only chords
        return chords.map(c => `[${c.text}]`).join(' ');
    }

    let result = lyricLine;
    const insertions: { [key: number]: string } = {}; // Use a map { insertionIndex: "chords" }

    chords.forEach(chord => {
        // Find the first word that starts at or slightly before the chord's position.
        let bestWord = words.find(word => word.index >= chord.index - 2);
        
        // If no word is found starting after the chord, check if it aligns with the last word.
        if (!bestWord && words.length > 0) {
            const lastWord = words[words.length - 1];
            if (chord.index < lastWord.index + lastWord.text.length) {
                bestWord = lastWord;
            }
        }

        const insertionIndex = bestWord ? bestWord.index : lyricLine.length;

        if (insertions[insertionIndex]) {
            // Another chord is already at this position, append.
            insertions[insertionIndex] += `[${chord.text}]`;
        } else {
            insertions[insertionIndex] = `[${chord.text}]`;
        }
    });

    // Apply insertions from the end to the beginning to not mess up indices.
    Object.keys(insertions)
        .map(Number)
        .sort((a, b) => b - a)
        .forEach(index => {
            let textToInsert = insertions[index];
            if (index === lyricLine.length && lyricLine.length > 0 && lyricLine[lyricLine.length - 1] !== ' ') {
                // Add a leading space for trailing chords to separate them from the last word.
                textToInsert = ' ' + textToInsert;
            }
            result = result.slice(0, index) + textToInsert + result.slice(index);
        });

    return result;
};

const separateConcatenatedChords = (line: string): string => {
  // Don't process lines that already have spaces, they are likely formatted correctly
  if (line.includes(' ')) return line; 
  // This regex finds a valid chord pattern.
  const chordRegex = /[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?[0-9]*(?:\(.*\))?(?:\/[A-G](?:#|b)?)?/g;
  const matches = line.match(chordRegex);
  // Re-join with spaces only if multiple chords were found, otherwise return original
  return matches && matches.length > 1 ? matches.join(' ') : line;
};


// Main import function
export const importSongFromPdf = async (file: File): Promise<Partial<Song>> => {
  const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs');

  // Configure the worker provided by a CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  
  let allLines: string[] = [];
  let largestText = { text: '', height: 0 };

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Find largest text on first page for title
    if (pageNum === 1) {
        textContent.items.forEach((item: any) => {
            const height = item.transform[3]; // A simple proxy for font size
            if (height > largestText.height) {
                largestText = { text: item.str, height };
            }
        });
    }
    
    // Group text items into lines based on Y-coordinate
    const lines = new Map<number, { x: number; str: string; width: number }[]>();
    const Y_TOLERANCE = 5;

    textContent.items.forEach((item: any) => {
        const y = Math.round(item.transform[5] / Y_TOLERANCE) * Y_TOLERANCE;
        if (!lines.has(y)) {
            lines.set(y, []);
        }
        lines.get(y)!.push({ x: item.transform[4], str: item.str, width: item.width });
    });

    // Sort lines by Y-coordinate, and text within lines by X-coordinate
    const sortedLines = Array.from(lines.entries())
        .sort((a, b) => b[0] - a[0]) // Sort by Y, descending (top of page first)
        .map(entry => {
            const sortedItems = entry[1].sort((a, b) => a.x - b.x);
            
            if (sortedItems.length === 0) return '';
            
            let lineText = '';
            let lastX_end = 0;
            
            let totalWidth = 0;
            let totalChars = 0;
            sortedItems.forEach(i => {
                if(i.str.length > 0) {
                    totalWidth += i.width;
                    totalChars += i.str.length;
                }
            });
            const avgCharWidth = totalChars > 0 ? totalWidth / totalChars : 4;

            for (const item of sortedItems) {
                if (lastX_end > 0 && item.x > lastX_end) {
                    const gap = item.x - lastX_end;
                    if (gap > avgCharWidth * 0.25) {
                        const spaceCount = Math.max(1, Math.round(gap / avgCharWidth));
                        lineText += ' '.repeat(spaceCount);
                    }
                }
                lineText += item.str;
                lastX_end = item.x + item.width;
            }
            return lineText;
        });
    allLines = allLines.concat(sortedLines);
  }
  
    // --- METADATA PROCESSING ---
    let title: string | undefined = undefined;
    let artist: string | undefined = undefined;
    let key: string | undefined = undefined;
    let capo: number | undefined = undefined;
    const processedLineIndices = new Set<number>();

    if (largestText.height > 0) {
        title = largestText.text.trim();
        const titleIndex = allLines.findIndex(line => line.trim().includes(title!));
        if (titleIndex !== -1) processedLineIndices.add(titleIndex);
    }

    const potentialArtistKeywords = /^(por |by |de |composición de:)/i;
    allLines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine || processedLineIndices.has(index)) return;

        if (title && !artist) {
            const titleIndex = allLines.findIndex(l => l.trim().includes(title!));
            if (index > titleIndex && index < titleIndex + 3) {
                 const isMetadata = /^(capo|tono|key|traste|afinación)/i.test(trimmedLine);
                 if (!isMetadata) {
                    artist = trimmedLine.replace(potentialArtistKeywords, '').trim();
                    processedLineIndices.add(index);
                    return;
                 }
            }
        }
        
        const capoMatch = trimmedLine.match(/^(capo|capo en traste|transportar|transporte|traste)\s*:?\s*(\d+)/i);
        if (capoMatch && capoMatch[2]) {
            capo = parseInt(capoMatch[2], 10);
            processedLineIndices.add(index);
            return;
        }

        const keyMatch = trimmedLine.match(/^(tono|tonalidad|key)\s*:?\s*([A-G](?:#|b)?m?)/i);
        if (keyMatch && keyMatch[2]) {
            key = keyMatch[2];
            processedLineIndices.add(index);
            return;
        }

        if ((title && trimmedLine.toLowerCase() === title.toLowerCase()) || 
            (artist && trimmedLine.toLowerCase().replace(potentialArtistKeywords, '').trim() === artist.toLowerCase())) {
            processedLineIndices.add(index);
            return;
        }
        
        if (/(E\s*A\s*D\s*G\s*B\s*E)/i.test(trimmedLine) || /afinación/i.test(trimmedLine)) {
            processedLineIndices.add(index);
            return;
        }
    });

    const contentLines = allLines.filter((_, index) => !processedLineIndices.has(index));
  
    // --- CHORDPRO BODY PROCESSING ---
    let chordProBody = '';
    let processingStopped = false;
    const sectionKeywords = /^\s*(\[?((intro|refrão|verso|estrofa|coro|puente|final|solo|interlúdio|parte|primeira|segunda|acordes)[^\]]*)]?)\s*$/i;

    for (let i = 0; i < contentLines.length; i++) {
        if (processingStopped) break;

        const currentLine = contentLines[i];
        const trimmedLine = currentLine.trim();

        if (!trimmedLine) {
            chordProBody += '\n';
            continue;
        }
        
        if (/^acordes/i.test(trimmedLine) && trimmedLine.length < 15) {
            processingStopped = true;
            continue;
        }

        const sectionMatch = trimmedLine.match(sectionKeywords);
        if (sectionMatch) {
            let title = sectionMatch[2] || trimmedLine;
            title = title.replace(/[\[\]:]/g, '').trim();
            chordProBody += `# ${title}\n`;
            continue;
        }

        const nextLine = (i + 1 < contentLines.length) ? contentLines[i + 1] : '';
        const trimmedNextLine = nextLine.trim();
        
        const processedCurrentLine = separateConcatenatedChords(trimmedLine);
        
        if (isChordLine(processedCurrentLine) && trimmedNextLine && !isChordLine(trimmedNextLine)) {
            chordProBody += convertTwoLineToChordPro(processedCurrentLine, nextLine) + '\n';
            i++; 
        } else {
            if (isChordLine(processedCurrentLine)) {
                chordProBody += processedCurrentLine.split(/\s+/).filter(Boolean).map(c => `[${c}]`).join(' ') + '\n';
            } else {
                chordProBody += currentLine + '\n';
            }
        }
    }
  
    // Assemble final content with directives at the top
    let finalContent = '';
    if (title) finalContent += `{title: ${title}}\n`;
    if (artist) finalContent += `{artist: ${artist}}\n`;
    if (key) finalContent += `{key: ${key}}\n`;
    if (capo) finalContent += `{capo: ${capo}}\n`;
    if (finalContent) finalContent += '\n';

    finalContent += chordProBody.trim();

    return {
        content: finalContent,
        title,
        artist,
    };
};