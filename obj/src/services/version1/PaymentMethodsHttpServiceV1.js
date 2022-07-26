"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodsHttpServiceV1 = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_rpc_nodex_1 = require("pip-services3-rpc-nodex");
class PaymentMethodsHttpServiceV1 extends pip_services3_rpc_nodex_1.CommandableHttpService {
    constructor() {
        super('v1/payment_methods');
        this._dependencyResolver.put('controller', new pip_services3_commons_nodex_1.Descriptor('service-paymentmethods', 'controller', 'default', '*', '1.0'));
    }
}
exports.PaymentMethodsHttpServiceV1 = PaymentMethodsHttpServiceV1;
//# sourceMappingURL=PaymentMethodsHttpServiceV1.js.map