import EventEmitter from "node:events";
import { ObjectDetectionData } from "../types";

class ObjectDetectionDataEmitter {
    private _odData: ObjectDetectionData = {}
    private eventEmitter = new EventEmitter();

    constructor() {
        this.eventEmitter.setMaxListeners(100);
    }

    get odData(): ObjectDetectionData {
        return this._odData
    }

    set odData(odData: ObjectDetectionData) {
        this._odData = odData

    }

    addEntry(entry: ObjectDetectionData) {
        console.log("Adding entry")
        this._odData = { ...this._odData, ...entry }
        this.eventEmitter.emit('odDataAdded', entry)
    }

    markAsComplete() {
        this.eventEmitter.emit('odDataDone')
        this._odData = {}
    }

    clearLogs(): void {
        this._odData = {};
    }

    getOdDataEventEmitter(): EventEmitter {
        return this.eventEmitter;
    }
}

export { ObjectDetectionDataEmitter }