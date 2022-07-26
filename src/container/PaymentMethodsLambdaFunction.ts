import { Descriptor } from 'pip-services3-commons-nodex';
import { CommandableLambdaFunction } from 'pip-services3-aws-nodex';
import { PaymentMethodsServiceFactory } from '../build/PaymentMethodsServiceFactory';

export class PaymentMethodsLambdaFunction extends CommandableLambdaFunction {
    public constructor() {
        super("payment_methods", "Payment methods function");
        this._dependencyResolver.put('controller', new Descriptor('service-paymentmethods', 'controller', 'default', '*', '*'));
        this._factories.add(new PaymentMethodsServiceFactory());
    }
}

export const handler = new PaymentMethodsLambdaFunction().getHandler();