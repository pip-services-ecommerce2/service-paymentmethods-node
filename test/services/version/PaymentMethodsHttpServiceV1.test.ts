const restify = require('restify');
const assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-nodex';
import { Descriptor } from 'pip-services3-commons-nodex';
import { References } from 'pip-services3-commons-nodex';

import { PaymentMethodV1 } from '../../../src/data/version1/PaymentMethodV1';
import { PaymentMethodsMemoryPersistence } from '../../../src/persistence/PaymentMethodsMemoryPersistence';
import { PaymentMethodsController } from '../../../src/logic/PaymentMethodsController';
import { PaymentMethodsHttpServiceV1 } from '../../../src/services/version1/PaymentMethodsHttpServiceV1';
import { TestModel } from '../../data/TestModel';

let httpConfig = ConfigParams.fromTuples(
    "connection.protocol", "http",
    "connection.host", "localhost",
    "connection.port", 3000
);

let PAYMENT_METHOD1: PaymentMethodV1 = TestModel.createPaymentMethod1();
let PAYMENT_METHOD2: PaymentMethodV1 = TestModel.createPaymentMethod2();

suite('PaymentMethodsHttpServiceV1', () => {
    let service: PaymentMethodsHttpServiceV1;
    let rest: any;

    suiteSetup(async () => {
        let persistence = new PaymentMethodsMemoryPersistence();
        let controller = new PaymentMethodsController();

        service = new PaymentMethodsHttpServiceV1();
        service.configure(httpConfig);

        let references: References = References.fromTuples(
            new Descriptor('service-paymentmethods', 'persistence', 'memory', 'default', '1.0'), persistence,
            new Descriptor('service-paymentmethods', 'controller', 'default', 'default', '1.0'), controller,
            new Descriptor('service-paymentmethods', 'service', 'http', 'default', '1.0'), service
        );
        controller.setReferences(references);
        service.setReferences(references);

        await service.open(null);
    });

    suiteTeardown(async () => {
        await service.close(null);
    });

    setup(() => {
        let url = 'http://localhost:3000';
        rest = restify.createJsonClient({ url: url, version: '*' });
    });


    test('CRUD Operations', async () => {
        let paymentMethod1, paymentMethod2: PaymentMethodV1;

        // Create one credit method
        let paymentMethod = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/payment_methods/create_payment_method',
                {
                    method: PAYMENT_METHOD1
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        assert.isObject(paymentMethod);
        TestModel.assertEqualPaymentMethod(paymentMethod, PAYMENT_METHOD1);

        paymentMethod1 = paymentMethod;

        // Create another credit method
        paymentMethod = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/payment_methods/create_payment_method',
                {
                    method: PAYMENT_METHOD2
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        assert.isObject(paymentMethod);
        TestModel.assertEqualPaymentMethod(paymentMethod, PAYMENT_METHOD2);

        paymentMethod2 = paymentMethod;

        // Get all credit methods
        let page = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/payment_methods/get_payment_methods',
                {},
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        assert.isObject(page);
        assert.lengthOf(page.data, 2);

        // Update the credit method
        paymentMethod1.name = 'Updated Card 1';

        paymentMethod = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/payment_methods/update_payment_method',
                {
                    method: paymentMethod1
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        assert.isObject(paymentMethod);
        assert.equal(paymentMethod.name, 'Updated Card 1');
        assert.equal(paymentMethod.id, PAYMENT_METHOD1.id);

        paymentMethod1 = paymentMethod;

        // Delete credit method
        let result = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/payment_methods/delete_payment_method_by_id',
                {
                    method_id: paymentMethod1.id,
                    customer_id: paymentMethod1.customer_id
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        //assert.isNull(result);

        // Try to get delete credit method
        result = await new Promise<any>((resolve, reject) => {
            rest.post('/v1/payment_methods/get_payment_method_by_id',
                {
                    method_id: paymentMethod1.id,
                    customer_id: paymentMethod1.customer_id
                },
                (err, req, res, result) => {
                    if (err == null) resolve(result);
                    else reject(err);
                }
            );
        });

        //assert.isNull(result);
    });
});