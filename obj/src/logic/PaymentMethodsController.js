"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodsController = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_3 = require("pip-services3-commons-nodex");
const PaymentMethodsCommandSet_1 = require("./PaymentMethodsCommandSet");
class PaymentMethodsController {
    constructor() {
        this._dependencyResolver = new pip_services3_commons_nodex_2.DependencyResolver(PaymentMethodsController._defaultConfig);
    }
    configure(config) {
        this._dependencyResolver.configure(config);
    }
    setReferences(references) {
        this._dependencyResolver.setReferences(references);
        this._persistence = this._dependencyResolver.getOneRequired('persistence');
    }
    getCommandSet() {
        if (this._commandSet == null)
            this._commandSet = new PaymentMethodsCommandSet_1.PaymentMethodsCommandSet(this);
        return this._commandSet;
    }
    getPaymentMethods(correlationId, filter, paging) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._persistence.getPageByFilter(correlationId, filter, paging);
        });
    }
    getPaymentMethodById(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            let method = yield this._persistence.getById(correlationId, id, customerId);
            // Do not allow to access method of different customer
            if (method && method.customer_id != customerId)
                method = null;
            return method;
        });
    }
    createPaymentMethod(correlationId, method) {
        return __awaiter(this, void 0, void 0, function* () {
            method.create_time = new Date();
            method.update_time = new Date();
            return yield this._persistence.create(correlationId, method);
        });
    }
    updatePaymentMethod(correlationId, method) {
        return __awaiter(this, void 0, void 0, function* () {
            let newCard;
            method.update_time = new Date();
            let data = yield this._persistence.getById(correlationId, method.id, method.customer_id);
            if (data && data.customer_id != method.customer_id) {
                throw new pip_services3_commons_nodex_3.BadRequestException(correlationId, 'WRONG_CUST_ID', 'Wrong credit method customer id')
                    .withDetails('id', method.id)
                    .withDetails('customer_id', method.customer_id);
            }
            newCard = yield this._persistence.update(correlationId, method);
            return newCard;
        });
    }
    deletePaymentMethodById(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            let oldCard;
            let data = yield this._persistence.getById(correlationId, id, customerId);
            if (data && data.customer_id != customerId) {
                throw new pip_services3_commons_nodex_3.BadRequestException(correlationId, 'WRONG_CUST_ID', 'Wrong credit method customer id')
                    .withDetails('id', id)
                    .withDetails('customer_id', customerId);
            }
            oldCard = yield this._persistence.delete(correlationId, id, customerId);
            return oldCard;
        });
    }
}
exports.PaymentMethodsController = PaymentMethodsController;
PaymentMethodsController._defaultConfig = pip_services3_commons_nodex_1.ConfigParams.fromTuples('dependencies.persistence', 'service-paymentmethods:persistence:*:*:1.0');
//# sourceMappingURL=PaymentMethodsController.js.map