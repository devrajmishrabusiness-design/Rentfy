export const defaultIdFactory = (): string => {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${time}-${random}`;
};

export const defaultCorrelationFactory = (): string => {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 14);
  return `corr_${time}_${random}`;
};

export const defaultErrorFactory = (): string => {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 12);
  return `err_${time}_${random}`;
};
