 /*
    * Utility method for determining if a given target is a class
    *
    * Kudos to https://stackoverflow.com/users/76840/aikeru
    *      see https://stackoverflow.com/a/43197340/1891743
    */
export const isClass = (target) => {
    if (!target || typeof target !== 'object') {
        return false;
    }
    const isConstructorClass = target.constructor && target.constructor.toString().substring(0, 5) === 'class';
    if (target.prototype === undefined) {
        return isConstructorClass;
    }
    return isConstructorClass
        || (target.prototype.constructor
            && target.prototype.constructor.toString
            && target.prototype.constructor.toString().substring(0, 5) === 'class');
}