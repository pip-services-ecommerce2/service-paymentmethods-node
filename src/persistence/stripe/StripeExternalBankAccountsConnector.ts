import { IStripeConnector } from "../IStripeConnector";
import { FilterParams, IReferences } from "pip-services3-commons-nodex";
import { DataPage } from "pip-services3-commons-nodex";
import { PagingParams } from "pip-services3-commons-nodex";

import { ConfigParams } from "pip-services3-commons-nodex";
import { Stripe } from "stripe";
import { isString } from "util";
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

export class StripeExternalBankAccountsConnector implements IStripeConnector {
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
                if (item.object != 'bank_account') continue;

                data.push(await this.toPublicAsync(customAccount, item as Stripe.BankAccount));
            }
        }

        return new DataPage(data);
    }

    async getByIdAsync(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        var customAccount = await this.findCustomAccountAsync(customerId);
        if (!customAccount) return null;

        var bankAccount = await this.retrieveBankAccountAsync(correlationId, id, customAccount.id)

        return bankAccount ? await this.toPublicAsync(customAccount, bankAccount) : null;
    }

    async createAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        var customAccount = await this.getOrCreateCustomAccountAsync(item);

        let tokenId = await this.createToken(item);

        let externalAccount = await this._client.accounts.createExternalAccount(customAccount.id, {
            external_account: tokenId,
            metadata: this.toMetadata(item),
        });

        return await this.toPublicAsync(customAccount, externalAccount as Stripe.BankAccount);
    }

    async updateAsync(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        var customAccount = await this.getOrCreateCustomAccountAsync(item);

        let account = item.account;

        // Updates the account_holder_name, account_holder_type, and metadata of a bank account belonging to a customer. 
        // Other bank account details are not editable, by design.
        let externalAccount = await this._client.accounts.updateExternalAccount(customAccount.id, item.id, {
            account_holder_name: account.first_name + ' ' + account.last_name,
            account_holder_type: 'individual',
            default_for_currency: item.default,
            metadata: this.toMetadata(item),
        });

        return await this.toPublicAsync(customAccount, externalAccount as Stripe.BankAccount);
    }

    async deleteAsync(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        var customAccount = await this.findCustomAccountAsync(customerId);
        if (!customAccount) return null;

        var bankAccount = await this.retrieveBankAccountAsync(correlationId, id, customAccount.id);
        if (bankAccount)
        {
            let deletedBankAccount = await StripeTools.errorSuppression(this._client.accounts.deleteExternalAccount(customAccount.id, id)) 

            if (deletedBankAccount && deletedBankAccount.deleted) 
            {
                return await this.toPublicAsync(customAccount, bankAccount)
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

    
    private async retrieveBankAccountAsync(correlationId: string, id: string, customAccountId: string): Promise<Stripe.BankAccount> {
        let externalAccount =
            await StripeTools.errorSuppression(this._client.accounts.retrieveExternalAccount(customAccountId, id, {
                expand: ['metadata']
            }));

        return externalAccount as Stripe.BankAccount;
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

    private async toPublicAsync(customAccount: Stripe.Account, item: Stripe.BankAccount): Promise<PaymentMethodV1> {

        let customer_id = customAccount.metadata['customer_id'].toString();

        var method: PaymentMethodV1 = {
            id: item.id,
            payout: true,
            account: {
                number: item.account?.toString(),
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
            type: PaymentMethodTypeV1.BankAccount,
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
        let account = paymentMethod.account;

        let token = await this._client.tokens.create({
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
        let account = item.account;
        let address = item.billing_address || new AddressV1();

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
        }
    }

    private fromMetadata(item: PaymentMethodV1, metadata: Stripe.MetadataParam) {
        if (metadata) {
            item.default = metadata['default'] == 'true';
            item.saved = metadata['saved'] == 'true';
            item.name = metadata['name']?.toString();

            item.account.first_name = metadata['first_name']?.toString();
            item.account.last_name = metadata['last_name']?.toString();
            item.account.bank_code = metadata['bank_code']?.toString();
            item.account.branch_code = metadata['branch_code']?.toString();

            item.billing_address = {
                city: metadata['address_city']?.toString(),
                country_code: metadata['address_country_code']?.toString(),
                line1: metadata['address_line1']?.toString(),
                line2: metadata['address_line2']?.toString(),
                postal_code: metadata['address_postal_code']?.toString(),
                state: metadata['address_state']?.toString(),
            };
        }
    }

}