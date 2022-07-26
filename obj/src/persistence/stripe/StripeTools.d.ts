import Stripe from "stripe";
export declare class StripeTools {
    static findItem<T>(list: (params: Stripe.PaginationParams) => Promise<Stripe.ApiList<T>>, predicate: (item: T) => boolean, getId: (item: T) => string): Promise<T>;
    static errorSuppression<T>(action: Promise<T>, errorCodes?: [string]): Promise<T>;
}
