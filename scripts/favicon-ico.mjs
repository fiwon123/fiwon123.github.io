// Pure helpers for the favicon set — no Chrome, no file I/O — so the packing and
// size-reading logic can be unit-tested on a machine with no browser.
//
// The ICO container is the "PNG-in-ICO" form every current browser accepts: a
// 6-byte directory header, one 16-byte entry per image, then the PNG bytes.

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/**
 * Read a PNG's pixel dimensions from its IHDR chunk. Throws on anything that is
 * not a PNG, so a wrong-sized raster can never be packed or written silently.
 *
 * @param {Buffer | Uint8Array} buffer
 * @returns {{ width: number, height: number }}
 */
export function pngSize(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('pngSize: not a PNG (bad signature)')
  }
  if (buf.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('pngSize: not a PNG (missing IHDR)')
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

/**
 * Pack PNG images into a single ICO. Each entry must be `{ size, data }`, and the
 * PNG's real dimensions must match `size` — a mismatch is a bug worth failing on,
 * not a file worth shipping.
 *
 * @param {{ size: number, data: Buffer | Uint8Array }[]} entries
 * @returns {Buffer}
 */
export function buildIco(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('buildIco: needs at least one image')
  }

  const images = entries
    .map(({ size, data }) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
      const { width, height } = pngSize(buf)
      if (width !== size || height !== size) {
        throw new Error(`buildIco: entry ${size} is ${width}x${height}, not ${size}x${size}`)
      }
      return { size, data: buf }
    })
    .sort((a, b) => a.size - b.size)

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)

  const directory = Buffer.alloc(16 * images.length)
  let offset = header.length + directory.length
  images.forEach((image, index) => {
    const base = index * 16
    // A dimension of 256 is stored as 0 in ICO.
    const dimension = image.size >= 256 ? 0 : image.size
    directory.writeUInt8(dimension, base)
    directory.writeUInt8(dimension, base + 1)
    directory.writeUInt8(0, base + 2) // palette count
    directory.writeUInt8(0, base + 3) // reserved
    directory.writeUInt16LE(1, base + 4) // colour planes
    directory.writeUInt16LE(32, base + 6) // bits per pixel
    directory.writeUInt32LE(image.data.length, base + 8)
    directory.writeUInt32LE(offset, base + 12)
    offset += image.data.length
  })

  return Buffer.concat([header, directory, ...images.map((image) => image.data)])
}
