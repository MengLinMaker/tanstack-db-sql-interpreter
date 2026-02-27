export const clearOpfs = async () => {
  if (!('storage' in navigator) || !navigator.storage.getDirectory) {
    return
  }
  try {
    // @ts-expect-error <not defined>
    await (await navigator.storage.getDirectory()).remove({ recursive: true })
  } catch (e) {
    console.error(e)
  }
}