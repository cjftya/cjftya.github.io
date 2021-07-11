class ResourceLoader {
    constructor() {
        this.__listener = null;
        this.__dataMap = new Map();
        this.__typeMap = [new Map(), new Map()];

        this.__loadedCount = 0;
        this.__totalLoadTime = 0;
    }

    setListener(listener) {
        this.__listener = listener;
        return this;
    }

    add(path, type, threadType) {
        this.__typeMap[threadType].set(path, type);
        return this;
    }

    get(path) {
        return this.__dataMap.get(path);
    }

    getData(type, path) {
        switch (type) {
            case ResourceType.Image:
                return new ImageData(path);
            case ResourceType.Font:
                return new FontData(path);
            case ResourceType.Video:
                return new VideoData(path);
            case ResourceType.Sound:
                return new SoundData(path);
        }
        return null;
    }

    __loadBackground() {
        if (this.__typeMap[ThreadType.Background].size == 0) {
            return;
        }
        const worker = new Worker("../../js/util/framework/resourcemanger/resourceworker.js");
        const imgElements = document.querySelectorAll('img[data-src]');
        imgElements.forEach(imageElement => {
            var imgUrl = imageElement.getAttribute('data-src');
            if (this.__typeMap[ThreadType.Background].get(imgUrl) != null) {
                worker.postMessage(imgUrl);
            }
        })

        worker.addEventListener('message', event => {
            const imageData = event.data;
            const imageElement = document.querySelector(`img[data-src='${imageData.imgUrl}']`);
            const objectURL = URL.createObjectURL(imageData.blob);

            imageElement.onload = () => {
                imageElement.removeAttribute('data-src');
                URL.revokeObjectURL(objectURL);

                if (imageData.imgUrl.indexOf("https://cjftya.github.io/projects/weddingcard/assets/image/viewer") < 0) {
                    var canvas = document.createElement("canvas");
                    canvas.width = imageElement.width;
                    canvas.height = imageElement.height;
                    canvas.getContext('2d').drawImage(imageElement, 0, 0, imageElement.width, imageElement.height);
                    var pixelData = canvas.getContext('2d').getImageData(0, 0, imageElement.width, imageElement.height).data;
                    var p5Image = createImage(imageElement.width, imageElement.height);
                    p5Image.loadPixels();
                    for (var i = 0; i < pixelData.length; i += 4) {
                        p5Image.pixels[i] = pixelData[i];
                        p5Image.pixels[i + 1] = pixelData[i + 1];
                        p5Image.pixels[i + 2] = pixelData[i + 2];
                        p5Image.pixels[i + 3] = pixelData[i + 3];
                    }
                    p5Image.updatePixels();

                    var imgData = new ImageData(null);
                    imgData.setData(ResourceType.Image, imageData.imgUrl, p5Image);
                    this.__dataMap.set(imageData.imgUrl, imgData);
                }
                this.__listener(imageData.imgUrl, ThreadType.Background);
            }
            imageElement.setAttribute('src', objectURL);
        });
    }

    __loadMain() {
        if (this.__typeMap[ThreadType.Main].size == 0) {
            return;
        }
        
        for (var [path, type] of this.__typeMap[ThreadType.Main].entries()) {
            this.__dataMap.set(path, this.getData(type, path));
            this.__listener(path, ThreadType.Main);
        }
    }

    load() {
        this.__loadBackground();
        this.__loadMain();
        return this;
    }
}