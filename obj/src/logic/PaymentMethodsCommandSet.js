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
exports.PaymentMethodsCommandSet = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_3 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_4 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_5 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_6 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_7 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_8 = require("pip-services3-commons-nodex");
const PaymentMethodV1Schema_1 = require("../data/version1/PaymentMethodV1Schema");
class PaymentMethodsCommandSet extends pip_services3_commons_nodex_1.CommandSet {
    constructor(logic) {
        super();
        this._logic = logic;
        // Register commands to the database
        this.addCommand(this.makeGetPaymentMethodsCommand());
        this.addCommand(this.makeGetPaymentMethodByIdCommand());
        this.addCommand(this.makeCreatePaymentMethodCommand());
        this.addCommand(this.makeUpdatePaymentMethodCommand());
        this.addCommand(this.makeDeletePaymentMethodByIdCommand());
    }
    makeGetPaymentMethodsCommand() {
        return new pip_services3_commons_nodex_2.Command("get_payment_methods", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withOptionalProperty('filter', new pip_services3_commons_nodex_7.FilterParamsSchema())
            .withOptionalProperty('paging', new pip_services3_commons_nodex_8.PagingParamsSchema()), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let filter = pip_services3_commons_nodex_3.FilterParams.fromValue(args.get("filter"));
            let paging = pip_services3_commons_nodex_4.PagingParams.fromValue(args.get("paging"));
            return yield this._logic.getPaymentMethods(correlationId, filter, paging);
        }));
    }
    makeGetPaymentMethodByIdCommand() {
        return new pip_services3_commons_nodex_2.Command("get_payment_method_by_id", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty('method_id', pip_services3_commons_nodex_6.TypeCode.String)
            .withRequiredProperty('customer_id', pip_services3_commons_nodex_6.TypeCode.String), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let methodId = args.getAsString("method_id");
            let customerId = args.getAsString("customer_id");
            return yield this._logic.getPaymentMethodById(correlationId, methodId, customerId);
        }));
    }
    makeCreatePaymentMethodCommand() {
        return new pip_services3_commons_nodex_2.Command("create_payment_method", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty('method', new PaymentMethodV1Schema_1.PaymentMethodV1Schema()), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let method = args.get("method");
            return yield this._logic.createPaymentMethod(correlationId, method);
        }));
    }
    makeUpdatePaymentMethodCommand() {
        return new pip_services3_commons_nodex_2.Command("update_payment_method", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty('method', new PaymentMethodV1Schema_1.PaymentMethodV1Schema()), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let method = args.get("method");
            return yield this._logic.updatePaymentMethod(correlationId, method);
        }));
    }
    makeDeletePaymentMethodByIdCommand() {
        return new pip_services3_commons_nodex_2.Command("delete_payment_method_by_id", new pip_services3_commons_nodex_5.ObjectSchema(true)
            .withRequiredProperty('method_id', pip_services3_commons_nodex_6.TypeCode.String)
            .withRequiredProperty('customer_id', pip_services3_commons_nodex_6.TypeCode.String), (correlationId, args) => __awaiter(this, void 0, void 0, function* () {
            let methodId = args.getAsNullableString("method_id");
            let customerId = args.getAsString("customer_id");
            return yield this._logic.deletePaymentMethodById(correlationId, methodId, customerId);
        }));
    }
}
exports.PaymentMethodsCommandSet = PaymentMethodsCommandSet;
//# sourceMappingURL=PaymentMethodsCommandSet.js.map