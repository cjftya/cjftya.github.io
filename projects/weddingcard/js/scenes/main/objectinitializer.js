class ObjectInitializer {

    constructor() {
        this.__textViewMap = null;
        this.__imageViewMap = null;
        this.__particleMap = null;

        this.__traceModule = null;
        this.__mapModule = null;
        this.__slideShowModule = null;
        this.__dynamicTextFrameModule = null;

        this.__endOfScreen = 0;
    }

    getTraceModule() {
        return this.__traceModule;
    }

    getMapModule() {
        return this.__mapModule;
    }

    getSlideShowModule() {
        return this.__slideShowModule;
    }

    getDynamicTextFrameModule() {
        return this.__dynamicTextFrameModule;
    }

    getTextMap() {
        return this.__textViewMap;
    }

    getImageMap() {
        return this.__imageViewMap;
    }

    getParticleMap() {
        return this.__particleMap;
    }

    getEndOfScreem() {
        return this.__endOfScreen;
    }

    initializeBaseObject() {
        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        var mainImageView = UiFactory.createImageView()
            .setImagePath(ResourcePath.MainImage)
            .setPos(0, 0)
            .setWidth(winSize[0], true);

        var titleTextView = UiFactory.createTextView()
            .addText("♡ · · ·  W e d d i n g  · · · ♡")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(20)
            .setPos(0, mainImageView.getHeight() + 60);

        //현 철   ღ   서 영
        var mainImageTitleTextView = UiFactory.createTextView()
            .addText("가 나   ღ   다 라")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(18)
            .setPos(0, titleTextView.getPos().y + 100);

        var mainTitleParticle = EffectFactory.createParticle(Particle.Spray)
            .setRadius(1, 5)
            .setBlurRadiusPow(3, 5)
            .setAmount(15)
            .setPos(winSize[0] / 2, mainImageTitleTextView.getPos().y)
            .setCreateArea(50, 15)
            .setLife(120)
            .setFreq(0.08);

        var manFaceImageView = UiFactory.createImageView()
            .setImagePath(ResourcePath.ManFaceImage)
            .setImageMode(CENTER)
            .setMaskPath(ResourcePath.ManFaceMaskImage)
            .setPos(winSize[0] / 2 - (winSize[0] / 5),
                mainImageTitleTextView.getPos().y + (winSize[0] / 5) + 20)
            .setWidth(winSize[0] / 2.8, true)

        var womenFaceImageView = UiFactory.createImageView()
            .setImagePath(ResourcePath.WomenFaceImage)
            .setImageMode(CENTER)
            .setMaskPath(ResourcePath.ManFaceMaskImage)
            .setPos(winSize[0] / 2 + (winSize[0] / 5),
                mainImageTitleTextView.getPos().y + + (winSize[0] / 5) + 20)
            .setWidth(winSize[0] / 2.8, true)

        //2020년 04월 11일 토요일 오후 2시
        var weddingInfoTextView = UiFactory.createTextView()
            .addText("7777년 77월 77일 7요일 오후 7시")
            .setAlign(CENTER, null)
            .setColor(250, 250, 250)
            .setAlpha(190)
            .setTextStyle(BOLD)
            .setSize(18)
            .setPos(0, womenFaceImageView.getPos().y + 180);

        var ddayLabelTextView = UiFactory.createTextView()
            .addText("D - Day")
            .setAlign(CENTER, null)
            .setColor(250, 250, 250)
            .setAlpha(210)
            .setTextStyle(BOLD)
            .setSize(40)
            .setPos(0, weddingInfoTextView.getPos().y + 190);

        var dayCounterTextView = UiFactory.createTextView()
            .addText("00일 00시 00분 00초")
            .setAlign(CENTER, null)
            .setColor(250, 250, 250)
            .setAlpha(230)
            .setTextStyle(BOLD)
            .setSize(35)
            .setPos(0, ddayLabelTextView.getPos().y + 100);

        var dayCounterImageView = UiFactory.createImageView()
            .setImagePath(ResourcePath.DayCounterImage)
            .setPos(0, manFaceImageView.getPos().y + 140)
            .setEnableCrop(true)
            .setCropSrcPos(((800 - winSize[0]) / 2), 800)
            .setCropSize(winSize[0], 400);

        var invitationTextView = UiFactory.createTextView()
            .addText("♡ · · ·  I n v i t a t i on  · · · ♡")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(20)
            .setPos(0, weddingInfoTextView.getPos().y + 480);

        var invitationLetterTextView = UiFactory.createTextView()
            .addText("·  ·  ·  ·  ·  ·  ·  ·  ·  ·")
            .addText("·  ·  행복이 피어나는 따뜻한 봄  ·  ·")
            .addText("·  저희 두사람 새로운 출발을 하려고 합니다  ·")
            .addText("·  서로를 향한 사랑과 믿음을 하나가 되는 자리에  ·")
            .addText("·  축복으로 함께해주시면 감사하겠습니다  ·")
            .addText("·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·")
            .setTextGap(40)
            .setAlign(CENTER, null)
            .setColor(190, 130, 130)
            .setTextStyle(BOLD)
            .setAlpha(180)
            .setSize(15)
            .setPos(0, invitationTextView.getPos().y + 80);

        this.__dynamicTextFrameModule = new DynamicTextFrame()
            .setWidth(winSize[0])
            .setPos(0, invitationLetterTextView.getPos().y + 320)
            .addText("“ 언제나 그대의 곁에서 · · · ”")
            .addText("“ 사랑스런 그대의 곁에서  · · · ”")
            .addText("“ 함깨 살아가고 싶습니다 · · · ”")
            .setColor(240, 240, 240);

        var galleryTextView = UiFactory.createTextView()
            .addText("♡ · · ·  G a l l e r y  · · · ♡")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(20)
            .setPos(0, this.__dynamicTextFrameModule.getPos().y + 560);

        this.__slideShowModule = new SlideShow()
            .addImagePath(ResourcePath.SlideShow1Image)
            .addImagePath(ResourcePath.SlideShow2Image)
            .addImagePath(ResourcePath.SlideShow3Image)
            .addImagePath(ResourcePath.SlideShow4Image)
            .addImagePath(ResourcePath.SlideShow5Image)
            .addImagePath(ResourcePath.SlideShow6Image)
            .setMask(ResourcePath.SlideShowMaskImage)
            .setWidth(winSize[0])
            .setDelay(5)
            .setPos(0, galleryTextView.getPos().y + 50);

        this.__traceModule = new HeartTrace()
            .setHeartSize(this.__slideShowModule.getWidth(), this.__slideShowModule.getHeight())
            .setPos(this.__slideShowModule.getPos().x + this.__slideShowModule.getWidth() / 2,
                this.__slideShowModule.getPos().y + this.__slideShowModule.getHeight() / 2)
            .setMovePointCount(1);

        var locationTextView = UiFactory.createTextView()
            .addText("♡ · · ·  L o c a t i o n  · · · ♡")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(20)
            .setPos(0, this.__slideShowModule.getPos().y + this.__slideShowModule.getHeight() + 170);

        this.__mapModule = new MapView(ResourcePath.MapImage)
            .setPos(0, locationTextView.getPos().y + 80)
            .setCropSrcPos(((1560 - winSize[0]) / 2), 240)
            .setShortcutText("네이버지도 바로가기")
            .setCropSize(winSize[0], 250);

        var locationSubwayInfoTextView = UiFactory.createTextView()
            .addText("  ▶지하철")
            .addText("  광화문역 2번 출구 (5호선) 방향으로 나와 경북궁")
            .addText("  방면으로 직진 후 역사박물관에서 우회전 후, 사거리에서")
            .addText("  좌측 대각선 첫 번째 건물")
            .addText("  경북궁역 6번 출구 (3호선) 방향으로 나와 광화문")
            .addText("  삼거리 건넌 후 광화문 열린시민마당 건너편 건물")
            .setTextGap(30)
            .setAlign(LEFT, null)
            .setColor(190, 130, 130)
            .setTextStyle(BOLD)
            .setAlpha(180)
            .setSize(14)
            .setPos(0, this.__mapModule.getPos().y + 340);

        var locationBusInfoTextView = UiFactory.createTextView()
            .addText("  ▶버  스")
            .addText("  간선(파랑) : 103, 109, 150, 171, 272, 401,")
            .addText("      402(심야), 406, 408, 606, 607, 700, 704,")
            .addText("      706, 707, 708")
            .addText("  지선(초록) : 1020, 1711, 7016, 7018, 7022, 7212, 7025")
            .addText("  마을버스 : 종로 09, 종로 11")
            .addText("  ❅ 세종문화회관, KT광화문지사, 경북궁 정류장 하자")
            .addText("     더 케이 트윈타워 LL층")
            .setTextGap(30)
            .setAlign(LEFT, null)
            .setColor(190, 130, 130)
            .setTextStyle(BOLD)
            .setAlpha(180)
            .setSize(14)
            .setPos(0, locationSubwayInfoTextView.getPos().y + 210);


        var copyRightTextView = UiFactory.createTextView()
            .addText("·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·")
            .addText("Copyright ⓒ HyunChurl Lim")
            .addText("·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·")
            .setTextGap(35)
            .setAlign(CENTER, null)
            .setColor(190, 130, 130)
            .setTextStyle(BOLD)
            .setSize(16)
            .setPos(0, locationBusInfoTextView.getPos().y + 300);


        this.__endOfScreen = copyRightTextView.getPos().y - 480;

        // set map
        this.__particleMap = new Map();
        this.__particleMap.set(ParticleContents.MainTitle, mainTitleParticle);

        this.__imageViewMap = new Map();
        this.__imageViewMap.set(ImageContents.Main, mainImageView);
        this.__imageViewMap.set(ImageContents.ManFaceImage, manFaceImageView);
        this.__imageViewMap.set(ImageContents.WomenFaceImage, womenFaceImageView);
        this.__imageViewMap.set(ImageContents.DayCounter, dayCounterImageView);

        this.__textViewMap = new Map();
        this.__textViewMap.set(TextContents.Title, titleTextView);
        this.__textViewMap.set(TextContents.MainImageTitle, mainImageTitleTextView);
        this.__textViewMap.set(TextContents.WeddingInfo, weddingInfoTextView);
        this.__textViewMap.set(TextContents.DDayLabel, ddayLabelTextView);
        this.__textViewMap.set(TextContents.DayCounter, dayCounterTextView);
        this.__textViewMap.set(TextContents.Invitation, invitationTextView);
        this.__textViewMap.set(TextContents.InvitationLetter, invitationLetterTextView);
        this.__textViewMap.set(TextContents.Gallery, galleryTextView);
        this.__textViewMap.set(TextContents.Location, locationTextView);
        this.__textViewMap.set(TextContents.SubwayInfo, locationSubwayInfoTextView);
        this.__textViewMap.set(TextContents.BusInfo, locationBusInfoTextView);
        this.__textViewMap.set(TextContents.Copyright, copyRightTextView);
    }
}