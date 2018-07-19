import * as Joi from 'joi';

interface IRailWayResolver {
    name: string;
    options?: any;
    options_file?: string;
}

const IRailWayResolver_JOI_SCHEMA = Joi.object({
    name: Joi.string().required(),
    options: Joi.any(),
    options_file: Joi.string()
}).options({ abortEarly: true });

export {IRailWayResolver, IRailWayResolver_JOI_SCHEMA};
