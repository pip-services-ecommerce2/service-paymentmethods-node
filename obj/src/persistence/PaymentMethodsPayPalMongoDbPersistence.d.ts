import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { ConfigParams } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { IReferenceable } from 'pip-services3-commons-nodex';
import { IOpenable } from 'pip-services3-commons-nodex';
import { ICleanable } from 'pip-services3-commons-nodex';
import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';
import { IPaymentMethodsPersistence } from './IPaymentMethodsPersistence';
export declare class PaymentMethodsPayPalMongoDbPersistence implements IPaymentMethodsPersistence, IConfigurable, IReferenceable, IOpenable, ICleanable {
    private _mongoPersistence;
    private _payPalPersistence;
    constructor();
    configure(config: ConfigParams): void;
    setReferences(references: IReferences): void;
    isOpen(): boolean;
    open(correlationId: string): Promise<void>;
    close(correlationId: string): Promise<void>;
    getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>>;
    getById(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1>;
    create(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1>;
    update(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1>;
    delete(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1>;
    clear(correlationId: string, callback?: (err: any) => void): Promise<void>;
    private maskCardNumber;
}
