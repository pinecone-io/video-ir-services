import EventEmitter from "node:events";

class ProgressTracker {
    private _filesToProcess: string[] = [];
    private _processedFiles: string[] = [];
    private eventEmitter = new EventEmitter();
    private externalEventEmitter = new EventEmitter();
    private startTime: Date = new Date();

    get filesToProcess(): string[] {
        return this._filesToProcess;
    }

    set filesToProcess(files: string[]) {
        this._filesToProcess = files;
        this.eventEmitter.emit('filesToProcessChanged', this._filesToProcess);
    }

    get processedFiles(): string[] {
        return this._processedFiles;
    }

    set processedFiles(files: string[]) {
        this._processedFiles = files;
        this.eventEmitter.emit('processedFilesChanged', this._processedFiles);
    }


    startTimer(): void {
        this.startTime = new Date();
    }


    addFile(fileName: string): void {
        this.filesToProcess = [...this.filesToProcess, fileName];
    }

    completeFile(fileName: string): void {
        const index = this.filesToProcess.indexOf(fileName);
        if (index > -1) {
            this.filesToProcess = [
                ...this.filesToProcess.slice(0, index),
                ...this.filesToProcess.slice(index + 1)
            ];
            this.processedFiles = [...this.processedFiles, fileName];
        }
    }

    getExecutionTime(): string {
        const timeDiff = (new Date().getTime() - this.startTime.getTime()) / 1000;
        return `${Math.floor(timeDiff / 60)}m ${Math.floor(timeDiff % 60)}s`;
    }

    getProgress(): { val: number, ratio: string } {
        const totalFiles = this.filesToProcess.length + this.processedFiles.length;
        const progress = totalFiles === 0 ? 0 : Math.floor((this.processedFiles.length / totalFiles) * 100);
        return { val: progress, ratio: `${this.processedFiles.length}/${totalFiles}` }
    }

    getEmitter(): EventEmitter {
        this.eventEmitter.on('filesToProcessChanged', () => {
            const progress = this.getProgress();
            this.externalEventEmitter.emit('filesToProcessChanged', {
                numberOfFilesToProcess: this.filesToProcess.length,
                progress
            });

            if (this.filesToProcess.length === 0) {
                this.externalEventEmitter.emit('complete', {
                    numberOfFilesProcessed: this.processedFiles.length,
                    status: true,
                    executionTime: this.getExecutionTime()
                });
                // this.filesToProcess = [];
                this.processedFiles = [];
            }
        });
        this.eventEmitter.on('processedFilesChanged', () => {
            const progress = this.getProgress();
            console.log('processedFilesChanged', progress)
            this.externalEventEmitter.emit('processedFilesChanged', {
                numberOfFilesProcessed: this.processedFiles.length,
                progress,
                executionTime: this.getExecutionTime()
            })

        });
        return this.externalEventEmitter;
    }

    // startProgressPolling(fn: (payload: { val: number, ratio: string }) => void, onDone: () => void): void {
    //     console.log("Starting polling");
    //     this.eventEmitter.on('filesToProcessChanged', () => {
    //         const progress = this.getProgress();
    //         console.log('filesToProcessChanged', progress)
    //         fn(progress);
    //     });
    //     this.eventEmitter.on('processedFilesChanged', () => {
    //         const progress = this.getProgress();
    //         console.log('processedFilesChanged', progress)
    //         fn(progress);
    //         if (progress.val === 100) {
    //             onDone();
    //             this.filesToProcess = [];
    //             this.processedFiles = [];
    //         }
    //     });
    // }

}


export { ProgressTracker }