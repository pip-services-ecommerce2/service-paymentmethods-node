"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.PaymentMethodsLambdaFunction = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_aws_nodex_1 = require("pip-services3-aws-nodex");
const PaymentMethodsServiceFactory_1 = require("../build/PaymentMethodsServiceFactory");
class PaymentMethodsLambdaFunction extends pip_services3_aws_nodex_1.CommandableLambdaFunction {
    constructor() {
        super("payment_methods", "Payment methods function");
        this._dependencyResolver.put('controller', new pip_services3_commons_nodex_1.Descriptor('service-paymentmethods', 'controller', 'default', '*', '*'));
        this._factories.add(new PaymentMethodsServiceFactory_1.PaymentMethodsServiceFactory());
    }
}
exports.PaymentMethodsLambdaFunction = PaymentMethodsLambdaFunction;
exports.handler = new PaymentMethodsLambdaFunction().getHandler();
//# sourceMappingURL=PaymentMethodsLambdaFunction.js.map