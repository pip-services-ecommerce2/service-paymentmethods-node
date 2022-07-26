import Stripe from "stripe";

export class StripeTools {
    public static async findItem<T>(list: (params: Stripe.PaginationParams) => Promise<Stripe.ApiList<T>>,
        predicate: (item: T) => boolean,
        getId: (item: T) => string): Promise<T> {
        let page: Stripe.ApiList<T>;

        do {
            let params: Stripe.PaginationParams = {
                limit: 100,
            };

            if (page && page.data.length > 0)
                params.starting_after = getId(page.data[page.data.length - 1]);

            page = await list(params);

            let item = page.data.find(predicate);
            if (item) return item;

        }
        while (page.has_more);

        return null;
    }

    public static async errorSuppression<T>(action: Promise<T>, errorCodes: [string] = ['resource_missing']): Promise<T> {
        let result: T = null;
        let err: any;

        try {
            result = await action;
        }
        catch (e) {
            err = e;
        }

        if (err) {
            if (!errorCodes.includes(err.code)) throw err;
        }

        return result;
    }
} 