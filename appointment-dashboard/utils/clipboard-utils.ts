/**
 * Clipboard Utilities
 * Handles copy/paste functionality for files and images
 */

export interface ClipboardFile {
  file: File;
  source: 'clipboard' | 'dragdrop';
  timestamp: number;
}

/**
 * Extract files from clipboard data
 */
export function extractFilesFromClipboard(clipboardData: DataTransfer): File[] {
  const files: File[] = [];
  
  console.log('Extracting files from clipboard:', {
    hasFiles: !!clipboardData.files,
    filesLength: clipboardData.files?.length || 0,
    hasItems: !!clipboardData.items,
    itemsLength: clipboardData.items?.length || 0,
    types: Array.from(clipboardData.types || [])
  });
  
  // Handle files from clipboard
  if (clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const file = clipboardData.files[i];
      if (file && file.size > 0) {
        console.log('Found file in clipboard.files:', file.name, file.size, file.type);
        files.push(file);
      }
    }
  }
  
  // Handle items from clipboard (for images copied from web/browser)
  if (clipboardData.items && clipboardData.items.length > 0) {
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      console.log('Processing clipboard item:', item.kind, item.type);
      
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && file.size > 0) {
          console.log('Found file in clipboard.items:', file.name, file.size, file.type);
          files.push(file);
        }
      }
    }
  }
  
  console.log('Total files extracted:', files.length);
  return files;
}

/**
 * Check if clipboard contains files
 */
export function hasFilesInClipboard(clipboardData: DataTransfer): boolean {
  return (
    (clipboardData.files && clipboardData.files.length > 0) ||
    (clipboardData.items && Array.from(clipboardData.items).some(item => item.kind === 'file'))
  );
}

/**
 * Get clipboard content type
 */
export function getClipboardContentType(clipboardData: DataTransfer): 'files' | 'text' | 'mixed' | 'none' {
  const hasFiles = hasFilesInClipboard(clipboardData);
  const hasText = clipboardData.types.includes('text/plain') || clipboardData.types.includes('text/html');
  
  if (hasFiles && hasText) return 'mixed';
  if (hasFiles) return 'files';
  if (hasText) return 'text';
  return 'none';
}

/**
 * Create a file from clipboard image data
 */
export async function createFileFromClipboardImage(
  clipboardData: DataTransfer,
  filename: string = 'clipboard-image.png'
): Promise<File | null> {
  try {
    // Try to get image from clipboard items
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          return file;
        }
      }
    }
    
    // Try to get image from files
    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        if (file.type.startsWith('image/')) {
          return file;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error creating file from clipboard image:', error);
    return null;
  }
}

/**
 * Check if clipboard contains image data
 */
export function hasImageInClipboard(clipboardData: DataTransfer): boolean {
  // Check items for image types
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i];
    if (item.type.startsWith('image/')) {
      return true;
    }
  }
  
  // Check files for image types
  if (clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const file = clipboardData.files[i];
      if (file.type.startsWith('image/')) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get supported clipboard formats
 */
export function getSupportedClipboardFormats(): string[] {
  const formats: string[] = [];
  
  if (navigator.clipboard && navigator.clipboard.read) {
    formats.push('modern-clipboard');
  }
  
  // Check for legacy clipboard support (deprecated but still used in some browsers)
  try {
    if (document.queryCommandSupported('paste')) {
      formats.push('legacy-clipboard');
    }
  } catch (error) {
    // Ignore errors for deprecated API
  }
  
  return formats;
}

/**
 * Check if clipboard API is supported
 */
export function isClipboardSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    navigator.clipboard !== undefined &&
    typeof navigator.clipboard.read === 'function'
  );
}

/**
 * Read clipboard content using modern API
 */
export async function readClipboardModern(): Promise<ClipboardItem[]> {
  if (!isClipboardSupported()) {
    throw new Error('Modern clipboard API not supported');
  }
  
  try {
    return await navigator.clipboard.read();
  } catch (error) {
    console.error('Error reading clipboard:', error);
    throw error;
  }
}

/**
 * Read clipboard text
 */
export async function readClipboardText(): Promise<string> {
  if (!isClipboardSupported()) {
    throw new Error('Modern clipboard API not supported');
  }
  
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    console.error('Error reading clipboard text:', error);
    throw error;
  }
}

/**
 * Write text to clipboard
 */
export async function writeClipboardText(text: string): Promise<void> {
  if (!isClipboardSupported()) {
    throw new Error('Modern clipboard API not supported');
  }
  
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Error writing to clipboard:', error);
    throw error;
  }
}

/**
 * Write files to clipboard
 */
export async function writeClipboardFiles(files: File[]): Promise<void> {
  if (!isClipboardSupported()) {
    throw new Error('Modern clipboard API not supported');
  }
  
  try {
    const clipboardItems = files.map(file => {
      return new ClipboardItem({
        [file.type]: file
      });
    });
    
    await navigator.clipboard.write(clipboardItems);
  } catch (error) {
    console.error('Error writing files to clipboard:', error);
    throw error;
  }
} 