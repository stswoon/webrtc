import "./style.css"

import {AppService} from "./app/AppService.ts";
import {initWebRtcService} from "./app/WebRtcService.ts";

(window as any).AppService = AppService;
AppService.init();

document.addEventListener("DOMContentLoaded", () => {
    initWebRtcService();
});

