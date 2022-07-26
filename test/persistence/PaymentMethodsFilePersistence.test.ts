import { PaymentMethodsFilePersistence } from '../../src/persistence/PaymentMethodsFilePersistence';
import { PaymentMethodsPersistenceFixture } from './PaymentMethodsPersistenceFixture';

suite('PaymentMethodsFilePersistence', ()=> {
    let persistence: PaymentMethodsFilePersistence;
    let fixture: PaymentMethodsPersistenceFixture;
    
    setup(async () => {
        persistence = new PaymentMethodsFilePersistence('./data/payment_methods.test.json');

        fixture = new PaymentMethodsPersistenceFixture(persistence);

        await persistence.open(null);
        await persistence.clear(null);
    });
    
    teardown(async () => {
        await persistence.close(null);
    });
        
    test('CRUD Operations', async () => {
        await fixture.testCrudOperations();
    });

    test('Get with Filters', async () => {
        await fixture.testGetWithFilter();
    });

});