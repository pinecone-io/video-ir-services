class ProgressTracker {
    private filesToProcess: string[] = [];
    private processedFiles: string[] = [];

    addFile(fileName: string): void {
        console.log("adding file", fileName)
        this.filesToProcess.push(fileName);
    }

    completeFile(fileName: string): void {
        console.log("completing file", fileName)
        const index = this.filesToProcess.indexOf(fileName);
        if (index > -1) {
            this.filesToProcess.splice(index, 1);
            this.processedFiles.push(fileName);
        }
    }

    getProgress(): number {
        const totalFiles = this.filesToProcess.length + this.processedFiles.length;
        const progress = totalFiles === 0 ? 0 : (this.processedFiles.length / totalFiles) * 100;
        console.log("progress?!", progress)
        return progress
    }

    startProgressPolling(fn: (payload: number) => void): NodeJS.Timeout {
        console.log("starting polling")

        const poll = () => {
            const progress = this.getProgress()
            console.log("PROGRESS", progress)
            fn(progress)
            setTimeout(poll, 1000);
        }

        poll(); // Start the polling

        // Return a dummy timeout that can be cleared
        // This won't actually stop the polling, you'll need to implement that separately
        return setTimeout(() => { }, 0);
    }

}


export { ProgressTracker }