import {exec} from 'child_process';
import { A6sRailway } from '../../A6sRailway';

export class ChildProcessUtil {
    /**
     * Exec some command
     * @param {string} command
     * @returns {Promise<{stdout: string, stderr: string}>}
     */
    exec(command: string): Promise<{stdout: string, stderr: string, code: number}> {
        A6sRailway.debug(`Executing command "${command}"...`);
        return new Promise<{stdout: string, stderr: string, code: number}>((resolve) => {
            exec(command, (err, stdout, stderr) => {
                stdout = stdout && stdout.trim();
                stderr = stderr && stderr.trim();
                let code = 0;

                if (err) {
                    const _err: any = err;

                    if (_err.code) {
                        code = _err.code;
                    }
                }

                A6sRailway.debug(`Command "${command}" completed with code: ${code}`);

                resolve({stdout, stderr, code});
            });
        });
    }
}
