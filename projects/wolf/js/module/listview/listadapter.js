class ListAdapter {
    constructor() {
        this.__data = null;
    }

    setData(data) {
        this.__data = data;
    }

    getCount() {
        return this.__data == null ? 0 : this.__data.length;
    }

    bindItem(item, position) {
        item.setText(this.__data[position].name);
        item.setColor(this.__data[position].color);
        item.setDataPosition(position);
    }
}