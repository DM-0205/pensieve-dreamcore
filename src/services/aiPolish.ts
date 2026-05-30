// AI Text Polish Service - Smart text refinement via backend API
// Handles oral speech cleanup, sentence restructuring, and coherence improvement

const FILLER_WORDS_CN = [
  '嗯', '啊', '哦', '呃', '那个', '就是', '然后', '好像', '大概', '可能',
  '其实', '怎么说呢', '你知道', '对吧', '是吧', '这个', '这样',
  'um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically',
];

const REPEAT_PATTERNS = [
  /([一-龥])\1{2,}/g, // Chinese repeated chars (3+)
  /\b(\w+)\s+\1\b/gi, // English repeated words
];

/**
 * Fallback to rudimentary cleaning if AI is unavailable or fails
 */
export function fallbackPolishText(text: string): string {
  let cleaned = text;
  FILLER_WORDS_CN.forEach((filler) => {
    const regex = new RegExp(`[，,、\\s]*${filler}[，,、\\s]*`, 'gi');
    cleaned = cleaned.replace(regex, '，');
  });
  cleaned = cleaned.replace(/[，,]{2,}/g, '，');
  cleaned = cleaned.replace(/[。。]{2,}/g, '。');
  cleaned = cleaned.replace(/^[，,、\\s]+|[，,、\\s]+$/g, '');

  const topicStarters = ['但是', '不过', '然而', '另外', '还有', '其次', '首先', '最后', '总之', '所以', '因为'];
  topicStarters.forEach((starter) => {
    const regex = new RegExp(`([\\u4e00-\\u9fa5])${starter}`, 'g');
    cleaned = cleaned.replace(regex, `$1。${starter}`);
  });

  if (!cleaned.match(/[。.！!？?]$/)) cleaned += '。';
  cleaned = cleaned.replace(/([一-龥]{15,30})(而且|并且|同时|以及)/g, '$1。$2');

  REPEAT_PATTERNS.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, '$1');
  });

  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/[，,]\s*$/g, '。')
    .replace(/[，,][，,\s]+/g, '，')
    .trim();

  if (!cleaned.match(/[。.！!？?]$/)) cleaned += '。';
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return cleaned;
}

export function fallbackSuggestTitle(text: string): string {
  if (!text) return '';
  const keyWords = text
    .replace(/[。，！？、]/g, ' ')
    .split(' ')
    .filter((w) => w.length >= 2 && w.length <= 8)
    .slice(0, 3);
  if (keyWords.length > 0) return keyWords.join(' · ');
  return text.slice(0, 6).replace(/[。，！？]/g, '');
}

export interface PolishResult {
  polished: string;
  title: string;
  fallback?: boolean;
}

/**
 * Single fast operation to generate BOTH polished text and title in one API call.
 * Returns `fallback: true` when the daily limit is exceeded and local processing is used.
 */
export async function processVoiceInput(original: string, idToken?: string): Promise<PolishResult> {
  if (!original || original.trim().length === 0) return { polished: '', title: '' };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const res = await fetch('/api/polish', {
      method: 'POST',
      headers,
      body: JSON.stringify({ original }),
    });

    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      console.warn(`[AI Polish] Daily limit exceeded: ${data.error || '429'}`);
      const fallbackText = fallbackPolishText(original);
      return {
        polished: fallbackText,
        title: fallbackSuggestTitle(fallbackText),
        fallback: true,
      };
    }

    if (!res.ok) {
      console.warn(`AI Polish skipped/failed. Server returned ${res.status}. Falling back to local processing.`);
      const fallbackText = fallbackPolishText(original);
      return {
        polished: fallbackText,
        title: fallbackSuggestTitle(fallbackText)
      };
    }

    const data = await res.json();
    return {
      polished: data.polished?.trim() || fallbackPolishText(original),
      title: data.title?.trim() || fallbackSuggestTitle(data.polished || original)
    };
  } catch (err: any) {
    console.warn("AI process voice input text fallback triggered due to network or fetch error:", err.message);
    const fallbackText = fallbackPolishText(original);
    return {
      polished: fallbackText,
      title: fallbackSuggestTitle(fallbackText)
    };
  }
}

// Keeping original functions for compatibility if used elsewhere,
// but routing them via processVoiceInput or just fallback
export async function polishText(original: string): Promise<string> {
  const result = await processVoiceInput(original);
  return result.polished;
}

export async function suggestTitle(text: string): Promise<string> {
  const result = await processVoiceInput(text);
  return result.title;
}
