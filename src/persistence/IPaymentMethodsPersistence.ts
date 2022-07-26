import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';

import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';

export interface IPaymentMethodsPersistence {
    getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>>;

    getById(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1>;

    create(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1>;

    update(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1>;

    delete(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1>;
}
