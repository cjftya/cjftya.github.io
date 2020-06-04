self.addEventListener('message', async event => {
    const imgUrl = event.data;
    const response = await fetch(imgUrl)
    const blob = await response.blob();

    self.postMessage({
        imgUrl: imgUrl,
        blob: blob,
    });
})