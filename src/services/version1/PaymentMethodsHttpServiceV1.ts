import { Descriptor } from 'pip-services3-commons-nodex';
import { CommandableHttpService } from 'pip-services3-rpc-nodex';

export class PaymentMethodsHttpServiceV1 extends CommandableHttpService {
    public constructor() {
        super('v1/payment_methods');
        this._dependencyResolver.put('controller', new Descriptor('service-paymentmethods', 'controller', 'default', '*', '1.0'));
    }
}