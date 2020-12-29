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

    __loadBackground3() {
        document.addEventListener("DOMContentLoaded", function () {
            var lazyloadImages = document.querySelectorAll("img.lazy");
            var lazyloadThrottleTimeout;
            console.log(lazyloadImages)

            function lazyload() {
                if (lazyloadThrottleTimeout) {
                    clearTimeout(lazyloadThrottleTimeout);
                }

                lazyloadThrottleTimeout = setTimeout(function () {
                    var scrollTop = window.pageYOffset;
                    lazyloadImages.forEach(function (img) {
                        if (img.offsetTop < (window.innerHeight + scrollTop)) {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                        }
                    });
                    if (lazyloadImages.length == 0) {
                        document.removeEventListener("scroll", lazyload);
                        window.removeEventListener("resize", lazyload);
                        window.removeEventListener("orientationChange", lazyload);
                    }
                }, 20);
            }
            document.addEventListener("scroll", lazyload);
            window.addEventListener("resize", lazyload);
            window.addEventListener("orientationChange", lazyload);
        });
    }

    __loadBackground2() {
        const worker = new Worker("../../js/util/framework/resourcemanger/testworker.js");
        const el = document.querySelector(`img[tag-set]`);
        const list = this.__listener;
        const map = this.__dataMap;

        const observer = lozad('.lozad', {
            loaded: function(el) {
                console.log(el);
            //    el.setAttribute('style', 'display: none;');
                var canvas = document.createElement("canvas");
                canvas.width = el.width;
                canvas.height = el.height;
                canvas.getContext('2d').drawImage(el, 0, 0, el.width, el.height);
                var url = el.getAttribute('data-src');
                console.log(url);
                // alert("aaa");

                var p5Image = createImage(el.width, el.height);
                // alert(el.width);
                el.setAttribute('style', 'display: none;');
                worker.postMessage(null);
                worker.addEventListener('message', event => {
                    let start = new Date();
                    var pixelData = canvas.getContext('2d').getImageData(0, 0, el.width, el.height).data;
                    console.log(pixelData.length);

                    p5Image.loadPixels();
                    for (var i = 0; i < pixelData.length; i += 4) {
                        p5Image.pixels[i] = pixelData[i];
                        p5Image.pixels[i + 1] = pixelData[i + 1];
                        p5Image.pixels[i + 2] = pixelData[i + 2];
                        p5Image.pixels[i + 3] = pixelData[i + 3];
                    }
                    // p5Image.pixels = pixelData;
                    p5Image.updatePixels();

                    let end = new Date();
                    console.log("time : " + (end - start));
                    TopicManager.ready().publish(TOPICS.TEST_SET, "asdsad");

                    var imgData = new ImageData(null);
                    imgData.setData(ResourceType.Image, url, p5Image);
                    map.set(url, imgData);
                    list(url, ThreadType.Background);
                });
            }
        });
        observer.observe();
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

            var canvas = document.createElement("canvas");
            imageElement.onload = () => {
                imageElement.removeAttribute('data-src');
                URL.revokeObjectURL(objectURL);

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