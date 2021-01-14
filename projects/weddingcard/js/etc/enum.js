var ParticleContents = {
    MainTitle: 0
};

var ImageContents = {
    Main: 0,
    Ring: 1
};

var TextContents = {
    Title: 0,
    MainImageTitle: 1,
    WeddingInfo: 2,
    Invitation: 3,
    InvitationLetter: 4,
    Gallery: 5,
    Location: 6,
    ShortcutNaver: 7,
    ThankYou: 8,
    Address: 9,
    Notice: 10
};

var ResourcePath = {
    // image
    MainImage: "https://cjftya.github.io/projects/weddingcard/assets/image/main.jpg",
    DynamicTextFrameImage: "https://cjftya.github.io/projects/weddingcard/assets/image/dynamictextframe.jpg",
    MapImage: "https://cjftya.github.io/projects/weddingcard/assets/image/map.jpg",
    RingImage: "https://cjftya.github.io/projects/weddingcard/assets/image/ring.jpg",
    GalleryMainImage: "https://cjftya.github.io/projects/weddingcard/assets/image/gallery_main.jpg",
    SlideShow1Image: "https://cjftya.github.io/projects/weddingcard/assets/image/slideshow/s1.jpg",
    SlideShow2Image: "https://cjftya.github.io/projects/weddingcard/assets/image/slideshow/s2.jpg",
    SlideShow3Image: "https://cjftya.github.io/projects/weddingcard/assets/image/slideshow/s3.jpg",
    SlideShow4Image: "https://cjftya.github.io/projects/weddingcard/assets/image/slideshow/s4.jpg",
    SlideShow5Image: "https://cjftya.github.io/projects/weddingcard/assets/image/slideshow/s5.jpg",
    SlideShow6Image: "https://cjftya.github.io/projects/weddingcard/assets/image/slideshow/s6.jpg",

    // font
    UserFont: "assets/font/DXLBaB-KSCpc-EUC-H.ttf"
};

class __ImageMetaData {
    constructor() {
        this.__metaMap = new Map();
        this.__metaMap.set(ResourcePath.MainImage, [450, 675]);
        this.__metaMap.set(ResourcePath.DynamicTextFrameImage, [405, 698]);
        this.__metaMap.set(ResourcePath.MapImage, [1665, 890]);
        this.__metaMap.set(ResourcePath.RingImage, [420, 204]);
        this.__metaMap.set(ResourcePath.GalleryMainImage, [600, 500]);
        this.__metaMap.set(ResourcePath.SlideShow1Image, [600, 500]);
        this.__metaMap.set(ResourcePath.SlideShow2Image, [600, 500]);
        this.__metaMap.set(ResourcePath.SlideShow3Image, [600, 500]);
        this.__metaMap.set(ResourcePath.SlideShow4Image, [600, 500]);
        this.__metaMap.set(ResourcePath.SlideShow5Image, [600, 500]);
        this.__metaMap.set(ResourcePath.SlideShow6Image, [600, 500]);
    }

    getMeta(path) {
        return this.__metaMap.get(path);
    }
}

var ImageMeta = new __ImageMetaData();