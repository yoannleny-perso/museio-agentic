interface MetadataResult {
  title?: string;
  description?: string;
  image?: string;
  site_name?: string;
  eventName?: string;
  eventDate?: string;
  artist?: string;
}

const extractDateFromText = (text: string): string | null => {
  // Common date patterns for events
  const datePatterns = [
    // ISO format: 2024-12-25
    /(\d{4}-\d{2}-\d{2})/,
    // US format: December 25, 2024 or Dec 25, 2024
    /(\w+\s+\d{1,2},?\s+\d{4})/,
    // European format: 25 December 2024 or 25 Dec 2024
    /(\d{1,2}\s+\w+\s+\d{4})/,
    // Slash format: 12/25/2024 or 25/12/2024
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    // Dot format: 25.12.2024
    /(\d{1,2}\.\d{1,2}\.\d{4})/
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[1];
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      }
    }
  }
  return null;
};

const detectPlatform = (url: string): string | null => {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('apple.com') || url.includes('music.apple.com')) return 'apple';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  if (url.includes('beatport.com')) return 'beatport';
  return null;
};

const extractMusicMetadata = (html: string, platform: string | null): { title?: string; artist?: string } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  let title = '';
  let artist = '';

  // Platform-specific extraction
  switch (platform) {
    case 'spotify':
      // Spotify uses specific meta tags and structured data
      title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
      artist = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
      // Clean up Spotify format "Song · Artist"
      if (title.includes(' · ')) {
        const parts = title.split(' · ');
        title = parts[0];
        artist = parts[1] || artist;
      }
      break;
    
    case 'soundcloud':
      title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
      // SoundCloud often has "Track by Artist" format
      if (title.includes(' by ')) {
        const parts = title.split(' by ');
        title = parts[0];
        artist = parts[1];
      }
      break;
    
    case 'youtube':
      title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
      // Try to extract artist from common YouTube formats
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length >= 2) {
          artist = parts[0];
          title = parts.slice(1).join(' - ');
        }
      }
      break;
    
    default:
      // Generic extraction
      title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
              doc.querySelector('title')?.textContent || '';
      break;
  }

  // Clean up title and artist
  title = title.replace(/\s*-\s*(Official Video|Official Audio|Lyrics?).*$/i, '').trim();
  artist = artist.replace(/\s*-\s*(Topic|Official).*$/i, '').trim();

  return { title: title || undefined, artist: artist || undefined };
};

export const extractUrlMetadata = async (url: string): Promise<MetadataResult | null> => {
  try {
    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      return null;
    }

    const platform = detectPlatform(url);

    // For client-side, we'll use a simple fetch with CORS proxy or rely on backend
    // For now, we'll use a simple approach that works for many sites
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (!data.contents) {
      return null;
    }

    const html = data.contents;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract Open Graph metadata
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
    const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');

    // Extract music-specific metadata
    const musicMetadata = extractMusicMetadata(html, platform);

    // Fallback to regular meta tags
    const title = musicMetadata.title || ogTitle || doc.querySelector('title')?.textContent;
    const description = ogDescription || doc.querySelector('meta[name="description"]')?.getAttribute('content');

    // Extract event-specific data
    let eventName = title;
    let eventDate = null;

    // Try to extract date from structured data (JSON-LD)
    const jsonLdScript = doc.querySelector('script[type="application/ld+json"]');
    if (jsonLdScript && jsonLdScript.textContent) {
      try {
        const jsonData = JSON.parse(jsonLdScript.textContent);
        if (jsonData['@type'] === 'Event' || (Array.isArray(jsonData) && jsonData.some(item => item['@type'] === 'Event'))) {
          const eventData = Array.isArray(jsonData) ? jsonData.find(item => item['@type'] === 'Event') : jsonData;
          if (eventData.startDate) {
            const date = new Date(eventData.startDate);
            if (!isNaN(date.getTime())) {
              eventDate = date.toISOString().split('T')[0];
            }
          }
          if (eventData.name) {
            eventName = eventData.name;
          }
        }
      } catch (e) {
        // Continue with other methods if JSON-LD parsing fails
      }
    }

    // If no structured data, try to extract date from page content
    if (!eventDate) {
      const pageText = doc.body?.textContent || '';
      eventDate = extractDateFromText(pageText);
    }

    // Clean up event name (remove common suffixes/prefixes)
    if (eventName) {
      eventName = eventName
        .replace(/\s*-\s*(Tickets|Eventbrite|Facebook|Event).*$/i, '')
        .replace(/^(Event:\s*|Tickets:\s*)/i, '')
        .trim();
    }

    return {
      title,
      description,
      image: ogImage,
      site_name: ogSiteName,
      eventName,
      eventDate,
      // Add music-specific metadata
      artist: musicMetadata.artist
    };
  } catch (error) {
    console.error('Error extracting URL metadata:', error);
    return null;
  }
};