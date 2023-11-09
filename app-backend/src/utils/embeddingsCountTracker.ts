import EventEmitter from "node:events";

class EmbeddingsCountTracker {
    private _numberOfEmbeddings: number = 0
    private eventEmitter = new EventEmitter();

    constructor() {
        // this.eventEmitter.setMaxListeners(100);
    }

    get embeddings(): number {
        return this._numberOfEmbeddings
    }

    set embeddings(val: number) {
        this._numberOfEmbeddings = val
        this.eventEmitter.emit('numberOfEmbeddingsUpdated', this._numberOfEmbeddings)
    }

    addToEmbeddingsCount(numberOfEmbeddings: number) {
        this.embeddings = this.embeddings + numberOfEmbeddings
    }

    clearNumberOfEmbeddings(): void {
        this.embeddings = 0;
    }

    getNumberOfEmbeddingsEventEmitter(): EventEmitter {
        return this.eventEmitter;
    }
}

export { EmbeddingsCountTracker }