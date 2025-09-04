import { PrismaClient } from '@prisma/client';
import { processMLMOrder } from './mlm-new-system.js';

const prisma = new PrismaClient();

/**
 * Main entry point for MLM commission processing
 * This is called when an order is marked as paid
 */
export async function handlePaidJoining(tx, order) {
  console.log('=== NEW MLM SYSTEM - Processing paid order:', order.id);
  
  try {
    const result = await processMLMOrder(tx, order);
    console.log('MLM processing result:', result);
    return result;
  } catch (error) {
    console.error('Error in MLM commission processing:', error);
    throw error;
  }
}

/**
 * Legacy function - redirects to new system
 */
export async function handlePaidRepurchase(tx, order) {
  console.log('=== NEW MLM SYSTEM - Processing repurchase order:', order.id);
  
  try {
    const result = await processMLMOrder(tx, order);
    console.log('MLM repurchase processing result:', result);
    return result;
  } catch (error) {
    console.error('Error in MLM repurchase processing:', error);
    throw error;
  }
}

/**
 * Calculate commission breakdown for display (not actual processing)
 */
export function calculateMlmCommissions(productPrice) {
  const companyShare = Math.floor(productPrice * 0.30);
  const userPortion = productPrice - companyShare;
  const selfIncome = Math.floor(userPortion * 0.20);
  
  // First purchase level commissions
  const levelCommissions = [
    Math.floor(userPortion * 0.25), // L1: 25%
    Math.floor(userPortion * 0.20), // L2: 20%  
    Math.floor(userPortion * 0.15), // L3: 15%
    Math.floor(userPortion * 0.10), // L4: 10%
    Math.floor(userPortion * 0.10)  // L5: 10%
  ];
  
  return {
    companyShare,
    userPortion,
    selfIncome,
    levelCommissions
  };
}