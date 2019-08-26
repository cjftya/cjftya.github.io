class ContackDataStruct {
    constructor() {
        this.__contactList = [];
        this.__posAccumMap = new Map();
    }

    clear() {
        this.__contactList = [];
        this.__posAccumMap.clear();
    }

    getConArr() {
        return this.__contactList;
    }

    addContact(p, n, d, aid, bid) {
        this.__contactList.push(new Contact(p, n, d, aid, bid));
        this.setPosAccumMap(aid, d);
    }

    getCount(id) {
        var d = this.__posAccumMap.get(id);
        return d == null ? 1 : d;
    }

    setPosAccumMap(id, delta) {
        var dt = this.__posAccumMap.get(id);
        if (dt == null) {
            this.__posAccumMap.set(id, 1);
        } else {
            this.__posAccumMap.set(id, dt + 1);
        }
    }
}