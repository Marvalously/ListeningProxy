export default class SampleClass {
    constructor() {
        this.foo = 'bar';
        this.objPty = {
            foo: 'bar'
        };
    }

    doSomething(value) {
        this.foo = value;
    }

    get fooProperty() {
        return this.foo;
    }
}