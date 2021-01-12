class ObjectInitializer {
    constructor() {
        this.__textViewMap = null;
        this.__imageViewMap = null;
        this.__particleMap = null;

        this.__traceModule = null;
        this.__mapModule = null;
        this.__slideShowModule = null;
        this.__dynamicTextFrameModule = null;
        this.__directionsModule = null;
        this.__dayCountModule = null;
        this.__bankAccountModule = null;
        this.__backgroundBlock = null;

        this.__endOfScreen = 0;
    }

    getBackgroundBlock() {
        return this.__backgroundBlock;
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

    getDirectionsModule() {
        return this.__directionsModule;
    }

    getDayCountModule() {
        return this.__dayCountModule;
    }

    getBankAccountModule() {
        return this.__bankAccountModule;
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

    reload() {
        if (this.__imageViewMap != null) {
            for (var [id, view] of this.__imageViewMap.entries()) {
                view.reload();
            }
        }

        if (this.__dynamicTextFrameModule != null) {
            this.__dynamicTextFrameModule.reload();
        }

        if (this.__mapModule != null) {
            this.__mapModule.reload();
        }

        if (this.__slideShowModule != null) {
            this.__slideShowModule.reload();
        }
    }

    initializeBaseObject() {
        var winSize = TopicManager.ready().read(DISPLAY_INFO.WINDOW_SIZE);

        var mainImageView = UiFactory.createImageView()
            .setImagePath(ResourcePath.MainImage)
            .setPos(0, 0)
            .setWidth(winSize[0], true);

        var titleTextView = UiFactory.createTextView()
            .addText("W  e  d  d  i  n  g")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(16)
            .setPos(0, mainImageView.getHeight() + 60);

        var mainImageTitleTextView = UiFactory.createTextView()
            .addText("현 철   •   서 영")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(16)
            .setPos(0, titleTextView.getPos().y + 100);

        var mainTitleParticle = EffectFactory.createParticle(Particle.Spray)
            .setAmount(15)
            .setColor(230, 130, 130)
            .setRadius(1, 5)
            .setBlurRadiusPow(3, 5)
            .setPos(winSize[0] / 2, mainImageTitleTextView.getPos().y)
            .setCreateArea(50, 15)
            .setLife(120)
            .setFreq(0.08);

        var weddingInfoTextView = UiFactory.createTextView()
            .addText("2021. 03. 06. SAT PM 12:30")
            .addText("더채플앳청담 3층 커티지홀")
            .setTextGap(30)
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setSize(16)
            .setPos(0, mainImageTitleTextView.getPos().y + 120);

        var ringImageView = UiFactory.createImageView()
            .setImagePath(ResourcePath.RingImage)
            .setPos(0, weddingInfoTextView.getPos().y + 80)
            .setWidth(winSize[0], true);

        this.__dayCountModule = new DayCount()
            .setPos(0, ringImageView.getPos().y)
            .setSize(ringImageView.getWidth(), ringImageView.getHeight())
            .setTextColor(250, 250, 250);

        var invitationTextView = UiFactory.createTextView()
            .addText("I  n  v  i  t  a  t  i  o  n")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(16)
            .setPos(0, weddingInfoTextView.getPos().y + ringImageView.getHeight() + 400);

        var invitationLetterTextView = UiFactory.createTextView()
            .addText("봄의 그대는 벚꽃이었고")
            .addText("여름의 그대는 바람이었으며")
            .addText("가을의 그대는 하늘이 었고")
            .addText("겨울의 그대는 하얀 눈이었다")
            .addText("그대는 언제나")
            .addText("행복 그 자체였다")
            .addText("< 강현욱, 사계 >")
            .setTextGap(40)
            .setAlign(CENTER, null)
            .setColor(190, 130, 130)
            .setAlpha(180)
            .setSize(15)
            .setPos(0, invitationTextView.getPos().y + 90);

        this.__dynamicTextFrameModule = new DynamicTextFrame()
            .setSize(winSize[0], 200)
            .setPos(0, invitationLetterTextView.getPos().y + 320)
            .addText("“ 언제나 그대의 곁에서 · · · ”")
            .addText("“ 사랑스런 그대의 곁에서  · · · ”")
            .addText("“ 함깨 살아가고 싶습니다 · · · ”")
            .setAlpha(180)
            .setColor(240, 240, 240);

        var galleryTextView = UiFactory.createTextView()
            .addText("G  a  l  l  e  r  y")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(16)
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
            .setPos(0, galleryTextView.getPos().y + 70);

        this.__traceModule = new HeartTrace()
            .setHeartSize(this.__slideShowModule.getWidth(), this.__slideShowModule.getHeight())
            .setPos(this.__slideShowModule.getPos().x + this.__slideShowModule.getWidth() / 2,
                this.__slideShowModule.getPos().y + this.__slideShowModule.getHeight() / 2)
            .setMovePointCount(2);

        var locationTextView = UiFactory.createTextView()
            .addText("L  o  c  a  t  i  o  n")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(16)
            .setPos(0, this.__slideShowModule.getPos().y + this.__slideShowModule.getHeight() + 350);

        this.__mapModule = new MapView()
            .setPos(0, locationTextView.getPos().y + 80)
            .setCropSrcPos(((1665 - winSize[0]) / 2) - 150, 300)
            .setShortcutText("네이버지도 바로가기")
            .setCropSize(winSize[0], 250);

        var bgRect2 = new BgRect()
            .setPos(0, this.__dynamicTextFrameModule.getPos().y)
            .setHeight(this.__mapModule.getPos().y - this.__dynamicTextFrameModule.getPos().y)
            .setColor(255, 247, 242);

        var bgRect3 = new BgRect()
            .setPos(0, bgRect2.getPos().y + bgRect2.getHeight())
            .setHeight(1500)
            .setColor(255, 250, 248);

        var addressTextView = UiFactory.createTextView()
            .addText("더채플앳청담")
            .addText("서울 강남구 선릉로 757")
            .setTextGap(30)
            .setAlign(LEFT, null)
            .setColor(190, 130, 130)
            .setSize(15)
            .setPos(20, this.__mapModule.getPos().y + this.__mapModule.getHeight() + 70);

        this.__directionsModule = new Directions()
            .setPos(0, addressTextView.getPos().y + 120);

        var noticeTextView = UiFactory.createTextView()
            .addText("N  o  t  i  c  e")
            .setAlign(CENTER, null)
            .setColor(160, 110, 110)
            .setTextStyle(BOLD)
            .setSize(16)
            .setPos(0, this.__directionsModule.getPos().y + 350);

        this.__bankAccountModule = new BankAccount()
            .setPos(0, noticeTextView.getPos().y + 90)
            .setSize(winSize[0], 500)
            .addTitle("코로나로 인해 요청이 많아 추가하였습니다")
            .addTitle("( 아래 항목을 누르면 계좌가 복사됩니다 )")
            .addBackInfo("임현철", "새마을금고", "9003-2232-4693-9")
            .addBackInfo("가나다", "새마을금고", "9003-2232-4693-9");

        var thankYouTextView = UiFactory.createTextView()
            .addText("T h a n k   y o u")
            .setAlign(CENTER, null)
            .setColor(190, 130, 130)
            .setTextStyle(BOLD)
            .setSize(16)
            .setPos(0, noticeTextView.getPos().y + 500);


        this.__endOfScreen = thankYouTextView.getPos().y - winSize[1] / 1.5;

        // set map
        this.__particleMap = new Map();
        this.__particleMap.set(ParticleContents.MainTitle, mainTitleParticle);

        this.__imageViewMap = new Map();
        this.__imageViewMap.set(ImageContents.Main, mainImageView);
        this.__imageViewMap.set(ImageContents.Ring, ringImageView);

        this.__textViewMap = new Map();
        this.__textViewMap.set(TextContents.Title, titleTextView);
        this.__textViewMap.set(TextContents.MainImageTitle, mainImageTitleTextView);
        this.__textViewMap.set(TextContents.WeddingInfo, weddingInfoTextView);
        this.__textViewMap.set(TextContents.Invitation, invitationTextView);
        this.__textViewMap.set(TextContents.InvitationLetter, invitationLetterTextView);
        this.__textViewMap.set(TextContents.Gallery, galleryTextView);
        this.__textViewMap.set(TextContents.Location, locationTextView);
        this.__textViewMap.set(TextContents.Address, addressTextView);
        this.__textViewMap.set(TextContents.Notice, noticeTextView);
        this.__textViewMap.set(TextContents.ThankYou, thankYouTextView);

        this.__backgroundBlock = [];
        // this.__backgroundBlock.push(bgRect1);
        this.__backgroundBlock.push(bgRect2);
        this.__backgroundBlock.push(bgRect3);
    }
}