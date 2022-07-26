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
exports.StripeExternalBankAccountsConnector = void 0;
const pip_services3_commons_nodex_1 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_2 = require("pip-services3-commons-nodex");
const pip_services3_commons_nodex_3 = require("pip-services3-commons-nodex");
const stripe_1 = require("stripe");
const StripeOptions_1 = require("../StripeOptions");
const pip_services3_components_nodex_1 = require("pip-services3-components-nodex");
const pip_services3_components_nodex_2 = require("pip-services3-components-nodex");
const pip_services3_components_nodex_3 = require("pip-services3-components-nodex");
const version1_1 = require("../../data/version1");
const version1_2 = require("../../data/version1");
const StripeTools_1 = require("./StripeTools");
class StripeExternalBankAccountsConnector {
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
                    if (item.object != 'bank_account')
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
            var bankAccount = yield this.retrieveBankAccountAsync(correlationId, id, customAccount.id);
            return bankAccount ? yield this.toPublicAsync(customAccount, bankAccount) : null;
        });
    }
    createAsync(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            var customAccount = yield this.getOrCreateCustomAccountAsync(item);
            let tokenId = yield this.createToken(item);
            let externalAccount = yield this._client.accounts.createExternalAccount(customAccount.id, {
                external_account: tokenId,
                metadata: this.toMetadata(item),
            });
            return yield this.toPublicAsync(customAccount, externalAccount);
        });
    }
    updateAsync(correlationId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            var customAccount = yield this.getOrCreateCustomAccountAsync(item);
            let account = item.account;
            // Updates the account_holder_name, account_holder_type, and metadata of a bank account belonging to a customer. 
            // Other bank account details are not editable, by design.
            let externalAccount = yield this._client.accounts.updateExternalAccount(customAccount.id, item.id, {
                account_holder_name: account.first_name + ' ' + account.last_name,
                account_holder_type: 'individual',
                default_for_currency: item.default,
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
            var bankAccount = yield this.retrieveBankAccountAsync(correlationId, id, customAccount.id);
            if (bankAccount) {
                let deletedBankAccount = yield StripeTools_1.StripeTools.errorSuppression(this._client.accounts.deleteExternalAccount(customAccount.id, id));
                if (deletedBankAccount && deletedBankAccount.deleted) {
                    return yield this.toPublicAsync(customAccount, bankAccount);
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
    retrieveBankAccountAsync(correlationId, id, customAccountId) {
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let customer_id = customAccount.metadata['customer_id'].toString();
            var method = {
                id: item.id,
                payout: true,
                account: {
                    number: (_a = item.account) === null || _a === void 0 ? void 0 : _a.toString(),
                    routing_number: item.routing_number,
                    country: item.country,
                    currency: item.currency,
                    //  fill from metadata
                    bank_code: '',
                    first_name: '',
                    last_name: '',
                    branch_code: ''
                },
                last4: item.last4,
                customer_id: customer_id,
                type: version1_1.PaymentMethodTypeV1.BankAccount,
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
            let account = paymentMethod.account;
            let token = yield this._client.tokens.create({
                bank_account: {
                    account_number: account.number,
                    country: account.country,
                    currency: account.currency,
                    account_holder_name: account.first_name + ' ' + account.last_name,
                    account_holder_type: 'individual',
                    routing_number: account.routing_number
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
        let account = item.account;
        let address = item.billing_address || new version1_2.AddressV1();
        return {
            'default': item.default ? 'true' : 'false',
            'saved': item.saved ? 'true' : 'false',
            'name': item.name,
            'bank_code': account.bank_code,
            'branch_code': account.branch_code,
            'first_name': account.first_name,
            'last_name': account.last_name,
            'address_city': address.city,
            'address_country_code': address.country_code,
            'address_line1': address.line1,
            'address_line2': address.line2,
            'address_postal_code': address.postal_code,
            'address_state': address.state,
        };
    }
    fromMetadata(item, metadata) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (metadata) {
            item.default = metadata['default'] == 'true';
            item.saved = metadata['saved'] == 'true';
            item.name = (_a = metadata['name']) === null || _a === void 0 ? void 0 : _a.toString();
            item.account.first_name = (_b = metadata['first_name']) === null || _b === void 0 ? void 0 : _b.toString();
            item.account.last_name = (_c = metadata['last_name']) === null || _c === void 0 ? void 0 : _c.toString();
            item.account.bank_code = (_d = metadata['bank_code']) === null || _d === void 0 ? void 0 : _d.toString();
            item.account.branch_code = (_e = metadata['branch_code']) === null || _e === void 0 ? void 0 : _e.toString();
            item.billing_address = {
                city: (_f = metadata['address_city']) === null || _f === void 0 ? void 0 : _f.toString(),
                country_code: (_g = metadata['address_country_code']) === null || _g === void 0 ? void 0 : _g.toString(),
                line1: (_h = metadata['address_line1']) === null || _h === void 0 ? void 0 : _h.toString(),
                line2: (_j = metadata['address_line2']) === null || _j === void 0 ? void 0 : _j.toString(),
                postal_code: (_k = metadata['address_postal_code']) === null || _k === void 0 ? void 0 : _k.toString(),
                state: (_l = metadata['address_state']) === null || _l === void 0 ? void 0 : _l.toString(),
            };
        }
    }
}
exports.StripeExternalBankAccountsConnector = StripeExternalBankAccountsConnector;
//# sourceMappingURL=StripeExternalBankAccountsConnector.js.map