import { ListItem } from "./listitem";
import { MediaData } from "../../database/mediadata";
import { IListView } from "./ilistview";

export class ListAdapter {

    private data: MediaData;
    private view: IListView;

    constructor(data: MediaData) {
        this.data = data;
    }

    public setView(view: IListView) {
        this.view = view;
    }

    public notify(): void {
        this.view.notify();
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