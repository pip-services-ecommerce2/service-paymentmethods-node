import { ConfigParams } from "pip-services3-commons-nodex";

import Stripe from 'stripe';

export class StripeOptions implements Stripe.StripeConfig {
    /// Stripe API version to be used. If not set the account's default version will be used.
    /// Default: null
    public apiVersion: Stripe.LatestApiVersion;
    /// The amount of times a request should be retried.
    /// Default: 0
    public maxNetworkRetries: number = 0;
    /// The amount of times a request should be retried.
    /// Default: 80000
    public timeout: number = 80000;
    /// Host that requests are made to.
    /// Default: 'api.stripe.com'
    public host: string = 'api.stripe.com';
    /// Port that requests are made to.
    /// Default: 443
    public port: number = 443;
    /// 'https' or 'http'. http is never appropriate for sending requests to Stripe servers, and we strongly discourage http, 
    /// even in local testing scenarios, as this can result in your credentials being transmitted over an insecure channel.
    /// Default: https
    public protocol?: 'https' | 'http';
    /// Allow Stripe to send latency telemetry.
    /// Default: true
    public telemetry: boolean = true;

    /// Proxy agent to be used by the library.
    /// Default: null
    public httpAgent: any = null;

    constructor(config: ConfigParams) {
        //this.apiVersion = config.getAsStringWithDefault("options.apiVersion", this.apiVersion);
        this.maxNetworkRetries = config.getAsIntegerWithDefault("maxNetworkRetries", this.maxNetworkRetries);
        this.timeout = config.getAsIntegerWithDefault("timeout", this.timeout);
        this.host = config.getAsStringWithDefault("host", this.host);
        this.port = config.getAsIntegerWithDefault("port", this.port);

        let protocol = config.getAsStringWithDefault("protocol", 'https');
        this.protocol = protocol == 'https' ? 'https' : 'http';

        this.telemetry = config.getAsBooleanWithDefault("telemetry", this.telemetry);

        let httpAgent = config.getAsStringWithDefault("httpAgent", null);
        if (httpAgent != null) {
            {
                const ProxyAgent = require('https-proxy-agent');
                this.httpAgent = new ProxyAgent(this.httpAgent)
            }
        }
    }
}