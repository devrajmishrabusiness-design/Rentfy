"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultErrorFactory = exports.defaultCorrelationFactory = exports.defaultIdFactory = void 0;
const defaultIdFactory = () => {
    const time = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `${time}-${random}`;
};
exports.defaultIdFactory = defaultIdFactory;
const defaultCorrelationFactory = () => {
    const time = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 14);
    return `corr_${time}_${random}`;
};
exports.defaultCorrelationFactory = defaultCorrelationFactory;
const defaultErrorFactory = () => {
    const time = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 12);
    return `err_${time}_${random}`;
};
exports.defaultErrorFactory = defaultErrorFactory;
//# sourceMappingURL=id-factories.js.map