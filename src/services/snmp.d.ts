export declare function pollOlt(ip: string, community: string, type: 'ZTE' | 'HIOSO', snMac: string): Promise<{
    rx_live: number;
    tx_live: number;
    status: "ONLINE" | "LOS" | "OFFLINE";
}>;
//# sourceMappingURL=snmp.d.ts.map