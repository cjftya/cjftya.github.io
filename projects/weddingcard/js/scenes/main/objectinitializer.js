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

        var mainImageTitleTextView = UiFactory.createTextView()
            .addText("현 철   ღ   서 영")
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

        var dayCounterImageView = UiFactory.createImageView()
            .setImagePath(ResourcePath.DayCounterImage)
            .setMaskPath(ResourcePath.ManFaceMaskImage)
            .setPos(0, manFaceImageView.getPos().y + manFaceImageView.getHeight()+90)
            .setWidth(winSize[0], true);

        var hScale = dayCounterImageView.getHeightScale();

        var weddingInfoTextView = UiFactory.createTextView()
            .addText("· · · · ·  2020. 09. 12 SAT. PM 2:30  · · · · ·")
            .addText("· · ·  더채플 앳 청담 6층 채플홀  · · ·")
            .setTextGap(40)
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(40 * hScale)
            .setPos(0, womenFaceImageView.getPos().y + womenFaceImageView.getHeight() + 30);

        var dayCounterTextView = UiFactory.createTextView()
            .addText("· · · · ·  00일 00시 00분 00초  · · · · ·")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(45 * hScale)
            .setPos(0, dayCounterImageView.getPos().y + (840 * hScale));

        var invitationTextView = UiFactory.createTextView()
            .addText("♡ · · ·  I n v i t a t i on  · · · ♡")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(20)
            .setPos(0, weddingInfoTextView.getPos().y + dayCounterImageView.getHeight() + 400);

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
            .setSize(winSize[0], 200)
            .setPos(0, invitationLetterTextView.getPos().y + 320)
            .addText("“ 언제나 그대의 곁에서 · · · ”")
            .addText("“ 사랑스런 그대의 곁에서  · · · ”")
            .addText("“ 함깨 살아가고 싶습니다 · · · ”")
            .setAlpha(180)
            .setColor(240, 240, 240);

        var galleryTextView = UiFactory.createTextView()
            .addText("♡ · · ·  G a l l e r y  · · · ♡")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(20)
            .setPos(0, this.__dynamicTextFrameModule.getPos().y + 540);

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
            .setPos(0, this.__slideShowModule.getPos().y + this.__slideShowModule.getHeight() + 350);

        this.__mapModule = new MapView(ResourcePath.MapImage)
            .setPos(0, locationTextView.getPos().y + 80)
            .setCropSrcPos(((1441 - winSize[0]) / 2), 300)
            .setShortcutText("네이버지도 바로가기")
            .setCropSize(winSize[0], 250);

        var locationSubwayInfoTextView = UiFactory.createTextView()
            .addText("  ▶지하철")
            .addText("  강남구청역 3-1번 출구(7호선 분당선) GE코리아")
            .addText("  좌측방향으로 600m 보도 후 좌측건물")
            .addText("  압구정로데오역 5번 출구(분당선) 400m 보도 후 학동사거리")
            .addText("  횡단보도 건너 50m")
            .addText("  *셔틀버스 : 강남구청역 3번 출구 앞, 배차간격")
            .addText("  10 ~ 15분 간격")
            .setTextGap(30)
            .setAlign(LEFT, null)
            .setColor(190, 130, 130)
            .setTextStyle(BOLD)
            .setAlpha(180)
            .setSize(14)
            .setPos(0, this.__mapModule.getPos().y + 340);

        var locationBusInfoTextView = UiFactory.createTextView()
            .addText("  ▶버  스")
            .addText("  영동고교앞 정류장에서 하차 후 학동사거리 방면")
            .addText("  100m내 건물")
            .addText("  간선 : 301, 351, 472   지선 : 3011, 4412")
            .setTextGap(30)
            .setAlign(LEFT, null)
            .setColor(190, 130, 130)
            .setTextStyle(BOLD)
            .setAlpha(180)
            .setSize(14)
            .setPos(0, locationSubwayInfoTextView.getPos().y + 230);

        var locationCarInfoTextView = UiFactory.createTextView()
            .addText("  ▶자가용")
            .addText("  [영동대교 방면]")
            .addText("  영동대교 남단에서 청담사거리 방면 -> 학동사기리 방면")
            .addText("  1.5km 직진 -> 학동사거리에서 강남구청 방면으로")
            .addText("  좌회전 후 앞 우측 건물")
            .addText("  [성수대교 방면]")
            .addText("  성수대교 남단에서 도산공원 방면 1.5km 직전 -> 도산공원")
            .addText("  사거리에서 영동대교 방면 좌회전 -> 힉동사거리에서")
            .addText("  강남구청 방면으로 우회전 후 50m 앞 우측 건물")
            .setTextGap(30)
            .setAlign(LEFT, null)
            .setColor(190, 130, 130)
            .setTextStyle(BOLD)
            .setAlpha(180)
            .setSize(14)
            .setPos(0, locationBusInfoTextView.getPos().y + 140);

        var copyRightTextView = UiFactory.createTextView()
            .addText("·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·")
            .addText("Copyright ⓒ HyunChurl Lim")
            .addText("·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·")
            .setTextGap(35)
            .setAlign(CENTER, null)
            .setColor(190, 130, 130)
            .setTextStyle(BOLD)
            .setSize(16)
            .setPos(0, locationCarInfoTextView.getPos().y + 300);


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
        this.__textViewMap.set(TextContents.DayCounter, dayCounterTextView);
        this.__textViewMap.set(TextContents.Invitation, invitationTextView);
        this.__textViewMap.set(TextContents.InvitationLetter, invitationLetterTextView);
        this.__textViewMap.set(TextContents.Gallery, galleryTextView);
        this.__textViewMap.set(TextContents.Location, locationTextView);
        this.__textViewMap.set(TextContents.SubwayInfo, locationSubwayInfoTextView);
        this.__textViewMap.set(TextContents.BusInfo, locationBusInfoTextView);
        this.__textViewMap.set(TextContents.CarInfo, locationCarInfoTextView);
        this.__textViewMap.set(TextContents.Copyright, copyRightTextView);
    }
}