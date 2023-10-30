import EventEmitter from "node:events";

interface IndexerInstances {
    [key: string]: boolean;
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


    updateInstance(id: string, status: boolean): void {
        console.log(`Update instance ${id} ready: ${status}`)
        this._indexerInstances[id] = status;
        this.eventEmitter.emit('instancesUpdated', this._indexerInstances);
    }


    checkAllInstancesReady(): void {
        const allReady = Object.values(this._indexerInstances).every(value => value === true);
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