// Storage quota utilities for checking available space before saving data

export interface StorageEstimate {
  quota: number;      // Total available quota in bytes
  usage: number;      // Currently used storage in bytes
  available: number;  // Available space in bytes
  percentUsed: number; // Percentage of quota used
}

// Minimum required space for operations (1MB)
const MIN_REQUIRED_SPACE = 1 * 1024 * 1024;

/**
 * Check if the Storage Manager API is available
 */
export const isStorageApiAvailable = (): boolean => {
  return 'storage' in navigator && 'estimate' in navigator.storage;
};

/**
 * Get current storage estimate
 * Returns null if API is not available
 */
export const getStorageEstimate = async (): Promise<StorageEstimate | null> => {
  if (!isStorageApiAvailable()) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota ?? 0;
    const usage = estimate.usage ?? 0;
    const available = quota - usage;
    const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;

    return {
      quota,
      usage,
      available,
      percentUsed,
    };
  } catch (error) {
    console.error('Failed to get storage estimate:', error);
    return null;
  }
};

/**
 * Check if there's enough storage space for a given size
 * @param requiredBytes - The amount of space needed in bytes
 * @returns Object with canStore boolean and message
 */
export const checkStorageSpace = async (
  requiredBytes: number = MIN_REQUIRED_SPACE
): Promise<{ canStore: boolean; message: string; estimate: StorageEstimate | null }> => {
  const estimate = await getStorageEstimate();

  // If API is not available, assume we can store (graceful degradation)
  if (!estimate) {
    return {
      canStore: true,
      message: 'Storage API not available - proceeding without check',
      estimate: null,
    };
  }

  // Check if we have enough space
  if (estimate.available < requiredBytes) {
    const availableMB = (estimate.available / (1024 * 1024)).toFixed(2);
    const requiredMB = (requiredBytes / (1024 * 1024)).toFixed(2);
    return {
      canStore: false,
      message: `Insufficient storage space. Available: ${availableMB}MB, Required: ${requiredMB}MB. Please free up some space.`,
      estimate,
    };
  }

  // Warn if storage is getting low (>99% used)
  if (estimate.percentUsed > 99) {
    return {
      canStore: true,
      message: `Warning: Storage is ${estimate.percentUsed}% full. Consider backing up and clearing old data.`,
      estimate,
    };
  }

  return {
    canStore: true,
    message: 'Sufficient storage space available',
    estimate,
  };
};

/**
 * Estimate the size of data in bytes
 * @param data - The data to measure
 * @returns Size in bytes
 */
export const estimateDataSize = (data: unknown): number => {
  try {
    const jsonString = JSON.stringify(data);
    // Multiply by 2 for UTF-16 encoding used in JavaScript strings
    return jsonString.length * 2;
  } catch {
    // If we can't stringify, return a conservative estimate
    return MIN_REQUIRED_SPACE;
  }
};

/**
 * Format bytes to a human-readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
