import { suite, test } from 'mocha-typescript';
import {MockFailedValidationResolver} from '../../helpers/MockFailedValidationResolver';
import {AssertHelper} from '../../helpers/AssertHelper';

@suite class Plugin_Resolver_Validation_TestSuite {
    @test async validationResolverPlugin(): Promise<void> {
        const mockFailedValidationResolver = new MockFailedValidationResolver('validation_resolver');

        await AssertHelper.shouldRejectWithErrorMessage(async() => {
            await mockFailedValidationResolver.validate({});
        }, 'test validation');
    }
}
