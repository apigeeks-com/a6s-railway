export interface IK8sCleanupOptions {
    cleanup: boolean;
    namespace: string;
    allowed?: {
        storageClass?: string[],
        persistentVolumeClaims?: string[],
        helms?: string[],
        secrets?: string[],
        configMaps?: string[],
    };
}
