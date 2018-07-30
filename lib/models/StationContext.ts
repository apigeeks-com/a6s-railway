export class StationContext {
    constructor(
        private parentsPath: string[] = [],
        private workingDirectory = '',
    ) {}

    getParentsPath() {
        return this.parentsPath;
    }

    setParentsPath(parentsPath: string[]) {
        this.parentsPath = parentsPath;
    }

    getWorkingDirectory() {
        return this.workingDirectory;
    }

    clone() {
        return new StationContext(this.getParentsPath(), this.getWorkingDirectory());
    }
}
