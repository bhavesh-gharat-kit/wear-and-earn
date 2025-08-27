// Example usage of MLM tree utility functions
// This file demonstrates how to use the MLM tree placement functions

import {
  bfsFindOpenSlot,
  placeNewUserInMLMTree,
  getUplineAncestors,
  getDownlineTree,
  getMatrixStats
} from './mlm-tree';

/**
 * Example: Place a new user in the MLM tree
 */
async function examplePlaceUser() {
  try {
    // Example 1: Place user with sponsor
    const newUserId = 123;
    const sponsorId = 45;
    
    const placement = await placeNewUserInMLMTree(newUserId, sponsorId);
    console.log('User placed at:', placement);
    
    // Example 2: Place user without sponsor (BFS auto-fill)
    const anotherUserId = 124;
    const autoPlacement = await placeNewUserInMLMTree(anotherUserId);
    console.log('Auto-placed user at:', autoPlacement);
    
  } catch (error) {
    console.error('Error placing user:', error);
  }
}

/**
 * Example: Find open slot manually
 */
async function exampleFindOpenSlot() {
  try {
    const rootUserId = 1;
    const openSlot = await bfsFindOpenSlot(rootUserId);
    
    if (openSlot) {
      console.log(`Found open slot: Parent ${openSlot.parentId}, Position ${openSlot.position}`);
    } else {
      console.log('No open slots available');
    }
    
  } catch (error) {
    console.error('Error finding open slot:', error);
  }
}

/**
 * Example: Get user's upline ancestors
 */
async function exampleGetUpline() {
  try {
    const userId = 123;
    const ancestors = await getUplineAncestors(userId, 5);
    
    console.log('Upline ancestors:');
    ancestors.forEach(ancestor => {
      console.log(`Level ${ancestor.depth}: ${ancestor.fullName} (ID: ${ancestor.ancestorId})`);
    });
    
  } catch (error) {
    console.error('Error getting upline:', error);
  }
}

/**
 * Example: Get user's downline tree
 */
async function exampleGetDownline() {
  try {
    const userId = 45;
    const downline = await getDownlineTree(userId, 5);
    
    console.log('Downline tree:');
    downline.forEach(descendant => {
      const indent = '  '.repeat(descendant.depth);
      console.log(`${indent}Level ${descendant.depth}: ${descendant.fullName} (ID: ${descendant.userId}) - Active: ${descendant.isActive}`);
    });
    
  } catch (error) {
    console.error('Error getting downline:', error);
  }
}

/**
 * Example: Get matrix statistics
 */
async function exampleGetStats() {
  try {
    const userId = 45;
    const stats = await getMatrixStats(userId);
    
    console.log('Matrix Statistics:');
    console.log(`Direct Children: ${stats.directChildren}`);
    console.log(`Total Downline: ${stats.totalDownline}`);
    console.log(`Active Downline: ${stats.activeDownline}`);
    console.log(`Maximum Depth: ${stats.maxDepth}`);
    
  } catch (error) {
    console.error('Error getting stats:', error);
  }
}

/**
 * Complete example workflow
 */
async function exampleWorkflow() {
  try {
    console.log('=== MLM Tree Management Workflow ===');
    
    // 1. Find where to place a new user
    console.log('\n1. Finding open slot...');
    await exampleFindOpenSlot();
    
    // 2. Place users in the tree
    console.log('\n2. Placing users...');
    // await examplePlaceUser(); // Uncomment when you have actual user IDs
    
    // 3. Check upline structure
    console.log('\n3. Checking upline...');
    // await exampleGetUpline(); // Uncomment when you have actual user IDs
    
    // 4. View downline tree
    console.log('\n4. Viewing downline...');
    // await exampleGetDownline(); // Uncomment when you have actual user IDs
    
    // 5. Get statistics
    console.log('\n5. Getting statistics...');
    // await exampleGetStats(); // Uncomment when you have actual user IDs
    
    console.log('\n=== Workflow completed ===');
    
  } catch (error) {
    console.error('Workflow error:', error);
  }
}

// Export all examples for easy testing
export {
  examplePlaceUser,
  exampleFindOpenSlot,
  exampleGetUpline,
  exampleGetDownline,
  exampleGetStats,
  exampleWorkflow
};
