import "./style.css"

import {AppService} from "./app/AppService.ts";

(window as any).AppService = AppService;
AppService.init();
