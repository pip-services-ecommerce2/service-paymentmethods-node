import { FilterParams } from 'pip-services3-commons-nodex';
import { PagingParams } from 'pip-services3-commons-nodex';
import { DataPage } from 'pip-services3-commons-nodex';
import { ConfigParams } from 'pip-services3-commons-nodex';
import { IConfigurable } from 'pip-services3-commons-nodex';
import { IReferences } from 'pip-services3-commons-nodex';
import { IReferenceable } from 'pip-services3-commons-nodex';
import { IOpenable } from 'pip-services3-commons-nodex';
import { ICleanable } from 'pip-services3-commons-nodex';

import { PaymentMethodV1 } from '../data/version1/PaymentMethodV1';
import { PaymentMethodTypeV1 } from '../data/version1/PaymentMethodTypeV1';
import { IPaymentMethodsPersistence } from './IPaymentMethodsPersistence'
import { PaymentMethodsPayPalPersistence } from './PaymentMethodsPayPalPersistence';
import { PaymentMethodsMongoDbPersistence } from './PaymentMethodsMongoDbPersistence';

export class PaymentMethodsPayPalMongoDbPersistence implements IPaymentMethodsPersistence, IConfigurable,
    IReferenceable, IOpenable, ICleanable {

    private _mongoPersistence: PaymentMethodsMongoDbPersistence;
    private _payPalPersistence: PaymentMethodsPayPalPersistence;

    public constructor() {
        this._mongoPersistence = new PaymentMethodsMongoDbPersistence;
        this._payPalPersistence = new PaymentMethodsPayPalPersistence();
    }

    public configure(config: ConfigParams): void {
        if (this._mongoPersistence) this._mongoPersistence.configure(config);
        if (this._payPalPersistence) this._payPalPersistence.configure(config);
    }

    public setReferences(references: IReferences): void {
        if (this._mongoPersistence) this._mongoPersistence.setReferences(references);
        if (this._payPalPersistence) this._payPalPersistence.setReferences(references);
    }

    public isOpen(): boolean {
        return this._mongoPersistence?.isOpen() || this._payPalPersistence?.isOpen();
    }

    public async open(correlationId: string): Promise<void> {
        // open mongodb persistence
        await this._mongoPersistence.open(correlationId);

        // open paypal persistence
        await this._payPalPersistence.open(correlationId);
    }

    public async close(correlationId: string): Promise<void> {
        // close mongodb persistence
        await this._mongoPersistence.close(correlationId);
        this._mongoPersistence = null;

        // close paypal persistence
        await this._payPalPersistence.close(correlationId);
        this._payPalPersistence = null;
    }

    public async getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams): Promise<DataPage<PaymentMethodV1>> {
        let page = await this._mongoPersistence.getPageByFilter(correlationId, filter, paging);

        if (page) {
            let cardIds = page.data.filter(x => x.type == PaymentMethodTypeV1.Card).map(x => x.id);
            if (cardIds.length == 0) {
                return page;
            }

            let cardsFilter = FilterParams.fromValue({
                ids: cardIds
            });

            let cards = await this._payPalPersistence.getPageByFilter(correlationId, cardsFilter, paging);

            cards.data.forEach((value, index, array) => {
                let item = page.data.find(x => x.id == value.id);
                if (item) {
                    item.card.number = value.card.number;
                }
            });
        }

        return page;
    }

    public async getById(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        let item = await this._mongoPersistence.getOneById(correlationId, id);

        if (!item || item.type != PaymentMethodTypeV1.Card || item.payout) {
            return item;
        }

        return await this._payPalPersistence.getById(correlationId, id, customerId);
    }

    public async create(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        if (item.type == PaymentMethodTypeV1.Card && !item.payout) {
            item = await this._payPalPersistence.create(correlationId, item);

            item.card.number = this.maskCardNumber(item.card.number);

            return await this._mongoPersistence.create(correlationId, item);
        }
        else {
            return await this._mongoPersistence.create(correlationId, item);
        }
    }

    public async update(correlationId: string, item: PaymentMethodV1): Promise<PaymentMethodV1> {
        if (item.type == PaymentMethodTypeV1.Card && !item.payout) {
            item = await this._payPalPersistence.update(correlationId, item);

            item.card.number = this.maskCardNumber(item.card.number);
            return await this._mongoPersistence.update(correlationId, item);
        }
        else {
            return await this._mongoPersistence.update(correlationId, item);
        }
    }

    public async delete(correlationId: string, id: string, customerId: string): Promise<PaymentMethodV1> {
        let item = await this._mongoPersistence.delete(correlationId, id, customerId);

        if (!item || item.type != PaymentMethodTypeV1.Card || item.payout) {
            return item;
        }

        return await this._payPalPersistence.delete(correlationId, id, customerId);
    }

    public async clear(correlationId: string, callback?: (err: any) => void): Promise<void> {
        await Promise.all([
            this._mongoPersistence.clear(correlationId),
            this._payPalPersistence.clear(correlationId)
        ]);
    }

    private maskCardNumber(pan: string): string {
        let len: number = pan?.length ?? 0;

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