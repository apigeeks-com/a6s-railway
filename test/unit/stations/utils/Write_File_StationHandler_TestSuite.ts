import { suite, test } from 'mocha-typescript';
import * as path from 'path';
import * as fs from 'fs';
import {A6sRailway} from '../../../../lib/A6sRailway';
import {IRailwayMap} from '../../../../lib/interfaces';
import {AssertHelper} from '../../../helpers/AssertHelper';
import {Write_File_StationHandler} from '../../../../lib/stations/utils';

const assert = require('assert');

@suite class Write_File_StationHandler_TestSuite {
    @test async validationPassed(): Promise<void> {
        const filePath = path.resolve('foo.json');

        const map = <IRailwayMap> {
            version: '1.0.0',
            cleanupStrategy: 'none',
            station: {
                name: 'k8s.file.write',
                options: {
                    path: filePath,
                    content: JSON.stringify({foo: 'boo'}),
                }
            }
        };

        const railway = new A6sRailway(map)
            .register(new Write_File_StationHandler());

        await railway.execute();


        if (!fs.existsSync(filePath)) {
            assert(false);
        }

        fs.unlinkSync(filePath);
    }

    @test async validationFailed(): Promise<void> {
        const k8s_Secret_StationHandler = new Write_File_StationHandler();

        await AssertHelper.shouldReject(async () => {
            await k8s_Secret_StationHandler.validate({
                path: 'foo',
            });
        });
    }

    @test async emptyObjectValidationFailed(): Promise<void> {
        const k8s_Secret_StationHandler = new Write_File_StationHandler();

        await AssertHelper.shouldReject(async () => {
            await k8s_Secret_StationHandler.validate({});
        });
    }

    @test async emptyOptionValidationFailed(): Promise<void> {
        const k8s_Secret_StationHandler = new Write_File_StationHandler();

        await AssertHelper.shouldReject(async () => {
            await k8s_Secret_StationHandler.validate({
                name: 'foo',
                content: 'boo',
            });
        });
    }
}
