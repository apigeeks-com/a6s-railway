export interface IProcess {
    stdout: string;
    stderr: string;
    code?: number;
    cmd: string;
}
