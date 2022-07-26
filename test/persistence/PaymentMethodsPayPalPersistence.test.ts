import { ConfigParams } from 'pip-services3-commons-nodex';

import { PaymentMethodsPayPalPersistence } from '../../src/persistence/PaymentMethodsPayPalPersistence';
import { PaymentMethodsPersistenceFixture } from './PaymentMethodsPersistenceFixture';
import { TestModel } from '../data/TestModel';

suite('PaymentMethodsPayPalPersistence', ()=> {
    var PAYPAL_ACCESS_ID = process.env["PAYPAL_ACCESS_ID"] || "";
    var PAYPAL_ACCESS_KEY = process.env["PAYPAL_ACCESS_KEY"] || "";

    if (!PAYPAL_ACCESS_ID || !PAYPAL_ACCESS_KEY)
        return;

    var config = ConfigParams.fromTuples(
        'credential.access_id', PAYPAL_ACCESS_ID,
        'credential.access_key', PAYPAL_ACCESS_KEY,
        'options.sandbox', true
    );

    let persistence: PaymentMethodsPayPalPersistence;
    let fixture: PaymentMethodsPersistenceFixture;
    
    suiteSetup(async () => {
        persistence = new PaymentMethodsPayPalPersistence();
        persistence.configure(config);
        
        fixture = new PaymentMethodsPersistenceFixture(persistence, [
            TestModel.createPaymentMethod2(),
            TestModel.createPaymentMethod3(),
            TestModel.createPaymentMethod4(),
        ]);
        
        await persistence.open(null);
    });
    
    suiteTeardown(async () => {
        await persistence.close(null);
    });

    setup(async() => {
        await persistence.clear(null);
    });
        
    test('CRUD Operations', async () => {
        await fixture.testCrudOperations();
    });

    test('Get with Filters', async () => {
        await fixture.testGetWithFilter();
    });
});