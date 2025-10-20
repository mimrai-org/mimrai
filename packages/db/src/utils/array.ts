export const unionArray = <T>(
  ...arrays: ((T | null | undefined)[] | null | undefined)[]
): T[] => {
  return Array.from(
    new Set(
      arrays
        .flat()
        .filter((item): item is T => item !== null && item !== undefined)
    )
  );
};
