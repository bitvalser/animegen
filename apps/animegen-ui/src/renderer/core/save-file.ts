export const saveFile = (content: string) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'application/json' });
  element.href = URL.createObjectURL(file);
  element.download = 'animegen-settings.json';
  element.click();
};
