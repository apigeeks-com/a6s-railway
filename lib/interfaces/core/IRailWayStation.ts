import {IRailWayResolver, IRailWayResolver_JOI_SCHEMA} from './IRailWayResolver';
import * as Joi from 'joi';

interface IRailWayStation extends IRailWayResolver {
    resolvers?: {[key: string]: IRailWayStation};
}

const IRailWayStation_JOI_SCHEMA = IRailWayResolver_JOI_SCHEMA.keys({
    resolvers: Joi.object().pattern(/^/, IRailWayResolver_JOI_SCHEMA)
}).options({ abortEarly: true });

export {IRailWayStation, IRailWayStation_JOI_SCHEMA};
