import { Message } from "../../etc/message";

export interface IListView {

    sendMessage(e: Message): void;
}