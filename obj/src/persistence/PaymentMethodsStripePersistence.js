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
exports.PaymentMethodsStripePersistence = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_3 = require("pip-services3-commons-nodex");
const PaymentMethodTypeV1_1 = require("../data/version1/PaymentMethodTypeV1");
const StripeCardsConnector_1 = require("./stripe/StripeCardsConnector");
const StripeBankAccountsConnector_1 = require("./stripe/StripeBankAccountsConnector");
const StripeExternalCardsConnector_1 = require("./stripe/StripeExternalCardsConnector");
const StripeExternalBankAccountsConnector_1 = require("./stripe/StripeExternalBankAccountsConnector");
class PaymentMethodsStripePersistence {
    constructor() {
        this._stripeCardsConnector = new StripeCardsConnector_1.StripeCardsConnector();
        this._stripeBankAccountsConnector = new StripeBankAccountsConnector_1.StripeBankAccountsConnector();
        this._stripeExternalCardsConnector = new StripeExternalCardsConnector_1.StripeExternalCardsConnector();
        this._stripeExternalBankAccountsConnector = new StripeExternalBankAccountsConnector_1.StripeExternalBankAccountsConnector();
    }
    configure(config) {
        if (this._stripeCardsConnector)
            this._stripeCardsConnector.configure(config);
        if (this._stripeBankAccountsConnector)
            this._stripeBankAccountsConnector.configure(config);
        if (this._stripeExternalCardsConnector)
            this._stripeExternalCardsConnector.configure(config);
        if (this._stripeExternalBankAccountsConnector)
            this._stripeExternalBankAccountsConnector.configure(config);
    }
    setReferences(references) {
        if (this._stripeCardsConnector)
            this._stripeCardsConnector.setReferences(references);
        if (this._stripeBankAccountsConnector)
            this._stripeBankAccountsConnector.setReferences(references);
        if (this._stripeExternalCardsConnector)
            this._stripeExternalCardsConnector.setReferences(references);
        if (this._stripeExternalBankAccountsConnector)
            this._stripeExternalBankAccountsConnector.setReferences(references);
    }
    isOpen() {
        var _a, _b, _c, _d;
        return ((_a = this._stripeCardsConnector) === null || _a === void 0 ? void 0 : _a.isOpen())
            || ((_b = this._stripeBankAccountsConnector) === null || _b === void 0 ? void 0 : _b.isOpen())
            || ((_c = this._stripeExternalCardsConnector) === null || _c === void 0 ? void 0 : _c.isOpen())
            || ((_d = this._stripeExternalBankAccountsConnector) === null || _d === void 0 ? void 0 : _d.isOpen());
    }
    open(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            // create stripe cards connector
            yield this._stripeCardsConnector.open(correlationId);
            // create stripe bank accounts connector
            yield this._stripeBankAccountsConnector.open(correlationId);
            // create stripe external cards connector
            yield this._stripeExternalCardsConnector.open(correlationId);
            // create stripe external bank accounts connector
            yield this._stripeExternalBankAccountsConnector.open(correlationId);
        });
    }
    close(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            // close stripe cards connector
            yield this._stripeCardsConnector.close(correlationId);
            this._stripeCardsConnector = null;
            // close stripe bank accounts connector
            yield this._stripeBankAccountsConnector.close(correlationId);
            this._stripeBankAccountsConnector = null;
            // close stripe external cards connector
            yield this._stripeExternalCardsConnector.close(correlationId);
            this._stripeExternalCardsConnector = null;
            // close stripe external accounts connector
            this._stripeExternalBankAccountsConnector.close(correlationId);
            this._stripeExternalBankAccountsConnector = null;
        });
    }
    getPageByFilter(correlationId, filter, paging) {
        return __awaiter(this, void 0, void 0, function* () {
            let pageSize = 100;
            let pages = yield Promise.all([
                this._stripeCardsConnector.getPageByFilterAsync(correlationId, filter, new pip_services3_commons_nodex_1.PagingParams(0, pageSize)),
                this._stripeBankAccountsConnector.getPageByFilterAsync(correlationId, filter, new pip_services3_commons_nodex_1.PagingParams(0, pageSize)),
                this._stripeExternalCardsConnector.getPageByFilterAsync(correlationId, filter, new pip_services3_commons_nodex_1.PagingParams(0, pageSize)),
                this._stripeExternalBankAccountsConnector.getPageByFilterAsync(correlationId, filter, new pip_services3_commons_nodex_1.PagingParams(0, pageSize))
            ]);
            let methods = [];
            pages.forEach(page => methods = methods.concat(...page.data));
            return this.buildPageByFilter(correlationId, filter, paging, methods);
        });
    }
    getById(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            let methods = yield Promise.all([
                this._stripeCardsConnector.getByIdAsync(correlationId, id, customerId),
                this._stripeBankAccountsConnector.getByIdAsync(correlationId, id, customerId),
                this._stripeExternalCardsConnector.getByIdAsync(correlationId, id, customerId),
                this._stripeExternalBankAccountsConnector.getByIdAsync(correlationId, id, customerId)
            ]);
            return methods === null || methods === void 0 ? void 0 : methods.find(x => x != null);
        });
    }
    create(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            let connector = this.getConnectorByType(item);
            if (connector == null) {
                throw new pip_services3_commons_nodex_3.BadRequestException(correlationId, 'ERR_PAYMENT_TYPE', 'Payment type not supported')
                    .withDetails('item.type', item.type);
            }
            return yield connector.createAsync(correlationId, item);
        });
    }
    update(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            var connector = this.getConnectorByType(item);
            if (connector == null) {
                throw new pip_services3_commons_nodex_3.BadRequestException(correlationId, 'ERR_PAYMENT_TYPE', 'Payment type not supported')
                    .withDetails('item.type', item.type);
            }
            return yield connector.updateAsync(correlationId, item);
        });
    }
    delete(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            let methods = yield Promise.all([
                this._stripeCardsConnector.deleteAsync(correlationId, id, customerId),
                this._stripeBankAccountsConnector.deleteAsync(correlationId, id, customerId),
                this._stripeExternalCardsConnector.deleteAsync(correlationId, id, customerId),
                this._stripeExternalBankAccountsConnector.deleteAsync(correlationId, id, customerId)
            ]);
            return methods === null || methods === void 0 ? void 0 : methods.find(x => x != null);
        });
    }
    clear(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([
                this._stripeCardsConnector.clearAsync(correlationId),
                this._stripeBankAccountsConnector.clearAsync(correlationId),
                this._stripeExternalCardsConnector.clearAsync(correlationId),
                this._stripeExternalBankAccountsConnector.clearAsync(correlationId),
            ]);
        });
    }
    buildPageByFilter(correlationId, filter, paging, methods) {
        let id = filter.getAsNullableString('id');
        let customerId = filter.getAsNullableString('customer_id');
        let saved = filter.getAsNullableBoolean('saved');
        let _default = filter.getAsNullableBoolean('default');
        let type = filter.getAsNullableString('type');
        let ids = filter.getAsObject('ids');
        let payout = filter.getAsNullableBoolean('payout');
        // Process ids filter
        if (typeof ids === 'string')
            ids = ids.split(',');
        if (!Array.isArray(ids))
            ids = null;
        let skip = paging.getSkip(0);
        let take = paging.getTake(100);
        let items = [];
        let checkFilter = {
            id: id,
            default: _default,
            saved: saved,
            type: type,
            ids: ids,
            customerId: customerId,
            payout: payout
        };
        for (let item of methods) {
            // Filter items
            if (!this.checkItem(checkFilter, item))
                continue;
            // Process skip and take
            if (skip > 0) {
                skip--;
                continue;
            }
            if (items.length < take)
                items.push(item);
            if (items.length >= take)
                break;
        }
        return new pip_services3_commons_nodex_2.DataPage(items);
    }
    checkItem(filter, item) {
        if (filter.id != null && item.id != filter.id)
            return false;
        if (filter.default != null && item.default != filter.default)
            return false;
        if (filter.saved != null && item.saved != filter.saved)
            return false;
        if (filter.type != null && item.type != filter.type)
            return false;
        if (filter.ids != null && filter.ids.indexOf(item.id) < 0)
            return false;
        if (filter.customerId != null && item.customer_id != filter.customerId)
            return false;
        if (filter.payout != null && item.payout != filter.payout)
            return false;
        return true;
    }
    getConnectorByType(item) {
        if (item.payout) {
            if (item.type == PaymentMethodTypeV1_1.PaymentMethodTypeV1.Card)
                return this._stripeExternalCardsConnector;
            if (item.type == PaymentMethodTypeV1_1.PaymentMethodTypeV1.BankAccount)
                return this._stripeExternalBankAccountsConnector;
        }
        else {
            if (item.type == PaymentMethodTypeV1_1.PaymentMethodTypeV1.Card)
                return this._stripeCardsConnector;
            if (item.type == PaymentMethodTypeV1_1.PaymentMethodTypeV1.BankAccount)
                return this._stripeBankAccountsConnector;
        }
        return null;
    }
}
exports.PaymentMethodsStripePersistence = PaymentMethodsStripePersistence;
//# sourceMappingURL=PaymentMethodsStripePersistence.js.map