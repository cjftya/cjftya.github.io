class AbsPresenter {
	constructor(view) {
		this.__view = view;
	}
	
	getView() {
		return this.__view;
	}
	
	onTouchDown(tx, ty) {}
    onTouchUp(tx, ty) {}
    onTouchMove(tx, ty) {}
}