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
exports.PaymentMethodsPayPalMongoDbPersistence = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const PaymentMethodTypeV1_1 = require("../data/version1/PaymentMethodTypeV1");
const PaymentMethodsPayPalPersistence_1 = require("./PaymentMethodsPayPalPersistence");
const PaymentMethodsMongoDbPersistence_1 = require("./PaymentMethodsMongoDbPersistence");
class PaymentMethodsPayPalMongoDbPersistence {
    constructor() {
        this._mongoPersistence = new PaymentMethodsMongoDbPersistence_1.PaymentMethodsMongoDbPersistence;
        this._payPalPersistence = new PaymentMethodsPayPalPersistence_1.PaymentMethodsPayPalPersistence();
    }
    configure(config) {
        if (this._mongoPersistence)
            this._mongoPersistence.configure(config);
        if (this._payPalPersistence)
            this._payPalPersistence.configure(config);
    }
    setReferences(references) {
        if (this._mongoPersistence)
            this._mongoPersistence.setReferences(references);
        if (this._payPalPersistence)
            this._payPalPersistence.setReferences(references);
    }
    isOpen() {
        var _a, _b;
        return ((_a = this._mongoPersistence) === null || _a === void 0 ? void 0 : _a.isOpen()) || ((_b = this._payPalPersistence) === null || _b === void 0 ? void 0 : _b.isOpen());
    }
    open(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            // open mongodb persistence
            yield this._mongoPersistence.open(correlationId);
            // open paypal persistence
            yield this._payPalPersistence.open(correlationId);
        });
    }
    close(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            // close mongodb persistence
            yield this._mongoPersistence.close(correlationId);
            this._mongoPersistence = null;
            // close paypal persistence
            yield this._payPalPersistence.close(correlationId);
            this._payPalPersistence = null;
        });
    }
    getPageByFilter(correlationId, filter, paging) {
        return __awaiter(this, void 0, void 0, function* () {
            let page = yield this._mongoPersistence.getPageByFilter(correlationId, filter, paging);
            if (page) {
                let cardIds = page.data.filter(x => x.type == PaymentMethodTypeV1_1.PaymentMethodTypeV1.Card).map(x => x.id);
                if (cardIds.length == 0) {
                    return page;
                }
                let cardsFilter = pip_services3_commons_nodex_1.FilterParams.fromValue({
                    ids: cardIds
                });
                let cards = yield this._payPalPersistence.getPageByFilter(correlationId, cardsFilter, paging);
                cards.data.forEach((value, index, array) => {
                    let item = page.data.find(x => x.id == value.id);
                    if (item) {
                        item.card.number = value.card.number;
                    }
                });
            }
            return page;
        });
    }
    getById(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            let item = yield this._mongoPersistence.getOneById(correlationId, id);
            if (!item || item.type != PaymentMethodTypeV1_1.PaymentMethodTypeV1.Card || item.payout) {
                return item;
            }
            return yield this._payPalPersistence.getById(correlationId, id, customerId);
        });
    }
    create(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (item.type == PaymentMethodTypeV1_1.PaymentMethodTypeV1.Card && !item.payout) {
                item = yield this._payPalPersistence.create(correlationId, item);
                item.card.number = this.maskCardNumber(item.card.number);
                return yield this._mongoPersistence.create(correlationId, item);
            }
            else {
                return yield this._mongoPersistence.create(correlationId, item);
            }
        });
    }
    update(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (item.type == PaymentMethodTypeV1_1.PaymentMethodTypeV1.Card && !item.payout) {
                item = yield this._payPalPersistence.update(correlationId, item);
                item.card.number = this.maskCardNumber(item.card.number);
                return yield this._mongoPersistence.update(correlationId, item);
            }
            else {
                return yield this._mongoPersistence.update(correlationId, item);
            }
        });
    }
    delete(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            let item = yield this._mongoPersistence.delete(correlationId, id, customerId);
            if (!item || item.type != PaymentMethodTypeV1_1.PaymentMethodTypeV1.Card || item.payout) {
                return item;
            }
            return yield this._payPalPersistence.delete(correlationId, id, customerId);
        });
    }
    clear(correlationId, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([
                this._mongoPersistence.clear(correlationId),
                this._payPalPersistence.clear(correlationId)
            ]);
        });
    }
    maskCardNumber(pan) {
        var _a;
        let len = (_a = pan === null || pan === void 0 ? void 0 : pan.length) !== null && _a !== void 0 ? _a : 0;
        if (len > 10) {
            let bin = pan.substr(0, 6);
            let last4 = pan.substr(len - 4);
            return bin + '*'.repeat(len - 10) + last4;
        }
        if (len > 4) {
            let last4 = pan.substr(len - 4);
            return '*'.repeat(len - 10) + last4;
        }
        return pan;
    }
}
exports.PaymentMethodsPayPalMongoDbPersistence = PaymentMethodsPayPalMongoDbPersistence;
//# sourceMappingURL=PaymentMethodsPayPalMongoDbPersistence.js.map