import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { IdentifiableMemoryPersistence } from 'pip-services3-data-nodex';

import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';
import { IPaymentMethodsPersistence } from './IPaymentMethodsPersistence';

export class PaymentMethodsMemoryPersistence
    extends IdentifiableMemoryPersistence<PaymentMethodV1, string>
    implements IPaymentMethodsPersistence {

    constructor() {
        super();
    }

    private contains(array1, array2) {
        if (array1 == null || array2 == null) return false;

        for (let i1 = 0; i1 < array1.length; i1++) {
            for (let i2 = 0; i2 < array2.length; i2++)
                if (array1[i1] == array2[i1])
                    return true;
        }

        return false;
    }

    private composeFilter(filter: FilterParams): any {
        filter = filter || new FilterParams();

        let id = filter.getAsNullableString('id');
        let type = filter.getAsNullableString('type');
        let customerId = filter.getAsNullableString('customer_id');
        let _default = filter.getAsNullableBoolean('default');
        let ids = filter.getAsObject('ids');
        let payout = filter.getAsNullableBoolean('payout');

        // Process ids filter
        if (typeof ids === 'string')
            ids = ids.split(',');
        if (!Array.isArray(ids))
            ids = null;

        return (item) => {
            if (id && item.id != id)
                return false;
            if (ids && ids.indexOf(item.id) < 0)
                return false;
            if (type && item.type != type)
                return false;
            if (_default && item.default != _default)
                return false;
            if (customerId && item.customer_id != customerId)
                return false;
            if (payout && item.payout != payout)
                return false;
                
            return true;
        };
    }

    public async getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>> {
        return await super.getPageByFilter(correlationId, this.composeFilter(filter), paging, null, null);
    }

    public async getById(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        return await super.getOneById(correlationId, id);
    }

    public async delete(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        return await super.deleteById(correlationId, id);
    }
}
