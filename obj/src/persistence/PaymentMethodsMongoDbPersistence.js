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
exports.PaymentMethodsMongoDbPersistence = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_mongodb_nodex_1 = require("pip-services3-mongodb-nodex");
class PaymentMethodsMongoDbPersistence extends pip_services3_mongodb_nodex_1.IdentifiableMongoDbPersistence {
    constructor() {
        super('payment_methods');
        super.ensureIndex({ customer_id: 1 });
    }
    composeFilter(filter) {
        filter = filter || new pip_services3_commons_nodex_1.FilterParams();
        let criteria = [];
        let id = filter.getAsNullableString('id');
        if (id != null)
            criteria.push({ _id: id });
        // Filter ids
        let ids = filter.getAsObject('ids');
        if (typeof ids === 'string')
            ids = ids.split(',');
        if (Array.isArray(ids))
            criteria.push({ _id: { $in: ids } });
        let type = filter.getAsNullableString('type');
        if (type != null)
            criteria.push({ type: type });
        let _default = filter.getAsNullableBoolean('default');
        if (_default != null)
            criteria.push({ default: _default });
        let customerId = filter.getAsNullableString('customer_id');
        if (customerId != null)
            criteria.push({ customer_id: customerId });
        let payout = filter.getAsNullableBoolean('payout');
        if (payout != null)
            criteria.push({ payout: payout });
        return criteria.length > 0 ? { $and: criteria } : null;
    }
    getPageByFilter(correlationId, filter, paging) {
        const _super = Object.create(null, {
            getPageByFilter: { get: () => super.getPageByFilter }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return yield _super.getPageByFilter.call(this, correlationId, this.composeFilter(filter), paging, null, null);
        });
    }
    getById(correlationId, id, customerId) {
        const _super = Object.create(null, {
            getOneById: { get: () => super.getOneById }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return yield _super.getOneById.call(this, correlationId, id);
        });
    }
    delete(correlationId, id, customerId) {
        const _super = Object.create(null, {
            deleteById: { get: () => super.deleteById }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return yield _super.deleteById.call(this, correlationId, id);
        });
    }
}
exports.PaymentMethodsMongoDbPersistence = PaymentMethodsMongoDbPersistence;
//# sourceMappingURL=PaymentMethodsMongoDbPersistence.js.map