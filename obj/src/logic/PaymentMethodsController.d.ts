import { ConfigParams } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { IReferenceable } from 'pip-services3-commons-nodex';
import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { ICommandable } from 'pip-services3-commons-nodex';
import { CommandSet } from 'pip-services3-commons-nodex';
import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';
import { IPaymentMethodsController } from './IPaymentMethodsController';
export declare class PaymentMethodsController implements IConfigurable, IReferenceable, ICommandable, IPaymentMethodsController {
    private static _defaultConfig;
    private _dependencyResolver;
    private _persistence;
    private _commandSet;
    configure(config: ConfigParams): void;
    setReferences(references: IReferences): void;
    getCommandSet(): CommandSet;
    getPaymentMethods(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>>;
    getPaymentMethodById(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1>;
    createPaymentMethod(correlationId: string, method: PaymentMethodV1): Promise<PaymentMethodV1>;
    updatePaymentMethod(correlationId: string, method: PaymentMethodV1): Promise<PaymentMethodV1>;
    deletePaymentMethodById(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1>;
}
