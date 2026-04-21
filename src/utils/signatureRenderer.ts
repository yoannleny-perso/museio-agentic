
/**
 * Utility for rendering typed signatures as images using canvas
 */
export const renderSignatureToCanvas = (
  text: string, 
  fontClass: string = 'font-signature',
  width: number = 400,
  height: number = 100
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Create a temporary element to get computed font styles
      const tempElement = document.createElement('div');
      tempElement.className = `text-xl ${fontClass}`;
      tempElement.style.position = 'absolute';
      tempElement.style.visibility = 'hidden';
      tempElement.style.fontSize = '24px';
      tempElement.textContent = text;
      
      document.body.appendChild(tempElement);
      
      // Get computed styles
      const computedStyle = window.getComputedStyle(tempElement);
      const fontFamily = computedStyle.fontFamily;
      const fontSize = '24px';
      
      // Clean up temp element
      document.body.removeChild(tempElement);

      // Set canvas styles
      ctx.fillStyle = '#000000';
      ctx.font = `${fontSize} ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Clear canvas with transparent background
      ctx.clearRect(0, 0, width, height);

      // Draw the text
      ctx.fillText(text, width / 2, height / 2);

      // Convert to base64
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Check if a signature needs to be rendered (is text-based)
 */
export const isTypedSignature = (signature: string): boolean => {
  return !signature.startsWith('data:image');
};

/**
 * Get font class name from font value
 */
export const getFontClassName = (fontValue: string): string => {
  const fontMap: Record<string, string> = {
    'font-signature': 'font-signature',
    'font-serif': 'font-serif',
    'font-cursive': 'font-cursive'
  };
  
  return fontMap[fontValue] || 'font-signature';
};
