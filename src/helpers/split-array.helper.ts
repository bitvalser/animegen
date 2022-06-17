export const splitArray = <T>(array: T[], chunkSize: number): T[][] =>
  Array.from<T>({ length: Math.ceil(array.length / chunkSize) })
    .fill(null)
    .map((_, index) => index * chunkSize)
    .map((begin) => array.slice(begin, begin + chunkSize));
