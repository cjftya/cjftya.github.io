import { ListItem } from "./listitem";
import { MediaData } from "../../database/mediadata";
import { IListView } from "./ilistview";
import { Message } from "../../support/message";
import { Events } from "../../support/events";

export class ListAdapter {

    private data: MediaData;
    private view: IListView;

    constructor(view: IListView, data: MediaData) {
        this.view = view;
        this.data = data;
    }

    public notify(): void {
        this.view.sendMessage(Message.obtain(Events.NOTIFY));
    }

    public bindItem(view: ListItem, position: number): void {
        const it = this.data.getRead(position);
        view.setText(it.getName());
        view.setColor(it.getColor());
        view.setDataPosition(position);
    }

    public getCount(): number {
        return this.data.getCount();
    }

    public destroy(): void {
        this.data = null;
    }
}