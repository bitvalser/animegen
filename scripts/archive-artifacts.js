const fs = require('fs');
const archiver = require('archiver');

const output = fs.createWriteStream(process.argv[2] + '.zip');
const archive = archiver('zip');
output.on('close', function () {
  console.log(archive.pointer() + ' total bytes');
  console.log('archiver has been finalized and the output file descriptor has closed.');
});
output.on('end', function () {
  console.log('Data has been drained');
});
archive.on('error', function (err) {
  throw err;
});
archive.pipe(output);
archive.directory(process.argv[2], false);
archive.finalize();
