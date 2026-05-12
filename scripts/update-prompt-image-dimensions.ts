import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type ImageSize = {
  width: number;
  height: number;
};

const imageRoot = path.join(process.cwd(), 'public', 'prompt-covers');
const outputPath = path.join(
  process.cwd(),
  '.tmp',
  'update-prompt-image-dimensions.sql'
);

function isJpegStartOfFrame(marker: number) {
  return (
    marker >= 0xc0 &&
    marker <= 0xcf &&
    marker !== 0xc4 &&
    marker !== 0xc8 &&
    marker !== 0xcc
  );
}

function readJpegSize(buffer: Buffer): ImageSize | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset + 4 < buffer.length) {
    while (buffer[offset] === 0xff) offset += 1;

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) return null;

    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) return null;

    if (isJpegStartOfFrame(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += length;
  }

  return null;
}

function readPngSize(buffer: Buffer): ImageSize | null {
  const pngSignature = '89504e470d0a1a0a';
  if (
    buffer.length < 24 ||
    buffer.subarray(0, 8).toString('hex') !== pngSignature
  ) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readImageSize(buffer: Buffer): ImageSize | null {
  return readJpegSize(buffer) ?? readPngSize(buffer);
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
    })
  );

  return files.flat();
}

function sql(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function toPublicPath(filePath: string) {
  return `/${path.relative(path.join(process.cwd(), 'public'), filePath).replaceAll(path.sep, '/')}`;
}

async function main() {
  const files = (await listFiles(imageRoot)).filter((file) =>
    file.toLowerCase().endsWith('.jpg')
  );
  const statements = ['BEGIN TRANSACTION;'];
  let updated = 0;

  for (const file of files) {
    const size = readImageSize(await readFile(file));
    if (!size) {
      console.warn(`Skipped unreadable image: ${file}`);
      continue;
    }

    const publicPath = toPublicPath(file);
    statements.push(
      [
        'UPDATE `prompt_images`',
        `SET \`width\` = ${size.width}, \`height\` = ${size.height}`,
        `WHERE \`url\` = ${sql(publicPath)} OR \`thumb_url\` = ${sql(publicPath)};`,
      ].join(' ')
    );
    updated += 1;
  }

  statements.push('COMMIT;');

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${statements.join('\n')}\n`);

  console.log(`Wrote ${updated} image dimension updates to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
