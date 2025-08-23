/**
 * Utility function to recursively convert BigInt values to Numbers for JSON serialization
 * This is needed because JavaScript's JSON.stringify() cannot serialize BigInt values
 */
export function serializeBigInt(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }
  
  return obj;
}

/**
 * Convert paisa (stored as integers) to rupees for display
 */
export function paisaToRupees(paisa) {
  if (typeof paisa === 'bigint') {
    return Number(paisa) / 100;
  }
  return (paisa || 0) / 100;
}

/**
 * Convert rupees to paisa for storage
 */
export function rupeesToPaisa(rupees) {
  return Math.floor((rupees || 0) * 100);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount, currency = '₹') {
  if (typeof amount === 'bigint') {
    amount = Number(amount);
  }
  return `${currency}${(amount / 100).toFixed(2)}`;
}

/**
 * Serialize order data with proper BigInt handling and currency conversion
 */
export function serializeOrderData(order) {
  return {
    ...serializeBigInt(order),
    // Convert to rupees for display
    totalInRupees: paisaToRupees(order.total),
    deliveryChargesInRupees: paisaToRupees(order.deliveryCharges),
    gstAmountInRupees: paisaToRupees(order.gstAmount),
    commissionAmountInRupees: paisaToRupees(order.commissionAmount),
    // Keep original paisa values
    total: typeof order.total === 'bigint' ? Number(order.total) : order.total,
    deliveryCharges: typeof order.deliveryCharges === 'bigint' ? Number(order.deliveryCharges) : order.deliveryCharges,
    gstAmount: typeof order.gstAmount === 'bigint' ? Number(order.gstAmount) : order.gstAmount,
    commissionAmount: typeof order.commissionAmount === 'bigint' ? Number(order.commissionAmount) : order.commissionAmount,
    orderProducts: order.orderProducts?.map(product => serializeOrderProductData(product)) || []
  };
}

/**
 * Serialize order product data
 */
export function serializeOrderProductData(product) {
  return {
    ...serializeBigInt(product),
    // Convert to rupees for display
    sellingPriceInRupees: paisaToRupees(product.sellingPrice),
    totalPriceInRupees: paisaToRupees(product.totalPrice),
    discountInRupees: paisaToRupees(product.discount),
    finalMRPInRupees: paisaToRupees(product.finalMRP),
    homeDeliveryInRupees: paisaToRupees(product.homeDelivery),
    // Keep original paisa values
    sellingPrice: typeof product.sellingPrice === 'bigint' ? Number(product.sellingPrice) : product.sellingPrice,
    totalPrice: typeof product.totalPrice === 'bigint' ? Number(product.totalPrice) : product.totalPrice,
    discount: typeof product.discount === 'bigint' ? Number(product.discount) : product.discount,
    finalMRP: typeof product.finalMRP === 'bigint' ? Number(product.finalMRP) : product.finalMRP,
    homeDelivery: typeof product.homeDelivery === 'bigint' ? Number(product.homeDelivery) : product.homeDelivery
  };
}
