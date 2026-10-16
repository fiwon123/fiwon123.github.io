export interface IcoEntry {
  size: number
  data: Uint8Array
}

export function pngSize(buffer: Uint8Array): { width: number; height: number }
export function buildIco(entries: IcoEntry[]): Buffer
