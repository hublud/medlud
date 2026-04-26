// Global browser type extensions for third-party SDKs loaded via <script> tag

interface FlutterwaveConfig {
    public_key: string;
    tx_ref: string;
    amount: number;
    currency: string;
    payment_options?: string;
    customer: {
        email: string;
        name?: string;
        phone_number?: string;
    };
    meta?: Record<string, any>;
    customizations?: {
        title?: string;
        description?: string;
        logo?: string;
    };
    callback: (response: { tx_ref: string; transaction_id: number; status: string }) => void;
    onclose: () => void;
}

interface Window {
    FlutterwaveCheckout: (config: FlutterwaveConfig) => { close: () => void };
}
