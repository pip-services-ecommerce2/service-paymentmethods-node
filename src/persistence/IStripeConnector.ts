import { PaymentMethodV1 } from "../data/version1/PaymentMethodV1";
import { FilterParams } from "pip-services3-commons-nodex";
import { DataPage } from "pip-services3-commons-nodex";
import { PagingParams } from "pip-services3-commons-nodex";
import { IOpenable } from "pip-services3-commons-nodex";
import { IConfigurable } from "pip-services3-commons-nodex";
import { IReferenceable } from "pip-services3-commons-nodex";


export interface IStripeConnector extends IOpenable, IConfigurable, IReferenceable
{
    getPageByFilterAsync(correlationId: string, filter: FilterParams, paging: PagingParams) : Promise<DataPage<PaymentMethodV1>>;
    getByIdAsync(correlationId: string, id: string, customerId: string) : Promise<PaymentMethodV1>;
    createAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1>;
    updateAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1>;
    deleteAsync(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1>;
    clearAsync(correlationId: string): Promise<void>;
}