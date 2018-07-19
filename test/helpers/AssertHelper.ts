const assert = require('assert');

export class AssertHelper {
    public static async shouldReject(fn: Function, msg?: string): Promise<void> {
        let error = false;
        try {
            await fn();
        } catch (e) {
            error = true;
        }

        assert(error, msg);
    }

    public static async shouldRejectWithErrorMessage(fn: Function, errMsg: string, msg?: string): Promise<void> {
        let error: any = {};

        try {
            await fn();
        } catch (e) {
            error = e;
        }

        assert.strictEqual(error.message, errMsg, msg);
    }

    public static async shouldResolve(fn: Function, msg?: string): Promise<void> {
        let error = false;
        try {
            await fn();
        } catch (e) {
            error = true;
        }
        assert(!error, msg);
    }
}
