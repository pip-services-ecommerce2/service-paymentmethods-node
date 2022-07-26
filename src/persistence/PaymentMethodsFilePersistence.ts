import { ConfigParams } from 'pip-services3-commons-nodex';
import { JsonFilePersister } from 'pip-services3-data-nodex';

import { PaymentMethodsMemoryPersistence } from './PaymentMethodsMemoryPersistence';
import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';

export class PaymentMethodsFilePersistence extends PaymentMethodsMemoryPersistence {
	protected _persister: JsonFilePersister<PaymentMethodV1>;

    public constructor(path?: string) {
        super();

        this._persister = new JsonFilePersister<PaymentMethodV1>(path);
        this._loader = this._persister;
        this._saver = this._persister;
    }

    public configure(config: ConfigParams): void {
        super.configure(config);
        this._persister.configure(config);
    }
}