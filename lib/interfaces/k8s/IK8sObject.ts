import * as Joi from 'joi';

interface IK8sObject {
    kind: string;
    apiVersion: string;
    metadata: {
        name: string,
        [key: string]: any
    };
    [key: string]: any;
}

const IK8sObject_JOI_SCHEMA = Joi.object({
    kind: Joi.string().required(),
    apiVersion: Joi.string().required(),
    metadata: Joi.any().required(),
}).options({
    abortEarly: true,
    allowUnknown: true,
});

export {IK8sObject, IK8sObject_JOI_SCHEMA};
