export function resizeSvg(svg: string, size: number): string {
  return svg
    .replace(/width="\d+"/, `width="${size}"`)
    .replace(/height="\d+"/, `height="${size}"`);
}
