import log from 'electron-log';

log.transports.file.level = 'info';
log.transports.file.resolvePath = () => './app.log';
const _originalConsole = console.log;
const _originalError = console.error;
console.log = (...args) => {
  log.info(...args);
  _originalConsole(...args);
};
console.error = (...args) => {
  log.error(...args);
  _originalError(...args);
};
