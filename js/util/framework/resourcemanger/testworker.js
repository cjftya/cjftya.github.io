self.addEventListener('message', async event => {
    canvas = event.data.canvas;
    context = canvas.getContext('2d');
    const img = await createImageBitmap(event.data.blob);
    context.drawImage(img, 0, 0, img.width, img.height);
    var pData = await context.getImageData(0, 0, img.width, img.height).data;

    self.postMessage({
        pixelData: pData
    });
});