import fs from 'fs';
import { isBinaryFileSync } from 'isbinaryfile';
import { join } from 'path';

import { EXCLUDED_PATHS } from './config';

const [, , path] = process.argv;
const basePath = join(process.cwd(), path);

const cleanupFilename = (filename: string) => filename.replace(basePath, '');
let jsonLine = '';

const isValidPathname = (pathname: string) => {
  const bytes = fs.readFileSync(pathname);
  const size = fs.lstatSync(pathname).size;
  if (isBinaryFileSync(bytes, size)) return false;

  return !EXCLUDED_PATHS.some((blackListByRegexp) => blackListByRegexp.test(pathname));
};

function readDirectoryAndAddAsJSONLine(sourcePath: string) {
  fs.readdirSync(sourcePath).forEach((file: string) => {
    const nextSourcePath = join(sourcePath, file);
    const isDirectory = fs.lstatSync(nextSourcePath).isDirectory();
    if (isDirectory) {
      readDirectoryAndAddAsJSONLine(nextSourcePath);
    } else if (isValidPathname(nextSourcePath)) {
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
