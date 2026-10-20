/**
 * Browser-side: scales a photo or logo down so uploads stay small and fast.
 * PNGs stay PNGs so transparent logos keep their transparency.
 */
export async function shrinkImage(file: File, maxSize: number): Promise<{ blob: Blob; name: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const png = file.type === "image/png";
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), png ? "image/png" : "image/jpeg", 0.85),
  );
  return { blob, name: png ? "image.png" : "image.jpg" };
}
