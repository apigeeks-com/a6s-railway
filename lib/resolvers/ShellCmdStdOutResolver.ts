import {BaseResolver} from '../models';
import {exec} from 'child_process';
import * as Joi from 'joi';
import {IReportRecord, IReportRecordType} from '../interfaces';

export class ShellCmdStdOutResolver extends BaseResolver {
    getName(): string {
        return 'a6s.shell.cmd.stdout';
    }

    private static OPTIONS_SCHEMA = Joi.object().keys({
        cmd: Joi.string().required()
    }).required().options({
        abortEarly: true
    });

    async validate(options: any): Promise<void> {
        const result = Joi.validate(options, ShellCmdStdOutResolver.OPTIONS_SCHEMA);

        if (result.error) {
            throw new Error(result.error.details.map(d => d.message).join('\n'));
        }
    }

    async run(name: string, options: any, sharedContext: any, resolvers: {[name: string]: BaseResolver}): Promise<IReportRecord[]> {
        const result = await new Promise<any>((resolve, reject) => {
            exec(options.cmd, (err, stdout) => {
                if (err) {
                    return reject(err);
                }

                sharedContext[name] = stdout && stdout.trim();
                resolve(sharedContext[name]);
            });
        });

        return [{
            type: IReportRecordType.RESOLVER,
            payload: Object.assign(result)
        }];
    }
}
