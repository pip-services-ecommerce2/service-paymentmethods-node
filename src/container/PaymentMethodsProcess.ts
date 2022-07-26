import { ProcessContainer } from 'pip-services3-container-nodex';

import { PaymentMethodsServiceFactory } from '../build/PaymentMethodsServiceFactory';
import { DefaultRpcFactory } from 'pip-services3-rpc-nodex';

export class PaymentMethodsProcess extends ProcessContainer {

    public constructor() {
        super("payment_methods", "Payment methods microservice");
        this._factories.add(new PaymentMethodsServiceFactory);
        this._factories.add(new DefaultRpcFactory);
    }

}
