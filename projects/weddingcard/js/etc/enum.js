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
    Copyright: 13
};

var Test1 = false;
var Path1 = "assets/slideshow/s1.jpg";

var ResourcePath = {
    MainImage: Test1 ? Path1 : "assets/main.jpg",
    DynamicTextFrameImage: Test1 ? Path1 : "assets/dynamictextframe.jpg",
    MapImage: Test1 ? Path1 : "assets/map.jpg",
    ManFaceImage: Test1 ? Path1 : "assets/manface.png",
    ManFaceMaskImage: Test1 ? Path1 : "assets/manfacemask.png",
    WomenFaceImage: Test1 ? Path1 : "assets/womenface.png",
    DayCounterImage: Test1 ? Path1 : "assets/dayCounter.jpg",
    SlideShowMaskImage: Test1 ? Path1 : "assets/mask.png",
    SlideShow1Image: Test1 ? Path1 : "assets/slideshow/s1.jpg",
    SlideShow2Image: Test1 ? Path1 : "assets/slideshow/s2.jpg",
    SlideShow3Image: Test1 ? Path1 : "assets/slideshow/s3.jpg",
    SlideShow4Image: Test1 ? Path1 : "assets/slideshow/s4.jpg",
    SlideShow5Image: Test1 ? Path1 : "assets/slideshow/s5.jpg",
    SlideShow6Image: Test1 ? Path1 : "assets/slideshow/s6.jpg",
    DefaultImage: Test1 ? Path1 : "assets/defaultimage.png"
};