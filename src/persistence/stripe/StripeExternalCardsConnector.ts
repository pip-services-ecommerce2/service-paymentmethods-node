import { IStripeConnector } from "../IStripeConnector";
import { FilterParams, IReferences } from "pip-services3-commons-nodex";
import { DataPage } from "pip-services3-commons-nodex";
import { PagingParams } from "pip-services3-commons-nodex";

import { ConfigParams } from "pip-services3-commons-nodex";
import { Stripe } from "stripe";
import { StripeOptions } from "../StripeOptions";
import { ConnectionResolver } from 'pip-services3-components-nodex';
import { ConnectionParams } from 'pip-services3-components-nodex';
import { CredentialResolver } from 'pip-services3-components-nodex';
import { CredentialParams } from 'pip-services3-components-nodex';
import { CompositeLogger } from 'pip-services3-components-nodex';

import { PaymentMethodV1 } from "../../data/version1";
import { PaymentMethodTypeV1 } from "../../data/version1";
import { AddressV1 } from "../../data/version1";
import { StripeTools } from "./StripeTools";

export class StripeExternalCardsConnector implements IStripeConnector {
    private _client: Stripe = null;

    private _connectionResolver: ConnectionResolver = new ConnectionResolver();
    private _credentialsResolver: CredentialResolver = new CredentialResolver();

    private _logger: CompositeLogger = new CompositeLogger();

    public constructor() { }

