var ParticleContents = {
    MainTitle: 0,
    SlideShow1: 1,
    SlideShow2: 2,
    SlideShow3: 3
};

var ImageContents = {
    Main: 0,
    ManFaceImage: 1,
    WomenFaceImage: 2,
    DayCounter: 3
};

var TextContents = {
    Title: 0,
    MainImageTitle: 1,
    DayCounter: 2,
    DDayLabel: 3,
    WeddingInfo: 4,
    Invitation: 5,
    InvitationLetter: 6,
    Gallery: 7,
    Location: 8,
    ShortcutNaver: 9,
    SubwayInfo: 10,
    BusInfo: 11,
    CarInfo: 12,
    ThankYou: 13,
    Address: 14
};

var ResourcePath = {
    MainImage: "https://cjftya.github.io/projects/weddingcard/assets/main.jpg",
    DynamicTextFrameImage: "https://cjftya.github.io/projects/weddingcard/assets/dynamictextframe.jpg",
    MapImage: "https://cjftya.github.io/projects/weddingcard/assets/map.jpg",
    ManFaceImage: "https://cjftya.github.io/projects/weddingcard/assets/face1.png",
    ManFaceMaskImage: "https://cjftya.github.io/projects/weddingcard/assets/mask/face_mask.png",
    WomenFaceImage: "https://cjftya.github.io/projects/weddingcard/assets/face2.png",
    DayCounterImage: "https://cjftya.github.io/projects/weddingcard/assets/ring.jpg",
    RingMaskImage: "https://cjftya.github.io/projects/weddingcard/assets/mask/ring_mask.png",
    SlideShowMaskImage: "https://cjftya.github.io/projects/weddingcard/assets/mask/slideshow_mask.png",
    SlideShow1Image: "https://cjftya.github.io/projects/weddingcard/assets/slideshow/s1.jpg",
    SlideShow2Image: "https://cjftya.github.io/projects/weddingcard/assets/slideshow/s2.jpg",
    SlideShow3Image: "https://cjftya.github.io/projects/weddingcard/assets/slideshow/s3.jpg",
    SlideShow4Image: "https://cjftya.github.io/projects/weddingcard/assets/slideshow/s4.jpg",
    SlideShow5Image: "https://cjftya.github.io/projects/weddingcard/assets/slideshow/s5.jpg",
    SlideShow6Image: "https://cjftya.github.io/projects/weddingcard/assets/slideshow/s6.jpg",
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
        this.__metaMap.set(ResourcePath.DayCounterImage, [1000, 809]);
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