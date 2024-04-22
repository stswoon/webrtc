import {WS} from "./utils";
import express from "express";
import {RoomService} from "./roomService";

const roomService = new RoomService(() => {
    console.log("Destroyed");
});

export const wsRoomRoute = (ws: WS, req: express.Request, next: any): void => {
    try {
        const {userId} = req.query as { userId: string };
        console.info(`WS request userId=${userId}`);

        ws.on("message", (msg: string) => roomService.messageFromUser(userId, msg))
        ws.on("close", () => roomService.userDisconnect(userId));
        ws.on("error", (err: any) => {
            console.error(`WS error for user (${userId}) was closed`, err);
        });
        roomService.joinRoom(ws, userId);
    } catch (error) {
        // https://scoutapm.com/blog/express-error-handling
        next(error); // passing to default middleware error handler
    }
}
