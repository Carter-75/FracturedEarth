/**
 * Performs a shallow comparison and returns only the fields that have changed.
 * If a field is an object (like metadata), it handles it generically.
 */
export function getDelta<T extends Record<string, any>>(oldObj: T, newObj: T): Partial<T> {
  const delta: Partial<T> = {};
  
  Object.keys(newObj).forEach((key) => {
    const newVal = newObj[key];
    const oldVal = oldObj[key];

    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      delta[key as keyof T] = newVal;
    }
  });

  return delta;
}
