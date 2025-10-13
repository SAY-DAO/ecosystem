export const NeedTypeEnum = {
  SERVICE: 0,
  PRODUCT: 1,
};

export const PaymentStatusEnum = {
  NOT_PAID: 0,
  PARTIAL_PAY: 1,
  COMPLETE_PAY: 2,
};

export const ProductStatusEnum = {
  EXP_DELIVERY_TO_NGO: -1,
  PARTIAL_PAY: PaymentStatusEnum.PARTIAL_PAY,
  COMPLETE_PAY: PaymentStatusEnum.COMPLETE_PAY,
  PURCHASED_PRODUCT: 3,
  DELIVERED_TO_NGO: 4,
  DELIVERED: 5, // done
};

export const ServiceStatusEnum = {
  PARTIAL_PAY: PaymentStatusEnum.PARTIAL_PAY,
  COMPLETE_PAY: PaymentStatusEnum.COMPLETE_PAY,
  MONEY_TO_NGO: 3,
  DELIVERED: 4, // done
};
