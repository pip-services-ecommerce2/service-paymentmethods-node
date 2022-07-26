import { ConfigParams } from 'pip-services3-commons-nodex';

import { PaymentMethodsStripePersistence } from '../../src/persistence/PaymentMethodsStripePersistence';
import { PaymentMethodsPersistenceFixture } from './PaymentMethodsPersistenceFixture';

suite('PaymentMethodsStripePersistence', () => {
    let terminate: boolean = false;

    let persistence: PaymentMethodsStripePersistence;
    let fixture: PaymentMethodsPersistenceFixture;

    setup(async () => {
        var STRIPE_ACCESS_KEY = process.env["STRIPE_ACCESS_KEY"];

        if (!STRIPE_ACCESS_KEY) {
            terminate = true;
            return;
        }

        var config = ConfigParams.fromTuples(
            'connection.host', 'api.stripe.com',
            'connection.timeout', 8000,
            'credential.access_key', STRIPE_ACCESS_KEY
        );

        persistence = new PaymentMethodsStripePersistence();
        persistence.configure(config);

        fixture = new PaymentMethodsPersistenceFixture(persistence);

        await persistence.open(null);
        await persistence.clear(null);
    });

    teardown(async () => {
        if (terminate) {
            return;
        }

        await persistence.close(null);
    });

    test('External bank account for payouts', () => {
        if (terminate) {
            return;
        }

        // await fixture.testExternalBankAccount();
    });
    
    test('External card for payouts', () => {
        if (terminate) {
            return;
        }

        // await fixture.testExternalCard(done);
    });

    test('CRUD Operations', async () => {
        if (terminate) {
            return;
        }

        await fixture.testCrudOperations();
    });

    test('Get with Filters', async () => {
        if (terminate) {
            return;
        }

        await fixture.testGetWithFilter();
    });
});