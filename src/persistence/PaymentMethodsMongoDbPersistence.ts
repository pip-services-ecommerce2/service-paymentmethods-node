import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { IdentifiableMongoDbPersistence } from 'pip-services3-mongodb-nodex';

import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';
import { IPaymentMethodsPersistence } from './IPaymentMethodsPersistence';

export class PaymentMethodsMongoDbPersistence
    extends IdentifiableMongoDbPersistence<PaymentMethodV1, string>
    implements IPaymentMethodsPersistence {

    constructor() {
        super('payment_methods');
        super.ensureIndex({ customer_id: 1 });
    }
    
    private composeFilter(filter: any) {
        filter = filter || new FilterParams();

        let criteria = [];

        let id = filter.getAsNullableString('id');
        if (id != null)
            criteria.push({ _id: id });

        // Filter ids
        let ids = filter.getAsObject('ids');
        if (typeof ids === 'string')
            ids = ids.split(',');
        if (Array.isArray(ids))
            criteria.push({ _id: { $in: ids } });
            
        let type = filter.getAsNullableString('type');
        if (type != null)
            criteria.push({ type: type });
        
        let _default = filter.getAsNullableBoolean('default');
        if (_default != null)
            criteria.push({ default: _default });

        let customerId = filter.getAsNullableString('customer_id');
        if (customerId != null)
            criteria.push({ customer_id: customerId });
        
        let payout = filter.getAsNullableBoolean('payout');
        if (payout != null)
            criteria.push({ payout: payout });

        return criteria.length > 0 ? { $and: criteria } : null;
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
