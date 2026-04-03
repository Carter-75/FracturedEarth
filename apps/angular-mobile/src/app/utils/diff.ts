/**
 * Performs a shallow (and nested-JSON-friendly) comparison and returns only 
 * the fields that have changed between oldObj and newObj.
 */
export function getDelta<T extends Record<string, any>>(oldObj: T, newObj: T): Partial<T> {
  const delta: Partial<T> = {};
  
  Object.keys(newObj).forEach((key) => {
    const newVal = newObj[key];
    const oldVal = oldObj[key];

    // Use JSON.stringify for deep comparison of metadata/arrays
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      delta[key as keyof T] = newVal;
    }
  });

  return delta;
}
