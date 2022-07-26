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
exports.PaymentMethodsPayPalPersistence = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_components_nodex_1 = require("pip-services3-components-nodex");
const pip_services3_components_nodex_2 = require("pip-services3-components-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const PaymentMethodV1_1 = require("../data/version1/PaymentMethodV1");
const PaymentMethodTypeV1_1 = require("../data/version1/PaymentMethodTypeV1");
const version1_1 = require("../data/version1");
class PaymentMethodsPayPalPersistence {
    constructor() {
        this._sandbox = false;
        this._credentialsResolver = new pip_services3_components_nodex_1.CredentialResolver();
        this._logger = new pip_services3_components_nodex_2.CompositeLogger();
        this._client = null;
    }
    configure(config) {
        this._logger.configure(config);
        this._credentialsResolver.configure(config);
        this._sandbox = config.getAsBooleanWithDefault("options.sandbox", this._sandbox);
    }
    setReferences(references) {
        this._logger.setReferences(references);
        this._credentialsResolver.setReferences(references);
    }
    isOpen() {
        return this._client != null;
    }
    open(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            let credentials;
            // Get credential params
            credentials = yield this._credentialsResolver.lookup(correlationId);
            // Connect
            this._client = require('paypal-rest-sdk');
            this._client.configure({
                mode: this._sandbox ? 'sandbox' : 'live',
                client_id: credentials.getAccessId(),
                client_secret: credentials.getAccessKey()
            });
        });
    }
    close(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            this._client = null;
        });
    }
    toPublic(value) {
        if (value == null)
            return null;
        // let result = _.omit(value, 'external_customer_id', 'external_method_id',
        //     'external_method_id', 'valid_until', 'create_time', 'update_time', 'links');
        let result = new PaymentMethodV1_1.PaymentMethodV1();
        result.id = value.id;
        result.type = PaymentMethodTypeV1_1.PaymentMethodTypeV1.Card;
        result.payout = false;
        result.card = new version1_1.CreditCardV1();
        result.card.brand = value.type;
        result.card.expire_month = parseInt(value.expire_month);
        result.card.expire_year = parseInt(value.expire_year);
        result.card.first_name = value.first_name;
        result.card.last_name = value.last_name;
        result.card.state = value.state;
        if (value.billing_address) {
            result.billing_address = new version1_1.AddressV1();
            result.billing_address.line1 = value.billing_address.line1;
            result.billing_address.line2 = value.billing_address.line2;
            result.billing_address.city = value.billing_address.city;
            result.billing_address.state = value.billing_address.state;
            result.billing_address.country_code = value.billing_address.country_code;
            result.billing_address.postal_code = value.billing_address.postal_code;
        }
        // Parse external_card_id
        let temp = value.external_card_id.split(';');
        result.card.number = temp.length > 0 ? temp[0] : '';
        result.name = temp.length > 1 ? temp[1] : '';
        result.card.ccv = temp.length > 2 ? temp[2] : '';
        result.saved = temp.length > 3 ? temp[3] == 'saved' : false;
        result.default = temp.length > 4 ? temp[4] == 'default' : false;
        result.customer_id = temp.length > 5 ? temp[5] : value.external_customer_id;
        return result;
    }
    fromPublic(value) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (value == null)
            return null;
        // delete value.create_time;
        // delete value.update_time;
        // let result = _.omit(value, 'id', 'state', 'customer_id', 'ccv', 'name', 'saved', 'default');
        let card = value.card;
        let result = {
            number: card.number,
            type: card.brand,
            expire_month: (_a = card.expire_month) === null || _a === void 0 ? void 0 : _a.toString(),
            expire_year: (_b = card.expire_year) === null || _b === void 0 ? void 0 : _b.toString(),
            first_name: card.first_name,
            last_name: card.last_name,
            billing_address: null,
            external_customer_id: value.customer_id,
            external_card_id: null
        };
        if (value.billing_address) {
            result.billing_address = {
                line1: (_c = value.billing_address) === null || _c === void 0 ? void 0 : _c.line1,
                line2: (_d = value.billing_address) === null || _d === void 0 ? void 0 : _d.line2,
                city: (_e = value.billing_address) === null || _e === void 0 ? void 0 : _e.city,
                state: (_f = value.billing_address) === null || _f === void 0 ? void 0 : _f.state,
                country_code: (_g = value.billing_address) === null || _g === void 0 ? void 0 : _g.country_code,
                postal_code: (_h = value.billing_address) === null || _h === void 0 ? void 0 : _h.postal_code,
            };
        }
        result.external_customer_id = value.customer_id;
        // Generate external_card_id
        let temp = value.card.number;
        temp += ';' + (value.name ? value.name.replace(';', '_') : '');
        temp += ';' + (value.card.ccv ? value.card.ccv.replace(';', '') : '');
        temp += ';' + (value.saved ? 'saved' : '');
        temp += ';' + (value.default ? 'default' : '');
        temp += ';' + (value.customer_id ? value.customer_id.replace(';', '') : '');
        result.external_card_id = temp;
        return result;
    }
    getPageByFilter(correlationId, filter, paging) {
        return __awaiter(this, void 0, void 0, function* () {
            let id = filter.getAsNullableString('id');
            let state = filter.getAsNullableString('state');
            let customerId = filter.getAsNullableString('customer_id');
            let saved = filter.getAsNullableBoolean('saved');
            let ids = filter.getAsObject('ids');
            let _default = filter.getAsNullableBoolean('default');
            let payout = filter.getAsNullableBoolean('payout');
            // Process ids filter
            if (typeof ids === 'string')
                ids = ids.split(',');
            if (!Array.isArray(ids))
                ids = null;
            let skip = paging.getSkip(0);
            let take = paging.getTake(100);
            let items = [];
            let page = 0;
            let pageSize = 20;
            let pageItems;
            do {
                page++;
                // Set filters supported by PayPal
                let options = {
                    page: page,
                    page_size: pageSize
                };
                if (customerId)
                    options.external_customer_id = customerId;
                let data = yield new Promise((resolve, rejects) => {
                    this._client.creditCard.list(options, (err, data) => {
                        if (err)
                            rejects(err);
                        resolve(data);
                    });
                });
                pageItems = data.items.map((item) => this.toPublic(item));
                for (let item of pageItems) {
                    // Filter items
                    if (id != null && item.id != id)
                        continue;
                    if (saved != null && item.saved != saved)
                        continue;
                    if (state != null && item.card.state != state)
                        continue;
                    if (ids != null && ids.indexOf(item.id) < 0)
                        continue;
                    if (_default != null && item.default != null && item.default != _default)
                        continue;
                    if (payout != null && item.payout != payout)
                        continue;
                    // Process skip and take
                    if (skip > 0) {
                        skip--;
                        continue;
                    }
                    if (items.length < take)
                        items.push(item);
                }
            } while (pageItems.length == pageSize && items.length < take);
            return new pip_services3_commons_nodex_1.DataPage(items);
        });
    }
    getById(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield new Promise((resolve, rejects) => {
                this._client.creditCard.get(id, (err, data) => {
                    if (err != null && err.httpStatusCode == 404)
                        err = null;
                    if (err != null)
                        rejects(err);
                    resolve(data);
                });
            });
            let item = this.toPublic(data);
            return item;
        });
    }
    create(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (item.type != PaymentMethodTypeV1_1.PaymentMethodTypeV1.Card) {
                throw new pip_services3_commons_nodex_2.BadRequestException(correlationId, 'ERR_PAYMENTMETHOD_TYPE', 'Payment method type not supported')
                    .withDetails('item', item);
            }
            if (item.payout) {
                throw new pip_services3_commons_nodex_2.BadRequestException(correlationId, 'ERR_PAYMENTMETHOD_PAYOUT', 'Payment method payout not supported')
                    .withDetails('item', item);
            }
            item = this.omit(item, ['id']);
            item = this.fromPublic(item);
            let data = yield new Promise((resolve, rejects) => {
                this._client.creditCard.create(item, (err, data) => {
                    if (err != null) {
                        var strErr = JSON.stringify(err);
                        this._logger.trace(correlationId, "Error creating credit method with PayPal persistence: ", strErr);
                        let code = err && err.response ? err.response.name : "UNKNOWN";
                        let message = err && err.response ? err.response.message : strErr;
                        let status = err && err.httpStatusCode ? err.httpStatusCode : "500";
                        err = new pip_services3_commons_nodex_2.BadRequestException(null, code, message).withStatus(status);
                        rejects(err);
                    }
                    resolve(data);
                });
            });
            item = this.toPublic(data);
            return item;
        });
    }
    update(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (item.type != PaymentMethodTypeV1_1.PaymentMethodTypeV1.Card) {
                throw new pip_services3_commons_nodex_2.BadRequestException(correlationId, 'ERR_PAYMENTMETHOD_TYPE', 'Payment method type not supported')
                    .withDetails('item', item);
            }
            if (item.payout) {
                throw new pip_services3_commons_nodex_2.BadRequestException(correlationId, 'ERR_PAYMENTMETHOD_PAYOUT', 'Payment method payout not supported')
                    .withDetails('item', item);
            }
            let id = item.id;
            let data = this.fromPublic(item);
            // Delete and then recreate, because some fields are read-only in PayPal
            // this._client.creditCard.del(id, (err) => {
            //     if (err) {
            //         callback(err, null);
            //         return;
            //     }
            //     this._client.creditCard.create(data, (err, data) => {
            //         item = this.toPublic(data);
            //         callback(err, item);
            //     });
            // });
            // First try to create then delete, because if user misstyped credit method will be just deleted
            let result = yield new Promise((resolve, rejects) => {
                this._client.creditCard.create(data, (err, data) => {
                    if (err)
                        rejects(err);
                    resolve(data);
                });
            });
            yield new Promise((resolve, rejects) => {
                this._client.creditCard.del(id, (err) => {
                    if (err)
                        rejects(err);
                    resolve(null);
                });
            });
            item = this.toPublic(result);
            return item;
        });
    }
    delete(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield new Promise((resolve, rejects) => {
                this._client.creditCard.get(id, (err, data) => {
                    if (err != null || data == null)
                        rejects(err);
                    resolve(data);
                });
            });
            yield new Promise((rejects, resolve) => {
                this._client.creditCard.del(id, (err) => {
                    if (err)
                        rejects(err);
                });
            });
            let item = this.toPublic(data);
            return item;
        });
    }
    clear(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            let page = 0;
            let pageSize = 20;
            let creditCards = [];
            do {
                page++;
                let options = {
                    page_size: pageSize,
                    page: page
                };
                creditCards = yield new Promise((resolve, rejects) => {
                    this._client.creditCard.list(options, (err, page) => {
                        if (err)
                            rejects(err);
                        resolve(page != null ? page.items : null);
                    });
                });
                let tasks = [];
                for (let creditCard of creditCards) {
                    tasks.push(new Promise((resolve, rejects) => {
                        this._client.creditCard.del(creditCard.id, (err) => {
                            if (err)
                                rejects(err);
                            resolve(null);
                        });
                    }));
                }
                yield Promise.all(tasks);
            } while (creditCards.length == pageSize);
        });
    }
    omit(obj, props) {
        obj = Object.assign({}, obj);
        props.forEach(prop => delete obj[prop]);
        return obj;
    }
}
exports.PaymentMethodsPayPalPersistence = PaymentMethodsPayPalPersistence;
//# sourceMappingURL=PaymentMethodsPayPalPersistence.js.map