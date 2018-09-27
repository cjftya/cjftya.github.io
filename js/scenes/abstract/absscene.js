class AbsScene {
    constructor(attr) {
        this.__isUpdate = AddressUtil.getInstance().getArg(attr, "update");
    }

    isUpdate() {
        return this.__isUpdate > 0;
    }

    onStart() {}
    onUpdate(timeDelta) {}
    onDraw() {}

    onTouchDown(tx, ty) {}
    onTouchUp(tx, ty) {}
    onTouchMove(tx, ty) {}
}