import EventEmitter from "node:events";

interface LogLine {
    ts: string,
    message: string,
}

class LogTracker {
    private _logLines: LogLine[] = []
    private eventEmitter = new EventEmitter();

    constructor() {
        this.eventEmitter.setMaxListeners(100);
    }

    get logs(): LogLine[] {
        return this._logLines
    }

    set logs(logs: LogLine[]) {
        this._logLines = logs
        console.log(`Updated logs to ${this._logLines.length}`);
        this.eventEmitter.emit('logUpdated', this._logLines[this._logLines.length - 1])
    }

    log(message: string) {
        this.logs = [...this._logLines, { ts: new Date().toISOString(), message }]
    }

    clearLogs(): void {
        this.logs = [];
    }

    getLogsEventEmitter(): EventEmitter {
        return this.eventEmitter;
    }
}

export { LogTracker }