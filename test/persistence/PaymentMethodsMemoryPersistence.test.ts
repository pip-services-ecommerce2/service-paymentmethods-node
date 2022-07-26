import { ConfigParams } from 'pip-services3-commons-nodex';

import { PaymentMethodsMemoryPersistence } from '../../src/persistence/PaymentMethodsMemoryPersistence';
import { PaymentMethodsPersistenceFixture } from './PaymentMethodsPersistenceFixture';

suite('PaymentMethodsMemoryPersistence', ()=> {
    let persistence: PaymentMethodsMemoryPersistence;
    let fixture: PaymentMethodsPersistenceFixture;
    
    setup(async () => {
        persistence = new PaymentMethodsMemoryPersistence();
        persistence.configure(new ConfigParams());
        
        fixture = new PaymentMethodsPersistenceFixture(persistence);
        
        await persistence.open(null);
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