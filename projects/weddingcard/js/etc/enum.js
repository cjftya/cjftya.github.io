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
    GalleryMainImage: "https://cjftya.github.io/projects/weddingcard/assets/image/gallery_main.png",

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
        this.__metaMap.set(ResourcePath.GalleryMainImage, [500, 653]);
    }

    getMeta(path) {
        return this.__metaMap.get(path);
    }
}

var ImageMeta = new __ImageMetaData();