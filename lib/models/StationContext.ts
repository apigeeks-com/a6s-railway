export class StationContext {
    constructor(
        private parentsPath: string[] = [],
        private workingDirectory = '.',
    ) {}

    getParentsPath() {
        return this.parentsPath;
    }

    addParent(parent: string) {
        this.parentsPath = [...this.parentsPath, parent];
    }

    getWorkingDirectory() {
        return this.workingDirectory;
    }

    clone() {
        return new StationContext([...this.getParentsPath()], this.getWorkingDirectory());
    }
}
