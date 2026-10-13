/**
 * Deeply sanitizes objects and arrays before writing to Firebase Firestore.
 * Firestore throws a runtime TypeError / unsupported field value error if ANY key in an
 * object or array contains `undefined`.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data;
  }

  // Handle Arrays: sanitize each element and replace any undefined with null
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (item === undefined) return null;
      return sanitizeForFirestore(item);
    }) as any;
  }

  // Handle plain objects: strip keys with undefined values
  const cleanObj: Record<string, any> = {};
  for (const [key, val] of Object.entries(data as Record<string, any>)) {
    if (val !== undefined) {
      cleanObj[key] = sanitizeForFirestore(val);
    }
  }
  return cleanObj as T;
}
