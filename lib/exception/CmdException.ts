import {IProcess} from '../interfaces';

export class CmdException extends Error {
    constructor(
        message: string,
        public cmd: string,
        public childProcess: IProcess
    ) {
        super(message);
    }
}
