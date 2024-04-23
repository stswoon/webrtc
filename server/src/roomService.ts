import {JsMap, WS} from "./utils";
import {Room, User} from "./roomModels";

export class RoomService {
    private readonly LAZY_REMOVE_TIMEOUT = 10 * 1000; //sec;
    private readonly room: Room;
    private readonly onDestroy: () => void;

    constructor(onDestroy: () => void) {
        this.room = {users: []};
        this.onDestroy = onDestroy;
    }

    private userWsConnections: JsMap<string, WS> = {};//<userId, WS>
    private userLazyRemoveTimers: JsMap<string, any> = {}; //userId, timeoutId

    joinRoom(ws: WS, userId: string) {
        console.log(`User (${userId}) is entering in the room`);

        if (this.userLazyRemoveTimers[userId]) {
            clearTimeout(this.userLazyRemoveTimers[userId]);
            delete this.userLazyRemoveTimers[userId];
        }

        const foundUser = this.getUser(userId);
        if (foundUser) {
            foundUser.active = true;
        } else {
            this.room.users.push({id: userId, active: true});
        }

        this.userWsConnections[userId] = ws;

        this.broadcastRoomState();
    }

    messageFromUser(userId: string, msg: string): void {
        if (msg === "H") {
            console.log(`Client send H (heartbeat), userId=${userId}`);
            return;
        }
        const parsedMag = JSON.parse(msg);
        const foundUser = this.getUser(userId)!;
        foundUser.candidate = parsedMag.candidate
        this.broadcastRoomState();
    }

    userDisconnect(userId: string): void {
        console.log(`WS for user (${userId}) in room was closed`);
        delete this.userWsConnections[userId];
        const foundUser = this.getUser(userId)!;
        foundUser.active = false;
        this.broadcastRoomState();
        this.userLazyRemoveTimers[userId] = setTimeout(() => this.finalUserDisconnect(userId), this.LAZY_REMOVE_TIMEOUT);
    }

    private finalUserDisconnect(userId: string): void {
        console.log(`Finally remove user (${userId}) from room`);
        delete this.userLazyRemoveTimers[userId];
        this.room.users = this.room.users.filter(user => user.id !== userId);
        this.broadcastRoomState();

        if (Object.values(this.userWsConnections).length === 0) {
            setTimeout(() => {
                if (Object.values(this.userWsConnections).length === 0) {
                    console.log(`Finally remove roomService`);
                    this.onDestroy();
                }
            }, this.LAZY_REMOVE_TIMEOUT);
        }
    }

    private broadcastRoomState(): void {
        console.log(`Broadcast room to users: ${Object.keys(this.userWsConnections).join(", ")}`);
        Object.values(this.userWsConnections).forEach((ws: WS) => ws.send(JSON.stringify(this.room)));
    }

    private getUser(id: string): User | null {
        return this.room.users.find(user => user.id === id)!;
    }
}


