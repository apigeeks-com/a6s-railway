import {IRailWayResolver, IRailWayResolver_JOI_SCHEMA} from './IRailWayResolver';
import * as Joi from 'joi';

interface IRailWayStation extends IRailWayResolver {
    description?: string;
    resolvers?: {[key: string]: IRailWayResolver};
}

const IRailWayStation_JOI_SCHEMA = IRailWayResolver_JOI_SCHEMA.keys({
    description: Joi.string(),
    resolvers: Joi.object().pattern(/^/, IRailWayResolver_JOI_SCHEMA)
}).options({ abortEarly: true });

export {IRailWayStation, IRailWayStation_JOI_SCHEMA};
