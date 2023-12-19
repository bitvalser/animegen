export const readFile = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    var reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    if (file) {
      reader.readAsText(file);
    }
  });
