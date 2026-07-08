var FrameCounter = {
    Fps60: 0,
    Fps120: 1
};

var ParticleContents = {
    MainTitle: 0,
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
    MainImage: "assets/private/image/main.jpg.bin",
    DynamicTextFrameImage: "assets/private/image/dynamictextframe.jpg.bin",
    MapImage: "assets/private/image/map.jpg.bin",
    RingImage: "assets/private/image/ring.jpg.bin",
    GalleryMainImage: "assets/private/image/gallery_main.png.bin",
    Thumbnail1: "assets/private/image/viewer/thumb1.jpg.bin",
    Thumbnail2: "assets/private/image/viewer/thumb2.jpg.bin",
    Thumbnail3: "assets/private/image/viewer/thumb3.jpg.bin",
    Thumbnail4: "assets/private/image/viewer/thumb4.jpg.bin",
    Thumbnail5: "assets/private/image/viewer/thumb5.jpg.bin",
    Thumbnail6: "assets/private/image/viewer/thumb6.jpg.bin",
    Thumbnail7: "assets/private/image/viewer/thumb7.jpg.bin",
    Thumbnail8: "assets/private/image/viewer/thumb8.jpg.bin",
    Thumbnail9: "assets/private/image/viewer/thumb9.jpg.bin",
    Thumbnail10: "assets/private/image/viewer/thumb10.jpg.bin",
    Thumbnail11: "assets/private/image/viewer/thumb11.jpg.bin",
    Thumbnail12: "assets/private/image/viewer/thumb12.jpg.bin",

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