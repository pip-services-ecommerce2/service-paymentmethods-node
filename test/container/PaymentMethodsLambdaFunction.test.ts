const assert = require('chai').assert;

import { ConfigParams } from 'pip-services3-commons-nodex';

import { PaymentMethodV1 } from '../../src/data/version1/PaymentMethodV1';
import { PaymentMethodsLambdaFunction } from '../../src/container/PaymentMethodsLambdaFunction';
import { TestModel } from '../data/TestModel';

let PAYMENT_METHOD1: PaymentMethodV1 = TestModel.createPaymentMethod1();
let PAYMENT_METHOD2: PaymentMethodV1 = TestModel.createPaymentMethod2();

suite('PaymentMethodsLambdaFunction', () => {
    let lambda: PaymentMethodsLambdaFunction;

    suiteSetup(async () => {
        let config = ConfigParams.fromTuples(
            'logger.descriptor', 'pip-services:logger:console:default:1.0',
            'persistence.descriptor', 'service-paymentmethods:persistence:memory:default:1.0',
            'controller.descriptor', 'service-paymentmethods:controller:default:default:1.0'
        );

        lambda = new PaymentMethodsLambdaFunction();
        lambda.configure(config);
        await lambda.open(null);
    });

    suiteTeardown(async () => {
        await lambda.close(null);
    });

    test('CRUD Operations', async () => {
        var paymentMethod1, paymentMethod2: PaymentMethodV1;

        // Create one credit method
        let paymentMethod = await lambda.act(
            {
                role: 'payment_methods',
                cmd: 'create_payment_method',
                method: PAYMENT_METHOD1
            }
        );

        assert.isObject(paymentMethod);
        TestModel.assertEqualPaymentMethod(paymentMethod, PAYMENT_METHOD1);

        paymentMethod1 = paymentMethod;

        // Create another credit method
        paymentMethod = await lambda.act(
            {
                role: 'payment_methods',
                cmd: 'create_payment_method',
                method: PAYMENT_METHOD2
            }
        );

        assert.isObject(paymentMethod);
        TestModel.assertEqualPaymentMethod(paymentMethod, PAYMENT_METHOD2);

        paymentMethod2 = paymentMethod;

        // Get all credit methods
        let page = await lambda.act(
            {
                role: 'payment_methods',
                cmd: 'get_payment_methods'
            }
        );

        assert.isObject(page);
        assert.lengthOf(page.data, 2);

        // Update the credit method
        paymentMethod1.name = 'Updated Card 1';

        paymentMethod = await lambda.act(
            {
                role: 'payment_methods',
                cmd: 'update_payment_method',
                method: paymentMethod1
            }
        );

        assert.isObject(paymentMethod);
        assert.equal(paymentMethod.name, 'Updated Card 1');
        assert.equal(paymentMethod.id, PAYMENT_METHOD1.id);

        paymentMethod1 = paymentMethod;

        // Delete credit method
        await lambda.act(
            {
                role: 'payment_methods',
                cmd: 'delete_payment_method_by_id',
                method_id: paymentMethod1.id,
                customer_id: paymentMethod1.customer_id
            }
        );

        // Try to get delete credit method
        paymentMethod = await lambda.act(
            {
                role: 'payment_methods',
                cmd: 'get_payment_method_by_id',
                method_id: paymentMethod1.id,
                customer_id: paymentMethod1.customer_id
            }
        );

        assert.isNull(paymentMethod || null);
    });
});