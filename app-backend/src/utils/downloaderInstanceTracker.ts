import EventEmitter from "node:events";

export interface DownloaderInstance {
    id: string;
    ready: boolean;
    framesProduced?: number;
}

interface DownloaderInstances {
    [key: string]: DownloaderInstance;
}

class DownloaderInstanceTracker {
    private _downloaderInstances: DownloaderInstances = {}
    private eventEmitter = new EventEmitter();

    constructor() {
        this.eventEmitter.on('downloaderInstancesUpdated', this.checkAllInstancesReady.bind(this));
        this.eventEmitter.setMaxListeners(100);
    }

    get downloaderInstances(): DownloaderInstances {
        return this._downloaderInstances
    }

    set downloaderInstances(instances: DownloaderInstances) {
        this._downloaderInstances = instances
        this.eventEmitter.emit('downloaderInstancesUpdated', this._downloaderInstances)
    }

    getInstance(id: string): DownloaderInstance | undefined {
        return this.downloaderInstances[id]
    }


    updateInstance({ id, ready, framesProduced }: { id: string, ready: boolean, framesProduced?: number }): void {
        const updatedInstance = {
            id,
            ready,
            framesProduced,

        }

        this.downloaderInstances = {
            ...this.downloaderInstances,
            [id]: updatedInstance
        }
    }


    checkAllInstancesReady(): void {
        const allReady = Object.values(this._downloaderInstances).every(value => value.ready === true);
        console.log(`Checking all ready ${allReady}`)
        if (allReady) {
            this.eventEmitter.emit('allDownloaderInstancesReady');
        }
    }

    getDownloaderInstancesEmitter(): EventEmitter {
        return this.eventEmitter;
    }
}

export { DownloaderInstanceTracker }