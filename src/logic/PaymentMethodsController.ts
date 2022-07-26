import { ConfigParams } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { IReferenceable } from 'pip-services3-commons-nodex';
import { DependencyResolver } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { ICommandable } from 'pip-services3-commons-nodex';
import { CommandSet } from 'pip-services3-commons-nodex';
import { BadRequestException } from 'pip-services3-commons-nodex';

import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';
import { IPaymentMethodsPersistence } from '../persistence/IPaymentMethodsPersistence';
import { IPaymentMethodsController } from './IPaymentMethodsController';
import { PaymentMethodsCommandSet } from './PaymentMethodsCommandSet';

export class PaymentMethodsController implements  IConfigurable, IReferenceable, ICommandable, IPaymentMethodsController {
    private static _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        'dependencies.persistence', 'service-paymentmethods:persistence:*:*:1.0'
    );

    private _dependencyResolver: DependencyResolver = new DependencyResolver(PaymentMethodsController._defaultConfig);
    private _persistence: IPaymentMethodsPersistence;
    private _commandSet: PaymentMethodsCommandSet;

    public configure(config: ConfigParams): void {
        this._dependencyResolver.configure(config);
    }

    public setReferences(references: IReferences): void {
        this._dependencyResolver.setReferences(references);
        this._persistence = this._dependencyResolver.getOneRequired<IPaymentMethodsPersistence>('persistence');
    }

    public getCommandSet(): CommandSet {
        if (this._commandSet == null)
            this._commandSet = new PaymentMethodsCommandSet(this);
        return this._commandSet;
    }
    
    public async getPaymentMethods(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>> {
        return await this._persistence.getPageByFilter(correlationId, filter, paging);
    }

    public async getPaymentMethodById(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        let method = await this._persistence.getById(correlationId, id, customerId);

        // Do not allow to access method of different customer
        if (method && method.customer_id != customerId)
            method = null;

        return method;
    }

    public async createPaymentMethod(correlationId: string, method: PaymentMethodV1): Promise<PaymentMethodV1> {

        method.create_time = new Date();
        method.update_time = new Date();

        return await this._persistence.create(correlationId, method);
    }

    public async updatePaymentMethod(correlationId: string, method: PaymentMethodV1): Promise<PaymentMethodV1> {
        let newCard: PaymentMethodV1;

        method.update_time = new Date();
        
        let data = await this._persistence.getById(correlationId, method.id, method.customer_id);

        if (data && data.customer_id != method.customer_id) {
            throw new BadRequestException(correlationId, 'WRONG_CUST_ID', 'Wrong credit method customer id')
                .withDetails('id', method.id)
                .withDetails('customer_id', method.customer_id);
        }

        newCard = await this._persistence.update(correlationId, method);

        return newCard;
    }

    public async deletePaymentMethodById(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {  
        let oldCard: PaymentMethodV1;

        let data = await this._persistence.getById(correlationId, id, customerId)

        if (data && data.customer_id != customerId) {
            throw new BadRequestException(correlationId, 'WRONG_CUST_ID', 'Wrong credit method customer id')
                .withDetails('id', id)
                .withDetails('customer_id', customerId);
        }

        oldCard = await this._persistence.delete(correlationId, id, customerId);

        return oldCard;
    }
}
