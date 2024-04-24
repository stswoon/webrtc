import {v4 as uuid} from "uuid";
import {WsRoomCallback, WsService} from "./WsService.ts";
import {AppState} from "./AppStateModels.ts";


const init = (): void => {
    let userId = getUserId();
    if (!userId) {
        userId = uuid();
        localStorage.setItem("userId", userId);
    }
    window.addEventListener("beforeunload", () => {
        console.log("leaveRoom");
        WsService.disconnect();
    });
    connectRoom(userId);
}

const connectRoom = (userId: string): void => {
    const wsRoomCallback: WsRoomCallback = {
        close(): void {
            console.log("ws close");
        },
        error(error: Error): void {
            console.error("WS error: ", error);
            alert("Error, see console");
        },
        message(message: any): void {
            const state: AppState = message;
            processStateChange(state);
        }
    }
    WsService.attachWsToRoom({userId}, wsRoomCallback);
}

const getUserId = (): string | null => localStorage.getItem("userId");

const send = (message: string): void => WsService.send({userId: getUserId(), text: message});

const processStateChange = (appState: AppState): void => {
    console.log("WS Event");
    console.log(appState);
    processStateChangeCallbacks.forEach(callback => {
        console.log("Call callback");
        callback(appState);
    })
}

let processStateChangeCallbacks: any[] = []
const onProcessStateChange = (callback: any): void => {
    processStateChangeCallbacks.push(callback);
}

export const AppService = {
    init,
    send,
    getUserId,
    onProcessStateChange
}


