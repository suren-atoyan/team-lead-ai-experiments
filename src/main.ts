import fs from 'fs';
import { join } from 'path';
import { isBinaryFileSync } from 'isbinaryfile';

const [$, _, path] = process.argv;
const basePath = join(process.cwd(), path);

const cleanupFilename = (filename: string) => filename.replace(basePath, '');
let jsonLine = '';

function readDirectoryAndAddAsJSONLine(sourcePath: string) {
  fs
  .readdirSync(sourcePath)
  .forEach(file => {
    const nextSourcePath = join(sourcePath, file);
    const isDirectory = fs.lstatSync(nextSourcePath).isDirectory();
    if (isDirectory) {
      readDirectoryAndAddAsJSONLine(nextSourcePath);
    } else {
      const bytes = fs.readFileSync(nextSourcePath);
      const size = fs.lstatSync(nextSourcePath).size;
      if (isBinaryFileSync(bytes, size)) return; 

      jsonLine = `${jsonLine}
      ${JSON.stringify({
        prompt: `content of ${cleanupFilename(nextSourcePath)}`,
        completion: fs.readFileSync(nextSourcePath, 'utf8'),
      })}`;
    }
  });
}

readDirectoryAndAddAsJSONLine(basePath);

fs.writeFileSync('./data.jsonl', jsonLine);
