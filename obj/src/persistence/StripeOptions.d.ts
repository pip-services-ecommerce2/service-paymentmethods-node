import { ConfigParams } from "pip-services3-commons-nodex";
import Stripe from 'stripe';
export declare class StripeOptions implements Stripe.StripeConfig {
    apiVersion: Stripe.LatestApiVersion;
    maxNetworkRetries: number;
    timeout: number;
    host: string;
    port: number;
    protocol?: 'https' | 'http';
    telemetry: boolean;
    httpAgent: any;
    constructor(config: ConfigParams);
}
