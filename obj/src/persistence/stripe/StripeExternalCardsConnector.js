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
exports.StripeExternalCardsConnector = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_3 = require("pip-services3-commons-nodex");
const stripe_1 = require("stripe");
const StripeOptions_1 = require("../StripeOptions");
const pip_services3_components_nodex_1 = require("pip-services3-components-nodex");
const pip_services3_components_nodex_2 = require("pip-services3-components-nodex");
const pip_services3_components_nodex_3 = require("pip-services3-components-nodex");
const version1_1 = require("../../data/version1");
const StripeTools_1 = require("./StripeTools");
class StripeExternalCardsConnector {
    constructor() {
        this._client = null;
        this._connectionResolver = new pip_services3_components_nodex_1.ConnectionResolver();
        this._credentialsResolver = new pip_services3_components_nodex_2.CredentialResolver();
        this._logger = new pip_services3_components_nodex_3.CompositeLogger();
    }
    configure(config) {
        this._logger.configure(config);
        this._connectionResolver.configure(config);
        this._credentialsResolver.configure(config);
    }
    setReferences(references) {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
        this._credentialsResolver.setReferences(references);
    }
    isOpen() {
        return this._client != null;
    }
    open(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get connection params
            let connectionParams = yield this._connectionResolver.resolve(correlationId);
            // Get credential params
            let credentialParams = yield this._credentialsResolver.lookup(correlationId);
            // Connect
            let stripeOptions = new StripeOptions_1.StripeOptions(connectionParams);
            let secretKey = credentialParams.getAccessKey();
            this._client = new stripe_1.Stripe(secretKey, {
                apiVersion: stripeOptions.apiVersion,
                maxNetworkRetries: stripeOptions.maxNetworkRetries,
                httpAgent: stripeOptions.httpAgent,
                timeout: stripeOptions.timeout,
                host: stripeOptions.host,
                port: stripeOptions.port,
                protocol: stripeOptions.protocol,
                telemetry: stripeOptions.telemetry
            });
        });
    }
    close(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            this._client = null;
        });
    }
    getPageByFilterAsync(correlationId, filter, paging) {
        return __awaiter(this, void 0, void 0, function* () {
            let customer_id = filter === null || filter === void 0 ? void 0 : filter.getAsString('customer_id');
            let customAccount = customer_id ? yield this.findCustomAccountAsync(customer_id) : null;
            let skip = paging.getSkip(0);
            let take = paging.getTake(100);
            let customAccounts = customAccount ? [customAccount] : yield this.getAllCustomAccounts();
            let data = [];
            for (let i = 0; i < customAccounts.length; i++) {
                const customAccount = customAccounts[i];
                let items = yield this._client.accounts.listExternalAccounts(customAccount.id, {
                    // object: 'bank_account', -- error in stripe sdk: filter by object type is not supported
                    limit: skip + take,
                });
                for (let j = 0; j < items.data.length; j++) {
                    const item = items.data[j];
                    if (item.object != 'card')
                        continue;
                    data.push(yield this.toPublicAsync(customAccount, item));
                }
            }
            return new pip_services3_commons_nodex_2.DataPage(data);
        });
    }
    getByIdAsync(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var customAccount = yield this.findCustomAccountAsync(customerId);
            if (!customAccount)
                return null;
            var card = yield this.retrieveCardAsync(correlationId, id, customAccount.id);
            return card ? yield this.toPublicAsync(customAccount, card) : null;
        });
    }
    createAsync(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            var customAccount = yield this.getOrCreateCustomAccountAsync(item);
            let tokenId = yield this.createToken(item);
            let externalAccount = yield this._client.accounts.createExternalAccount(customAccount.id, {
                external_account: tokenId,
                default_for_currency: item.default,
                metadata: this.toMetadata(item),
            });
            return yield this.toPublicAsync(customAccount, externalAccount);
        });
    }
    updateAsync(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            var customAccount = yield this.getOrCreateCustomAccountAsync(item);
            let card = item.card;
            let address = item.billing_address;
            let externalAccount = yield this._client.accounts.updateExternalAccount(customAccount.id, item.id, {
                exp_month: card.expire_month.toString(),
                exp_year: card.expire_year.toString(),
                address_city: address === null || address === void 0 ? void 0 : address.city,
                address_country: address === null || address === void 0 ? void 0 : address.country_code,
                address_line1: address === null || address === void 0 ? void 0 : address.line1,
                address_line2: address === null || address === void 0 ? void 0 : address.line2,
                address_state: address === null || address === void 0 ? void 0 : address.state,
                address_zip: address === null || address === void 0 ? void 0 : address.postal_code,
                default_for_currency: item.default,
                name: card.first_name + ' ' + card.last_name,
                metadata: this.toMetadata(item),
            });
            return yield this.toPublicAsync(customAccount, externalAccount);
        });
    }
    deleteAsync(correlationId, id, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var customAccount = yield this.findCustomAccountAsync(customerId);
            if (!customAccount)
                return null;
            var card = yield this.retrieveCardAsync(correlationId, id, customAccount.id);
            if (card) {
                if (card.default_for_currency) {
                    this._logger.warn(correlationId, 'You cannot delete the default external account for your default currency. Please make another external account the default using the `default_for_currency` param, and then delete this one.');
                    return null;
                }
                let deletedCard = yield StripeTools_1.StripeTools.errorSuppression(this._client.accounts.deleteExternalAccount(customAccount.id, id));
                if (deletedCard && deletedCard.deleted) {
                    return yield this.toPublicAsync(customAccount, card);
                }
            }
            return null;
        });
    }
    clearAsync(correlationId) {
        return __awaiter(this, void 0, void 0, function* () {
            let filter = new pip_services3_commons_nodex_1.FilterParams();
            let paging = new pip_services3_commons_nodex_3.PagingParams(0, 100);
            let page = yield this.getPageByFilterAsync(correlationId, filter, paging);
            for (let i = 0; i < page.data.length; i++) {
                const paymentMethod = page.data[i];
                yield this.deleteAsync(correlationId, paymentMethod.id, paymentMethod.customer_id);
            }
        });
    }
    retrieveCardAsync(correlationId, id, customAccountId) {
        return __awaiter(this, void 0, void 0, function* () {
            let externalAccount = yield StripeTools_1.StripeTools.errorSuppression(this._client.accounts.retrieveExternalAccount(customAccountId, id, {
                expand: ['metadata']
            }));
            return externalAccount;
        });
    }
    getOrCreateCustomAccountAsync(item) {
        return __awaiter(this, void 0, void 0, function* () {
            var customAccount = yield this.findCustomAccountAsync(item.customer_id);
            if (!customAccount) {
                customAccount = yield this._client.accounts.create({
                    type: 'custom',
                    business_type: 'individual',
                    business_profile: {
                        mcc: '1520',
                        url: 'http://unknown.com/'
                    },
                    requested_capabilities: [
                        //'card_payments',
                        'transfers',
                    ],
                    metadata: {
                        'customer_id': item.customer_id
                    }
                });
            }
            return customAccount;
        });
    }
    toPublicAsync(customAccount, item) {
        return __awaiter(this, void 0, void 0, function* () {
            let customer_id = customAccount.metadata['customer_id'].toString();
            var method = {
                id: item.id,
                payout: true,
                type: version1_1.PaymentMethodTypeV1.Card,
                customer_id: customer_id,
                card: {
                    expire_month: item.exp_month,
                    expire_year: item.exp_year,
                    number: item.last4,
                    ccv: ''
                },
                last4: item.last4,
                billing_address: {
                    city: item.address_city,
                    country_code: item.address_country,
                    line1: item.address_line1,
                    line2: item.address_line2,
                    postal_code: item.address_zip,
                    state: item.address_state
                }
            };
            this.fromMetadata(method, item.metadata);
            return method;
        });
    }
    findCustomAccountAsync(customer_id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (customer_id) {
                return yield StripeTools_1.StripeTools.findItem(p => this._client.accounts.list(p), x => x.metadata && x.metadata['customer_id'] == customer_id, x => x.id);
            }
            return null;
        });
    }
    createToken(paymentMethod) {
        return __awaiter(this, void 0, void 0, function* () {
            let card = paymentMethod.card;
            let token = yield this._client.tokens.create({
                card: {
                    //name: card.?
                    //currency: card.?
                    exp_month: card.expire_month.toString(),
                    exp_year: card.expire_year.toString(),
                    number: card.number,
                    cvc: card.ccv,
                    address_city: paymentMethod.billing_address.city,
                    address_country: paymentMethod.billing_address.country_code,
                    address_line1: paymentMethod.billing_address.line1,
                    address_line2: paymentMethod.billing_address.line2,
                    address_state: paymentMethod.billing_address.state,
                    address_zip: paymentMethod.billing_address.postal_code,
                },
            });
            return token.id;
        });
    }
    getAllCustomAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            let customAccounts = [];
            let pageSize = 100;
            do {
                let options;
                if (customAccounts.length == 0)
                    options = {
                        limit: pageSize
                    };
                else
                    options = {
                        limit: pageSize,
                        starting_after: customAccounts[customAccounts.length - 1].id
                    };
                var items = yield this._client.accounts.list(options);
                customAccounts.push(...items.data);
            } while (items.has_more);
            return customAccounts;
        });
    }
    toMetadata(item) {
        let card = item.card;
        return {
            'default': item.default ? 'true' : 'false',
            'saved': item.saved ? 'true' : 'false',
            'name': item.name,
            'first_name': card.first_name,
            'last_name': card.last_name,
            'brand': card.brand,
            'state': card.state
        };
    }
    fromMetadata(item, metadata) {
        var _a, _b, _c, _d, _e;
        if (metadata) {
            item.default = metadata['default'] == 'true';
            item.saved = metadata['saved'] == 'true';
            item.name = (_a = metadata['name']) === null || _a === void 0 ? void 0 : _a.toString();
            item.card.first_name = (_b = metadata['first_name']) === null || _b === void 0 ? void 0 : _b.toString();
            item.card.last_name = (_c = metadata['last_name']) === null || _c === void 0 ? void 0 : _c.toString();
            item.card.brand = (_d = metadata['brand']) === null || _d === void 0 ? void 0 : _d.toString();
            item.card.state = (_e = metadata['state']) === null || _e === void 0 ? void 0 : _e.toString();
        }
    }
}
exports.StripeExternalCardsConnector = StripeExternalCardsConnector;
//# sourceMappingURL=StripeExternalCardsConnector.js.map