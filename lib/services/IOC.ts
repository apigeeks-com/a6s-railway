export class IOC {
    private static instances: any = {};

    /**
     * Unregister service
     * @param clazz
     */
    public static unregister(clazz: any) {
        delete IOC.instances[clazz];
    }

    /**
     * Register service
     * @param clazz - service class to register
     * @param [instance] - if not provided new instance of given class will be automatically created.
     * @returns {any}
     */
    public static register(clazz: any, instance?: any) {
        if (!instance) {
            instance = new clazz();
        }

        IOC.instances[clazz] = instance;

        return instance;
    }

    /**
     * Get instance for given class
     * If not registered earlier it will be done withing current method.
     * @param clazz
     * @returns {any}
     */
    public static get(clazz: any) {
        let instance = IOC.instances[clazz];

        if (!instance) {
            instance = IOC.register(clazz);
        }

        return instance;
    }
}
