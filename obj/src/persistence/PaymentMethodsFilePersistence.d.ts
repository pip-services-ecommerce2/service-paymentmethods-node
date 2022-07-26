import { ConfigParams } from 'pip-services3-commons-nodex';
import { JsonFilePersister } from 'pip-services3-data-nodex';
import { PaymentMethodsMemoryPersistence } from './PaymentMethodsMemoryPersistence';
import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';
export declare class PaymentMethodsFilePersistence extends PaymentMethodsMemoryPersistence {
    protected _persister: JsonFilePersister<PaymentMethodV1>;
    constructor(path?: string);
    configure(config: ConfigParams): void;
}
