export function defineProperty<T>(
    object: T,
    property: PropertyKey,
    descriptor: PropertyDescriptor & ThisType<any>
): T {
    descriptor.configurable ??= true;
    descriptor.enumerable ??= true;

    if ('value' in descriptor) {
        descriptor.writable ??= true;
    }

    return Object.defineProperty(object, property, descriptor);
}