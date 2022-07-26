"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeOptions = void 0;
class StripeOptions {
    constructor(config) {
        /// The amount of times a request should be retried.
        /// Default: 0
        this.maxNetworkRetries = 0;
        /// The amount of times a request should be retried.
        /// Default: 80000
        this.timeout = 80000;
        /// Host that requests are made to.
        /// Default: 'api.stripe.com'
        this.host = 'api.stripe.com';
        /// Port that requests are made to.
        /// Default: 443
        this.port = 443;
        /// Allow Stripe to send latency telemetry.
        /// Default: true
        this.telemetry = true;
        /// Proxy agent to be used by the library.
        /// Default: null
        this.httpAgent = null;
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
                this.httpAgent = new ProxyAgent(this.httpAgent);
            }
        }
    }
}
exports.StripeOptions = StripeOptions;
//# sourceMappingURL=StripeOptions.js.map