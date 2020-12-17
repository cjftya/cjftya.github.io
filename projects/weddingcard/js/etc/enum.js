var ParticleContents = {
    MainTitle: 0
};

var ImageContents = {
    Main: 0,
    ManFace: 1,
    WomenFace: 2,
    Ring: 3
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
    Address: 9
};

var ResourcePath = {
    // image
    MainImage: "https://cjftya.github.io/projects/weddingcard/assets/image/main.jpg",
    DynamicTextFrameImage: "https://cjftya.github.io/projects/weddingcard/assets/image/dynamictextframe.jpg",
    MapImage: "https://cjftya.github.io/projects/weddingcard/assets/image/map.jpg",
    ManFaceImage: "https://cjftya.github.io/projects/weddingcard/assets/image/face1.png",
    ManFaceMaskImage: "https://cjftya.github.io/projects/weddingcard/assets/image/mask/face_mask.png",
    WomenFaceImage: "https://cjftya.github.io/projects/weddingcard/assets/image/face2.png",
    RingImage: "https://cjftya.github.io/projects/weddingcard/assets/image/ring.jpg",
    RingMaskImage: "https://cjftya.github.io/projects/weddingcard/assets/image/mask/ring_mask.png",
    SlideShowMaskImage: "https://cjftya.github.io/projects/weddingcard/assets/image/mask/slideshow_mask.png",
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
        this.__metaMap.set(ResourcePath.MainImage, [1500, 2250]);
        this.__metaMap.set(ResourcePath.DynamicTextFrameImage, [1300, 814]);
        this.__metaMap.set(ResourcePath.MapImage, [1441, 909]);
        this.__metaMap.set(ResourcePath.ManFaceImage, [480, 480]);
        this.__metaMap.set(ResourcePath.WomenFaceImage, [480, 480]);
        this.__metaMap.set(ResourcePath.ManFaceMaskImage, [480, 480]);
        this.__metaMap.set(ResourcePath.RingImage, [1000, 809]);
        this.__metaMap.set(ResourcePath.RingMaskImage, [400, 400]);
        this.__metaMap.set(ResourcePath.SlideShowMaskImage, [700, 700]);
        this.__metaMap.set(ResourcePath.SlideShow1Image, [1000, 1000]);
        this.__metaMap.set(ResourcePath.SlideShow2Image, [1000, 1000]);
        this.__metaMap.set(ResourcePath.SlideShow3Image, [1000, 1000]);
        this.__metaMap.set(ResourcePath.SlideShow4Image, [1000, 1000]);
        this.__metaMap.set(ResourcePath.SlideShow5Image, [1000, 1000]);
        this.__metaMap.set(ResourcePath.SlideShow6Image, [1000, 1000]);
    }

    getMeta(path) {
        return this.__metaMap.get(path);
    }
}

var ImageMeta = new __ImageMetaData();