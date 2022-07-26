import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { ConfigParams } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { IReferenceable } from 'pip-services3-commons-nodex';
import { IOpenable } from 'pip-services3-commons-nodex';
import { ICleanable } from 'pip-services3-commons-nodex';

import { BadRequestException } from 'pip-services3-commons-nodex';

import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';
import { PaymentMethodTypeV1 } from '../data/version1/PaymentMethodTypeV1';
import { IPaymentMethodsPersistence } from './IPaymentMethodsPersistence'

import { IStripeConnector } from './IStripeConnector';
import { StripeCardsConnector } from './stripe/StripeCardsConnector';
import { StripeBankAccountsConnector } from './stripe/StripeBankAccountsConnector';
import { StripeExternalCardsConnector } from './stripe/StripeExternalCardsConnector';
import { StripeExternalBankAccountsConnector } from './stripe/StripeExternalBankAccountsConnector';

export class PaymentMethodsStripePersistence implements IPaymentMethodsPersistence, IConfigurable,
    IReferenceable, IOpenable, ICleanable {

    private _stripeCardsConnector: IStripeConnector;
    private _stripeBankAccountsConnector: IStripeConnector;

    private _stripeExternalCardsConnector: IStripeConnector;
    private _stripeExternalBankAccountsConnector: IStripeConnector;

    public constructor() {
        this._stripeCardsConnector = new StripeCardsConnector();
        this._stripeBankAccountsConnector = new StripeBankAccountsConnector();
        this._stripeExternalCardsConnector = new StripeExternalCardsConnector();
        this._stripeExternalBankAccountsConnector = new StripeExternalBankAccountsConnector();
    }

    public configure(config: ConfigParams): void {
        if (this._stripeCardsConnector) this._stripeCardsConnector.configure(config);
        if (this._stripeBankAccountsConnector) this._stripeBankAccountsConnector.configure(config);
        if (this._stripeExternalCardsConnector) this._stripeExternalCardsConnector.configure(config);
        if (this._stripeExternalBankAccountsConnector) this._stripeExternalBankAccountsConnector.configure(config);
    }

    public setReferences(references: IReferences): void {
        if (this._stripeCardsConnector) this._stripeCardsConnector.setReferences(references);
        if (this._stripeBankAccountsConnector) this._stripeBankAccountsConnector.setReferences(references);
        if (this._stripeExternalCardsConnector) this._stripeExternalCardsConnector.setReferences(references);
        if (this._stripeExternalBankAccountsConnector) this._stripeExternalBankAccountsConnector.setReferences(references);
    }

    public isOpen(): boolean {
        return this._stripeCardsConnector?.isOpen()
            || this._stripeBankAccountsConnector?.isOpen()
            || this._stripeExternalCardsConnector?.isOpen()
            || this._stripeExternalBankAccountsConnector?.isOpen();
    }

    public async open(correlationId: string): Promise<void> {
        // create stripe cards connector
        await this._stripeCardsConnector.open(correlationId);

        // create stripe bank accounts connector
        await this._stripeBankAccountsConnector.open(correlationId);

        // create stripe external cards connector
        await this._stripeExternalCardsConnector.open(correlationId);

        // create stripe external bank accounts connector
        await this._stripeExternalBankAccountsConnector.open(correlationId);
    }

    public async close(correlationId: string): Promise<void> {
        // close stripe cards connector
        await this._stripeCardsConnector.close(correlationId);
        this._stripeCardsConnector = null;

        // close stripe bank accounts connector
        await this._stripeBankAccountsConnector.close(correlationId);
        this._stripeBankAccountsConnector = null;

        // close stripe external cards connector
        await this._stripeExternalCardsConnector.close(correlationId);
        this._stripeExternalCardsConnector = null;

        // close stripe external accounts connector
        this._stripeExternalBankAccountsConnector.close(correlationId);
        this._stripeExternalBankAccountsConnector = null;
    }

    public async getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>> {
        let pageSize = 100;

        let pages = await Promise.all([
            this._stripeCardsConnector.getPageByFilterAsync(correlationId, filter, new PagingParams(0, pageSize)),
            this._stripeBankAccountsConnector.getPageByFilterAsync(correlationId, filter, new PagingParams(0, pageSize)),
            this._stripeExternalCardsConnector.getPageByFilterAsync(correlationId, filter, new PagingParams(0, pageSize)),
            this._stripeExternalBankAccountsConnector.getPageByFilterAsync(correlationId, filter, new PagingParams(0, pageSize))
        ]);

        let methods: PaymentMethodV1[] = [];
        pages.forEach(page => methods = methods.concat(...page.data));
        return this.buildPageByFilter(correlationId, filter, paging, methods);
    }

    public async getById(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        let methods = await Promise.all([
            this._stripeCardsConnector.getByIdAsync(correlationId, id, customerId),
            this._stripeBankAccountsConnector.getByIdAsync(correlationId, id, customerId),
            this._stripeExternalCardsConnector.getByIdAsync(correlationId, id, customerId),
            this._stripeExternalBankAccountsConnector.getByIdAsync(correlationId, id, customerId)
        ]);

        return methods?.find(x => x != null);
    }

    public async create(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        let connector = this.getConnectorByType(item);
        if (connector == null) {
            throw new BadRequestException(correlationId, 'ERR_PAYMENT_TYPE', 'Payment type not supported')
                .withDetails('item.type', item.type);
        }

        return await connector.createAsync(correlationId, item);
    }

    public async update(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        var connector = this.getConnectorByType(item);
        if (connector == null) {
            throw new BadRequestException(correlationId, 'ERR_PAYMENT_TYPE', 'Payment type not supported')
                .withDetails('item.type', item.type);
        }

        return await connector.updateAsync(correlationId, item);
    }

    public async delete(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {

        let methods = await Promise.all([
            this._stripeCardsConnector.deleteAsync(correlationId, id, customerId),
            this._stripeBankAccountsConnector.deleteAsync(correlationId, id, customerId),
            this._stripeExternalCardsConnector.deleteAsync(correlationId, id, customerId),
            this._stripeExternalBankAccountsConnector.deleteAsync(correlationId, id, customerId)
        ]);

        return methods?.find(x => x != null);
    }

    public async clear(correlationId: string): Promise<void> {
        await Promise.all([
            this._stripeCardsConnector.clearAsync(correlationId),
            this._stripeBankAccountsConnector.clearAsync(correlationId),
            this._stripeExternalCardsConnector.clearAsync(correlationId),
            this._stripeExternalBankAccountsConnector.clearAsync(correlationId),
        ]);
    }

    private buildPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams, methods: PaymentMethodV1[]) {
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
        let items: PaymentMethodV1[] = [];

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
            if (!this.checkItem(checkFilter, item)) continue;

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

        return new DataPage(items);
    }

    private checkItem(filter, item: PaymentMethodV1): boolean {
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

    private getConnectorByType(item: PaymentMethodV1): IStripeConnector {
        if (item.payout)
        {
            if (item.type == PaymentMethodTypeV1.Card) return this._stripeExternalCardsConnector;
            if (item.type == PaymentMethodTypeV1.BankAccount) return this._stripeExternalBankAccountsConnector;
        }
        else 
        {
            if (item.type == PaymentMethodTypeV1.Card) return this._stripeCardsConnector;
            if (item.type == PaymentMethodTypeV1.BankAccount) return this._stripeBankAccountsConnector;
        }
        return null;
    }
}