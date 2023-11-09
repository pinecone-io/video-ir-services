import EventEmitter from "node:events";

class NumberOfObjectsTracker {
    private _numberOfObjects: number = 0
    private eventEmitter = new EventEmitter();

    constructor() {
        // this.eventEmitter.setMaxListeners(100);
    }

    get objects(): number {
        return this._numberOfObjects
    }

    set objects(val: number) {
        this._numberOfObjects = val
        this.eventEmitter.emit('numberOfObjectsUpdated', this._numberOfObjects)
    }

    addToObjectCount(numberOfObjects: number) {
        this.objects = this.objects + numberOfObjects
    }

    clearNumberOfObjects(): void {
        this.objects = 0;
    }

    getNumberOfObjectsEventEmitter(): EventEmitter {
        return this.eventEmitter;
    }
}

export { NumberOfObjectsTracker }