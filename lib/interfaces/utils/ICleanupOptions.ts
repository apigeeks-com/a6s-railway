export interface ICleanupOptions {
    namespace: string;
    allowed?: {
        storageClass?: string[],
        pvc?: string[],
        helms?: string[],
        secrets?: string[],
        configMaps?: string[],
    };
}
