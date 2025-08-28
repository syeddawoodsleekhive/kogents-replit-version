/**
 * Duplicate File Detection Utilities
 * Handles detection and management of duplicate files
 */

export interface FileIdentifier {
  name: string;
  size: number;
  lastModified: number;
  hash?: string;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateOf?: FileIdentifier;
  reason: 'name_size_time' | 'hash' | 'none';
}

/**
 * Generate a unique identifier for a file
 */
export function generateFileIdentifier(file: File): FileIdentifier {
  return {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
  };
}

/**
 * Generate a more robust identifier using file hash (if available)
 */
export async function generateFileHash(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('Failed to generate file hash:', error);
    return '';
  }
}

/**
 * Check if two files are duplicates based on basic properties
 */
export function areFilesDuplicate(file1: File, file2: File): boolean {
  return (
    file1.name === file2.name &&
    file1.size === file2.size &&
    file1.lastModified === file2.lastModified
  );
}

/**
 * Check if a file is a duplicate of any file in a collection
 */
export function isFileDuplicate(file: File, existingFiles: File[]): boolean {
  return existingFiles.some(existingFile => areFilesDuplicate(file, existingFile));
}

/**
 * Find duplicate files in a collection
 */
export function findDuplicateFiles(files: File[]): Array<{ file: File; duplicates: File[] }> {
  const duplicates: Array<{ file: File; duplicates: File[] }> = [];
  const processed = new Set<number>();

  for (let i = 0; i < files.length; i++) {
    if (processed.has(i)) continue;

    const currentFile = files[i];
    const currentDuplicates: File[] = [];

    for (let j = i + 1; j < files.length; j++) {
      if (processed.has(j)) continue;

      if (areFilesDuplicate(currentFile, files[j])) {
        currentDuplicates.push(files[j]);
        processed.add(j);
      }
    }

    if (currentDuplicates.length > 0) {
      duplicates.push({
        file: currentFile,
        duplicates: currentDuplicates,
      });
      processed.add(i);
    }
  }

  return duplicates;
}

/**
 * Remove duplicate files from a collection
 */
export function removeDuplicateFiles(files: File[]): File[] {
  const uniqueFiles: File[] = [];
  const processed = new Set<string>();

  for (const file of files) {
    const identifier = `${file.name}_${file.size}_${file.lastModified}`;
    
    if (!processed.has(identifier)) {
      uniqueFiles.push(file);
      processed.add(identifier);
    }
  }

  return uniqueFiles;
}

/**
 * Get statistics about duplicates in a file collection
 */
export function getDuplicateStats(files: File[]): {
  totalFiles: number;
  uniqueFiles: number;
  duplicateCount: number;
  duplicateGroups: number;
} {
  const uniqueFiles = removeDuplicateFiles(files);
  const duplicateGroups = findDuplicateFiles(files).length;
  
  return {
    totalFiles: files.length,
    uniqueFiles: uniqueFiles.length,
    duplicateCount: files.length - uniqueFiles.length,
    duplicateGroups,
  };
}

/**
 * Advanced duplicate detection using file content hash
 */
export class AdvancedDuplicateDetector {
  private fileHashes = new Map<string, FileIdentifier>();
  private fileCache = new Map<string, File>();

  /**
   * Add a file to the detector
   */
  async addFile(file: File): Promise<boolean> {
    const identifier = generateFileIdentifier(file);
    const hash = await generateFileHash(file);
    
    if (hash) {
      identifier.hash = hash;
    }

    const key = this.getFileKey(identifier);
    
    if (this.fileHashes.has(key)) {
      return false; // Duplicate detected
    }

    this.fileHashes.set(key, identifier);
    this.fileCache.set(key, file);
    return true; // New file added
  }

  /**
   * Check if a file is a duplicate
   */
  async isDuplicate(file: File): Promise<boolean> {
    const identifier = generateFileIdentifier(file);
    const hash = await generateFileHash(file);
    
    if (hash) {
      identifier.hash = hash;
    }

    const key = this.getFileKey(identifier);
    return this.fileHashes.has(key);
  }

  /**
   * Get all unique files
   */
  getUniqueFiles(): File[] {
    return Array.from(this.fileCache.values());
  }

  /**
   * Clear the detector
   */
  clear(): void {
    this.fileHashes.clear();
    this.fileCache.clear();
  }

  /**
   * Get file key for hash map
   */
  private getFileKey(identifier: FileIdentifier): string {
    if (identifier.hash) {
      return identifier.hash;
    }
    return `${identifier.name}_${identifier.size}_${identifier.lastModified}`;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalFiles: number;
    uniqueFiles: number;
    cacheSize: number;
  } {
    return {
      totalFiles: this.fileHashes.size,
      uniqueFiles: this.fileCache.size,
      cacheSize: this.fileCache.size,
    };
  }
}

/**
 * Create a duplicate detector instance
 */
export function createDuplicateDetector(): AdvancedDuplicateDetector {
  return new AdvancedDuplicateDetector();
}

/**
 * Batch process files to remove duplicates
 */
export async function processFilesForDuplicates(
  files: File[],
  detector: AdvancedDuplicateDetector
): Promise<File[]> {
  const uniqueFiles: File[] = [];

  for (const file of files) {
    const isDuplicate = await detector.isDuplicate(file);
    
    if (!isDuplicate) {
      await detector.addFile(file);
      uniqueFiles.push(file);
    }
  }

  return uniqueFiles;
}

/**
 * Get user-friendly duplicate information
 */
export function getDuplicateInfo(files: File[]): {
  message: string;
  hasDuplicates: boolean;
  duplicateCount: number;
} {
  const stats = getDuplicateStats(files);
  
  if (stats.duplicateCount === 0) {
    return {
      message: 'No duplicate files found',
      hasDuplicates: false,
      duplicateCount: 0,
    };
  }

  return {
    message: `${stats.duplicateCount} duplicate file(s) were automatically removed`,
    hasDuplicates: true,
    duplicateCount: stats.duplicateCount,
  };
} 