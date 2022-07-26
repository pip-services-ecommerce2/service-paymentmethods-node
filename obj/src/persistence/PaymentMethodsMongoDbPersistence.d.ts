import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { IdentifiableMongoDbPersistence } from 'pip-services3-mongodb-nodex';
import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';
import { IPaymentMethodsPersistence } from './IPaymentMethodsPersistence';
export declare class PaymentMethodsMongoDbPersistence extends IdentifiableMongoDbPersistence<PaymentMethodV1, string> implements IPaymentMethodsPersistence {
    constructor();
    private composeFilter;
    getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>>;
    getById(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1>;
    delete(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1>;
}
