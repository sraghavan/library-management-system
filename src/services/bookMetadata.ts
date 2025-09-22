import { BookMetadata } from '../types';
import { cacheService } from './cacheService';

export const extractBookMetadata = async (url: string): Promise<BookMetadata> => {
  // Check cache first
  const cachedMetadata = cacheService.getCachedBookMetadata(url);
  if (cachedMetadata) {
    console.log('Using cached book metadata for:', url);
    return cachedMetadata;
  }

  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    const html = data.contents;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let title = '';
    let author = '';
    let description = '';
    let imageUrl = '';
    let isbn = '';

    if (url.includes('amazon.')) {
      title = doc.querySelector('#productTitle')?.textContent?.trim() ||
             doc.querySelector('h1.a-size-large')?.textContent?.trim() || '';

      author = doc.querySelector('.author .contributorNameID')?.textContent?.trim() ||
              doc.querySelector('.author a')?.textContent?.trim() || '';

      description = doc.querySelector('#feature-bullets ul')?.textContent?.trim() ||
                   doc.querySelector('#bookDescription_feature_div')?.textContent?.trim() || '';

      imageUrl = doc.querySelector('#landingImage')?.getAttribute('src') ||
                doc.querySelector('#ebooksImgBlkFront')?.getAttribute('src') || '';

      const isbnElement = doc.querySelector('[data-asin]');
      isbn = isbnElement?.getAttribute('data-asin') || '';
    } else if (url.includes('goodreads.')) {
      title = doc.querySelector('h1[data-testid="bookTitle"]')?.textContent?.trim() ||
             doc.querySelector('.BookPageTitleSection__title h1')?.textContent?.trim() || '';

      author = doc.querySelector('[data-testid="name"]')?.textContent?.trim() ||
              doc.querySelector('.AuthorLinkSection a')?.textContent?.trim() || '';

      description = doc.querySelector('[data-testid="description"]')?.textContent?.trim() ||
                   doc.querySelector('.BookPageMetadataSection__description')?.textContent?.trim() || '';

      imageUrl = doc.querySelector('.BookCover__image img')?.getAttribute('src') ||
                doc.querySelector('.BookPage__leftColumn img')?.getAttribute('src') || '';
    } else {
      title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
             doc.querySelector('title')?.textContent?.trim() || '';

      author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || '';

      description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                   doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

      imageUrl = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    }

    const metadata: BookMetadata = {
      title: title || 'Unknown Title',
      author: author || 'Unknown Author',
      description: description.substring(0, 500),
      imageUrl: imageUrl || '',
      isbn,
    };

    // Cache the result
    cacheService.cacheBookMetadata(url, metadata);

    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      title: 'Unknown Title',
      author: 'Unknown Author',
      description: 'Unable to extract metadata from URL',
    };
  }
};