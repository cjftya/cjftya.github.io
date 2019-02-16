class AbsScene {
    constructor(attr) {
        this.__isUpdate = AddressUtil.getInstance().getArg(attr, "update");
    }

    isUpdate() {
        return this.__isUpdate > 0;
    }
    
    setPresenter(presenter) {
		this.__presenter = presenter;
	}
    getPresenter() {
 		return  this.__presenter;
	}

    onStart() {}
    onUpdate(timeDelta) {}
    onDraw() {}

    onTouchDown(tx, ty) {}
    onTouchUp(tx, ty) {}
    onTouchMove(tx, ty) {}
}