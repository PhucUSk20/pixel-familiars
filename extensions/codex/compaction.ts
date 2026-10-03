import { BODY_W, canvas, type Canvas } from '../../plugins/pixel-pet/hooks/pixels'

/** Rest the pet in a small steaming bath while a real compaction event is active. */
export function compactionBath(picture: Canvas, dir: 1 | -1, ms: number): Canvas {
  const bath = canvas(picture.w, picture.h)
  bath.px = [...picture.px]
  const left = dir === 1 ? picture.w - BODY_W : 0
  const put = (x: number, y: number, color: number) => {
    if (x >= 0 && x < bath.w && y >= 0 && y < bath.h) bath.px[y * bath.w + x] = color
  }
  for (let x = 1; x < BODY_W - 1; x++) {
    put(left + x, 16, 0x9ad2ff)
    put(left + x, 17, 0x508eb4)
    put(left + x, 18, 0x78838c)
    put(left + x, 19, 0x4c5964)
  }
  const drift = Math.floor(ms / 500) % 2
  for (const x of [4, 9, 14]) {
    put(left + x + drift, 3, 0xb6c1c9)
    put(left + x, 2, 0xe3f4ff)
    put(left + x + 1 - drift, 1, 0xb6c1c9)
  }
  return bath
}
