import {BaseResolver} from '../models';
import * as Joi from 'joi';
import {IReportRecord, IReportRecordType} from '../interfaces';

export class ContextResolver extends BaseResolver {
    getName(): string {
        return 'a6s.context';
    }

    private static OPTIONS_SCHEMA = Joi.object().required().options({
        abortEarly: true
    });

    async validate(options: any): Promise<void> {
        const result = Joi.validate(options, ContextResolver.OPTIONS_SCHEMA);

        if (result.error) {
            throw new Error(result.error.details.map(d => d.message).join('\n'));
        }
    }

    async run(name: string, options: any, sharedContext: any, resolvers: {[name: string]: BaseResolver}): Promise<IReportRecord[]> {
        let obj = sharedContext;

        if (name.length) {
            obj = sharedContext[name];
            if (!obj) {
               obj = sharedContext[name] = {};
            }
        }

        return [{
            type: IReportRecordType.RESOLVER,
            payload: Object.assign(obj, options)
        }];
    }
}