    public configure(config: ConfigParams): void {
        this._logger.configure(config);
        this._connectionResolver.configure(config);
        this._credentialsResolver.configure(config);
    }

    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
        this._credentialsResolver.setReferences(references);
    }

    public isOpen(): boolean {
        return this._client != null;
    }

    public async open(correlationId: string): Promise<void> {
        // Get connection params
        let connectionParams: ConnectionParams = await this._connectionResolver.resolve(correlationId);
        // Get credential params
        let credentialParams: CredentialParams = await this._credentialsResolver.lookup(correlationId);

        // Connect
        let stripeOptions = new StripeOptions(connectionParams);
        let secretKey = credentialParams.getAccessKey();

        this._client = new Stripe(secretKey, {
            apiVersion: stripeOptions.apiVersion,
            maxNetworkRetries: stripeOptions.maxNetworkRetries,
            httpAgent: stripeOptions.httpAgent,
            timeout: stripeOptions.timeout,
            host: stripeOptions.host,
            port: stripeOptions.port,
            protocol: stripeOptions.protocol,
            telemetry: stripeOptions.telemetry
        });
    }

    public async close(correlationId: string): Promise<void> {
        this._client = null;
    }

    async getPageByFilterAsync(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>> {
        let customer_id = filter?.getAsString('customer_id');
        let customAccount = customer_id ? await this.findCustomAccountAsync(customer_id) : null;

        let skip = paging.getSkip(0);
        let take = paging.getTake(100);

        let customAccounts = customAccount ? [customAccount] : await this.getAllCustomAccounts();

        let data: PaymentMethodV1[] = [];

        for (let i = 0; i < customAccounts.length; i++) {
            const customAccount = customAccounts[i];

            let items = await this._client.accounts.listExternalAccounts(customAccount.id, {
                // object: 'bank_account', -- error in stripe sdk: filter by object type is not supported
                limit: skip + take,
            });

            for (let j = 0; j < items.data.length; j++) {
                const item = items.data[j];
                if (item.object != 'card') continue;

                data.push(await this.toPublicAsync(customAccount, item as Stripe.Card));
            }
        }

        return new DataPage(data);
    }

    async getByIdAsync(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        var customAccount = await this.findCustomAccountAsync(customerId);
        if (!customAccount) return null;

        var card = await this.retrieveCardAsync(correlationId, id, customAccount.id)

        return card ? await this.toPublicAsync(customAccount, card) : null;
    }

    async createAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        var customAccount = await this.getOrCreateCustomAccountAsync(item);

        let tokenId = await this.createToken(item);

        let externalAccount = await this._client.accounts.createExternalAccount(customAccount.id, {
            external_account: tokenId,
            default_for_currency: item.default,
            metadata: this.toMetadata(item),
        });

        return await this.toPublicAsync(customAccount, externalAccount as Stripe.Card);
    }

    async updateAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        var customAccount = await this.getOrCreateCustomAccountAsync(item);

        let card = item.card;
        let address = item.billing_address;

        let externalAccount = await this._client.accounts.updateExternalAccount(customAccount.id, item.id, {
            exp_month: card.expire_month.toString(),
            exp_year: card.expire_year.toString(),
            address_city: address?.city,
            address_country: address?.country_code,
            address_line1: address?.line1,
            address_line2: address?.line2,
            address_state: address?.state,
            address_zip: address?.postal_code,
            default_for_currency: item.default,
            name: card.first_name + ' ' + card.last_name,
            metadata: this.toMetadata(item),
        });

        return await this.toPublicAsync(customAccount, externalAccount as Stripe.Card);
    }

    async deleteAsync(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        var customAccount = await this.findCustomAccountAsync(customerId);
        if (!customAccount) return null;

        var card = await this.retrieveCardAsync(correlationId, id, customAccount.id);
        if (card) {
            if (card.default_for_currency) {
                this._logger.warn(correlationId, 'You cannot delete the default external account for your default currency. Please make another external account the default using the `default_for_currency` param, and then delete this one.');
                return null;
            }

            let deletedCard = await StripeTools.errorSuppression(this._client.accounts.deleteExternalAccount(customAccount.id, id))

            if (deletedCard && deletedCard.deleted) {
                return await this.toPublicAsync(customAccount, card)
            }
        }

        return null;
    }

    async clearAsync(correlationId: string): Promise<void> {
        let filter = new FilterParams();
        let paging = new PagingParams(0, 100);

        let page = await this.getPageByFilterAsync(correlationId, filter, paging);

        for (let i = 0; i < page.data.length; i++) {
            const paymentMethod = page.data[i];
            await this.deleteAsync(correlationId, paymentMethod.id, paymentMethod.customer_id);
        }
    }


    private async retrieveCardAsync(correlationId: string, id: string, customAccountId: string): Promise<Stripe.Card> {
        let externalAccount =
            await StripeTools.errorSuppression(this._client.accounts.retrieveExternalAccount(customAccountId, id, {
                expand: ['metadata']
            }));

        return externalAccount as Stripe.Card;
    }

    private async getOrCreateCustomAccountAsync(item: PaymentMethodV1): Promise<Stripe.Account> {
        var customAccount = await this.findCustomAccountAsync(item.customer_id);

        if (!customAccount) {
            customAccount = await this._client.accounts.create({
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
    }

    private async toPublicAsync(customAccount: Stripe.Account, item: Stripe.Card): Promise<PaymentMethodV1> {

        let customer_id = customAccount.metadata['customer_id'].toString();

        var method: PaymentMethodV1 = {
            id: item.id,
            payout: true,
            type: PaymentMethodTypeV1.Card,
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
    }

    private async findCustomAccountAsync(customer_id: string): Promise<Stripe.Account> {
        if (customer_id) {
            return await StripeTools.findItem(p => this._client.accounts.list(p),
                x => x.metadata && x.metadata['customer_id'] == customer_id, x => x.id);
        }

        return null;
    }

    private async createToken(paymentMethod: PaymentMethodV1): Promise<string> {
        let card = paymentMethod.card;

        let token = await this._client.tokens.create({
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
    }

    private async getAllCustomAccounts(): Promise<Stripe.Account[]> {
        let customAccounts: Stripe.Account[] = [];
        let pageSize = 100;

        do {
            let options: Stripe.AccountListParams;
            if (customAccounts.length == 0)
                options = {
                    limit: pageSize
                };
            else options = {
                limit: pageSize,
                starting_after: customAccounts[customAccounts.length - 1].id
            };

            var items = await this._client.accounts.list(options)

            customAccounts.push(...items.data);
        }
        while (items.has_more);

        return customAccounts;
    }

    private toMetadata(item: PaymentMethodV1): Stripe.MetadataParam {
        let card = item.card;

        return {
            'default': item.default ? 'true' : 'false',
            'saved': item.saved ? 'true' : 'false',
            'name': item.name,

            'first_name': card.first_name,
            'last_name': card.last_name,
            'brand': card.brand,
            'state': card.state
        }
    }

    private fromMetadata(item: PaymentMethodV1, metadata: Stripe.MetadataParam) {
        if (metadata) {
            item.default = metadata['default'] == 'true';
            item.saved = metadata['saved'] == 'true';
            item.name = metadata['name']?.toString();

            item.card.first_name = metadata['first_name']?.toString();
            item.card.last_name = metadata['last_name']?.toString();
            item.card.brand = metadata['brand']?.toString();
            item.card.state = metadata['state']?.toString();
        }
    }
}