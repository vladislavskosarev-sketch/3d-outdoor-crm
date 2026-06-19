const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, 'build', 'icon.png');
const icoPath = path.join(__dirname, 'build', 'icon.ico');

if (!fs.existsSync(pngPath)) {
  console.error('Error: build/icon.png not found! Run the copy task first.');
  process.exit(1);
}

try {
  console.log('Reading build/icon.png...');
  const pngBuffer = fs.readFileSync(pngPath);

  console.log('Writing build/icon.ico...');
  // 1. Create a 6-byte ICO Header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved: must be 0
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(1, 4); // Number of images in file: 1

  // 2. Create a 16-byte Icon Directory Entry
  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0); // Width: 0 means 256
  entry.writeUInt8(0, 1); // Height: 0 means 256
  entry.writeUInt8(0, 2); // Color Count: 0 (no palette)
  entry.writeUInt8(0, 3); // Reserved: must be 0
  entry.writeUInt16LE(1, 4); // Color Planes: 1
  entry.writeUInt16LE(32, 6); // Bits per pixel: 32 (RGBA)
  entry.writeUInt32LE(pngBuffer.length, 8); // Size of the PNG image data
  entry.writeUInt32LE(22, 12); // Offset of PNG image data (6 + 16 = 22)

  // 3. Combine parts and write file
  const icoBuffer = Buffer.concat([header, entry, pngBuffer]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('Success! Created build/icon.ico from build/icon.png.');
} catch (e) {
  console.error('Failed to convert icon:', e);
  process.exit(1);
}
