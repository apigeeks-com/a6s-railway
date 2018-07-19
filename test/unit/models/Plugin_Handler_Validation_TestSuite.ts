import { suite, test } from 'mocha-typescript';
import {MockFailedValidationStationHandler} from '../../helpers/MockFailedValidationStationHandler';
import {AssertHelper} from '../../helpers/AssertHelper';

@suite class Plugin_Handler_Validation_TestSuite {
    @test async validationHandlerPlugin(): Promise<void> {
        const mockFailedValidationStationHandler = new MockFailedValidationStationHandler('validation_station');

        await AssertHelper.shouldRejectWithErrorMessage(async() => {
            await mockFailedValidationStationHandler.validate({});
        }, 'test validation');
    }
}
