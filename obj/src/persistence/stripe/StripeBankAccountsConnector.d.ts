import { IStripeConnector } from "../IStripeConnector";
import { FilterParams, IReferences } from "pip-services3-commons-nodex";
import { DataPage } from "pip-services3-commons-nodex";
import { PagingParams } from "pip-services3-commons-nodex";
import { ConfigParams } from "pip-services3-commons-nodex";
import { PaymentMethodV1 } from "../../data/version1";
export declare class StripeBankAccountsConnector implements IStripeConnector {
    private _client;
    private _connectionResolver;
    private _credentialsResolver;
    private _logger;
    constructor();
    configure(config: ConfigParams): void;
    setReferences(references: IReferences): void;
    isOpen(): boolean;
    open(correlationId: string): Promise<void>;
    close(correlationId: string): Promise<void>;
    getPageByFilterAsync(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>>;
    getByIdAsync(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1>;
    createAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1>;
    updateAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1>;
    deleteAsync(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1>;
    clearAsync(correlationId: string): Promise<void>;
    private getCustomerIdAsync;
    private toPublicAsync;
    private toPublicCustomerAsync;
    private fromPublicCustomerAsync;
    private getAllCustomerIds;
    private toMetadata;
    private fromMetadata;
}
