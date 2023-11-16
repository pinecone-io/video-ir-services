import EventEmitter from "node:events";

export interface IndexerInstance {
    id: string;
    ready: boolean;
    framesProcessed?: number;
    embeddingsProcessed?: number;
}

interface IndexerInstances {
    [key: string]: IndexerInstance;
}

class IndexerInstanceTracker {
    private _indexerInstances: IndexerInstances = {}
    private eventEmitter = new EventEmitter();

    constructor() {
        this.eventEmitter.on('instancesUpdated', this.checkAllInstancesReady.bind(this));
    }

    get indexerInstances(): IndexerInstances {
        return this._indexerInstances
    }

    set indexerInstances(instances: IndexerInstances) {
        this._indexerInstances = instances
        this.eventEmitter.emit('instancesUpdated', this._indexerInstances)
    }

    getInstance(id: string): IndexerInstance | undefined {
        return this.indexerInstances[id]
    }


    updateInstance({ id, ready, framesProcessed, embeddingsProcessed }: { id: string, ready: boolean, framesProcessed?: number, embeddingsProcessed?: number }): void {
        const updatedInstance = {
            id,
            ready,
            framesProcessed,
            embeddingsProcessed,
        }

        this.indexerInstances = {
            ...this.indexerInstances,
            [id]: updatedInstance
        }
    }


    checkAllInstancesReady(): void {
        const allReady = Object.values(this._indexerInstances).every(value => value.ready === true);
        console.log(`Checking all ready ${allReady}`)
        if (allReady) {
            this.eventEmitter.emit('allInstancesReady');
        }
    }

    getAllInstancesReadyEmitter(): EventEmitter {
        return this.eventEmitter;
    }
}

export { IndexerInstanceTracker }