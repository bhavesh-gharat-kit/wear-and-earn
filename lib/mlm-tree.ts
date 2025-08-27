import { PrismaClient } from '@prisma/client';
import prisma from './prisma';

// Types for better type safety
interface OpenSlot {
  parentId: number;
  position: number; // 1, 2, or 3
}

interface AncestorInfo {
  ancestorId: number;
  depth: number;
  fullName?: string;
}

// Constants
const MAX_CHILDREN_PER_PARENT = 3;
const MAX_HIERARCHY_DEPTH = 5;
const ROOT_USER_ID = 1; // Assuming first user is root, adjust as needed

/**
 * BFS Auto-filler function to find the first available slot in 3-wide matrix
 * Uses breadth-first search from specified root user
 * @param rootUserId - Starting point for BFS search
 * @returns Promise<OpenSlot | null> - First available slot or null if tree is full
 */
export async function bfsFindOpenSlot(rootUserId: number): Promise<OpenSlot | null> {
  try {
    // Queue for BFS - contains user IDs to process
    const queue: number[] = [rootUserId];
    const visited = new Set<number>();
    
    while (queue.length > 0) {
      const currentUserId = queue.shift()!;
      
      if (visited.has(currentUserId)) {
        continue;
      }
      visited.add(currentUserId);
      
      // Get current user's matrix node and children count
      const currentNode = await prisma.matrixNode.findUnique({
        where: { userId: currentUserId },
        include: {
          children: {
            orderBy: { position: 'asc' }
          }
        }
      });
      
      // If user doesn't have a matrix node, create one (for root case)
      if (!currentNode) {
        if (currentUserId === rootUserId) {
          await prisma.matrixNode.create({
            data: {
              userId: rootUserId,
              parentId: null,
              position: null
            }
          });
        }
        continue;
      }
      
      // Check if current user has available slots (less than 3 children)
      const occupiedPositions = new Set(
        currentNode.children.map(child => child.position).filter(pos => pos !== null)
      );
      
      // Find first available position (1, 2, or 3)
      for (let position = 1; position <= MAX_CHILDREN_PER_PARENT; position++) {
        if (!occupiedPositions.has(position)) {
          return {
            parentId: currentUserId,
            position
          };
        }
      }
      
      // If current user is full, add their children to queue for next level
      currentNode.children.forEach(child => {
        if (!visited.has(child.userId)) {
          queue.push(child.userId);
        }
      });
    }
    
    // No available slots found
    return null;
  } catch (error) {
    console.error('Error in bfsFindOpenSlot:', error);
    throw new Error(`Failed to find open slot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Places a user in the matrix tree with proper transaction handling
 * @param tx - Prisma transaction client
 * @param newUserId - ID of user to place in tree
 * @param parentUserId - Preferred parent user ID (optional)
 * @param position - Specific position under parent (optional, will find next available if not specified)
 * @returns Promise<OpenSlot> - The actual placement location
 */
export async function placeUserInMatrix(
  tx: any, // Prisma transaction type
  newUserId: number,
  parentUserId?: number,
  position?: number
): Promise<OpenSlot> {
  try {
    // Validate that user exists
    const user = await tx.user.findUnique({
      where: { id: newUserId }
    });
    
    if (!user) {
      throw new Error(`User with ID ${newUserId} not found`);
    }
    
    // Check if user already has a matrix node
    const existingNode = await tx.matrixNode.findUnique({
      where: { userId: newUserId }
    });
    
    if (existingNode) {
      throw new Error(`User ${newUserId} is already placed in matrix`);
    }
    
    let finalParentId: number;
    let finalPosition: number;
    
    if (parentUserId && position) {
      // Specific placement requested
      await validatePlacement(tx, parentUserId, position);
      finalParentId = parentUserId;
      finalPosition = position;
    } else if (parentUserId) {
      // Parent specified, find next available position
      const availablePosition = await findNextAvailablePosition(tx, parentUserId);
      if (!availablePosition) {
        throw new Error(`No available positions under parent ${parentUserId}`);
      }
      finalParentId = parentUserId;
      finalPosition = availablePosition;
    } else {
      // Use BFS auto-filler from root
      const openSlot = await bfsFindOpenSlot(ROOT_USER_ID);
      if (!openSlot) {
        throw new Error('No available slots in the entire matrix tree');
      }
      finalParentId = openSlot.parentId;
      finalPosition = openSlot.position;
    }
    
    // Create matrix node entry
    await tx.matrixNode.create({
      data: {
        userId: newUserId,
        parentId: finalParentId,
        position: finalPosition
      }
    });
    
    // Build hierarchy closure table
    await buildHierarchyForUser(tx, newUserId, finalParentId);
    
    return {
      parentId: finalParentId,
      position: finalPosition
    };
    
  } catch (error) {
    console.error('Error in placeUserInMatrix:', error);
    throw new Error(`Failed to place user in matrix: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates if a specific placement is available
 * @param tx - Prisma transaction client
 * @param parentUserId - Parent user ID
 * @param position - Desired position (1, 2, or 3)
 */
async function validatePlacement(tx: any, parentUserId: number, position: number): Promise<void> {
  if (position < 1 || position > MAX_CHILDREN_PER_PARENT) {
    throw new Error(`Invalid position ${position}. Must be between 1 and ${MAX_CHILDREN_PER_PARENT}`);
  }
  
  // Check if parent exists
  const parent = await tx.user.findUnique({
    where: { id: parentUserId }
  });
  
  if (!parent) {
    throw new Error(`Parent user ${parentUserId} not found`);
  }
  
  // Check if position is already occupied
  const existingChild = await tx.matrixNode.findFirst({
    where: {
      parentId: parentUserId,
      position: position
    }
  });
  
  if (existingChild) {
    throw new Error(`Position ${position} under parent ${parentUserId} is already occupied`);
  }
}

/**
 * Finds the next available position under a parent
 * @param tx - Prisma transaction client
 * @param parentUserId - Parent user ID
 * @returns Promise<number | null> - Next available position or null if full
 */
async function findNextAvailablePosition(tx: any, parentUserId: number): Promise<number | null> {
  const children = await tx.matrixNode.findMany({
    where: { parentId: parentUserId },
    select: { position: true }
  });
  
  const occupiedPositions = new Set(
    children.map((child: any) => child.position).filter((pos: any) => pos !== null)
  );
  
  for (let position = 1; position <= MAX_CHILDREN_PER_PARENT; position++) {
    if (!occupiedPositions.has(position)) {
      return position;
    }
  }
  
  return null; // All positions occupied
}

/**
 * Gets upline ancestors for a user up to specified depth
 * @param userId - User ID to get ancestors for
 * @param maxDepth - Maximum depth to traverse (default: 5)
 * @returns Promise<AncestorInfo[]> - Array of ancestor information
 */
export async function getUplineAncestors(userId: number, maxDepth: number = MAX_HIERARCHY_DEPTH): Promise<AncestorInfo[]> {
  try {
    const ancestors = await prisma.hierarchy.findMany({
      where: {
        descendantId: userId,
        depth: {
          lte: maxDepth
        }
      },
      include: {
        ancestor: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        depth: 'asc'
      }
    });
    
    return ancestors.map(hierarchy => ({
      ancestorId: hierarchy.ancestorId,
      depth: hierarchy.depth,
      fullName: hierarchy.ancestor.fullName
    }));
    
  } catch (error) {
    console.error('Error in getUplineAncestors:', error);
    throw new Error(`Failed to get upline ancestors: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Builds hierarchy closure table entries for a user
 * @param tx - Prisma transaction client
 * @param userId - New user ID
 * @param parentId - Parent user ID
 */
export async function buildHierarchyForUser(tx: any, userId: number, parentId: number): Promise<void> {
  try {
    // First, create self-reference (depth 0 is optional, but can be useful)
    // await tx.hierarchy.create({
    //   data: {
    //     ancestorId: userId,
    //     descendantId: userId,
    //     depth: 0
    //   }
    // });
    
    // Get all ancestors of the parent up to depth 4 (so new user will be at depth 5 max)
    const parentAncestors = await tx.hierarchy.findMany({
      where: {
        descendantId: parentId,
        depth: {
          lt: MAX_HIERARCHY_DEPTH // Less than 5, so we can add one more level
        }
      }
    });
    
    // Create hierarchy entries for all ancestors + the direct parent
    const hierarchyEntries = [];
    
    // Add direct parent relationship (depth 1)
    hierarchyEntries.push({
      ancestorId: parentId,
      descendantId: userId,
      depth: 1
    });
    
    // Add all ancestor relationships (depth + 1)
    for (const ancestor of parentAncestors) {
      const newDepth = ancestor.depth + 1;
      if (newDepth <= MAX_HIERARCHY_DEPTH) {
        hierarchyEntries.push({
          ancestorId: ancestor.ancestorId,
          descendantId: userId,
          depth: newDepth
        });
      }
    }
    
    // Batch create all hierarchy entries
    if (hierarchyEntries.length > 0) {
      await tx.hierarchy.createMany({
        data: hierarchyEntries,
        skipDuplicates: true // Prevent errors if entries already exist
      });
    }
    
  } catch (error) {
    console.error('Error in buildHierarchyForUser:', error);
    throw new Error(`Failed to build hierarchy: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * High-level function to place a new user in the MLM tree
 * Handles the complete placement logic with sponsor preference and BFS fallback
 * @param newUserId - ID of user to place
 * @param sponsorId - Sponsor user ID (optional)
 * @returns Promise<OpenSlot> - Final placement location
 */
export async function placeNewUserInMLMTree(newUserId: number, sponsorId?: number): Promise<OpenSlot> {
  return await prisma.$transaction(async (tx) => {
    try {
      let placementResult: OpenSlot;
      
      if (sponsorId) {
        // Try to place under sponsor first
        try {
          placementResult = await placeUserInMatrix(tx, newUserId, sponsorId);
          console.log(`User ${newUserId} placed under sponsor ${sponsorId} at position ${placementResult.position}`);
        } catch (error) {
          // If sponsor placement fails, use BFS auto-filler
          console.warn(`Sponsor placement failed for user ${newUserId}, using BFS auto-filler:`, error);
          placementResult = await placeUserInMatrix(tx, newUserId);
          console.log(`User ${newUserId} placed using BFS at parent ${placementResult.parentId}, position ${placementResult.position}`);
        }
      } else {
        // No sponsor, use BFS auto-filler from root
        placementResult = await placeUserInMatrix(tx, newUserId);
        console.log(`User ${newUserId} placed using BFS at parent ${placementResult.parentId}, position ${placementResult.position}`);
      }
      
      return placementResult;
      
    } catch (error) {
      console.error('Error in placeNewUserInMLMTree:', error);
      throw error; // Re-throw to trigger transaction rollback
    }
  });
}

/**
 * Gets the complete downline tree for a user
 * @param userId - User ID to get downline for
 * @param maxDepth - Maximum depth to retrieve (default: 5)
 * @returns Promise<any[]> - Tree structure with children
 */
export async function getDownlineTree(userId: number, maxDepth: number = MAX_HIERARCHY_DEPTH): Promise<any[]> {
  try {
    const descendants = await prisma.hierarchy.findMany({
      where: {
        ancestorId: userId,
        depth: {
          lte: maxDepth
        }
      },
      include: {
        descendant: {
          select: {
            id: true,
            fullName: true,
            isActive: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { depth: 'asc' },
        { descendantId: 'asc' }
      ]
    });
    
    return descendants.map(hierarchy => ({
      userId: hierarchy.descendantId,
      depth: hierarchy.depth,
      fullName: hierarchy.descendant.fullName,
      isActive: hierarchy.descendant.isActive,
      createdAt: hierarchy.descendant.createdAt
    }));
    
  } catch (error) {
    console.error('Error in getDownlineTree:', error);
    throw new Error(`Failed to get downline tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Utility function to get matrix statistics for a user
 * @param userId - User ID to get stats for
 * @returns Promise<object> - Statistics object
 */
export async function getMatrixStats(userId: number): Promise<{
  directChildren: number;
  totalDownline: number;
  maxDepth: number;
  activeDownline: number;
}> {
  try {
    const [directChildren, allDescendants] = await Promise.all([
      // Direct children count
      prisma.matrixNode.count({
        where: { parentId: userId }
      }),
      
      // All descendants
      prisma.hierarchy.findMany({
        where: { ancestorId: userId },
        include: {
          descendant: {
            select: {
              isActive: true
            }
          }
        }
      })
    ]);
    
    const totalDownline = allDescendants.length;
    const activeDownline = allDescendants.filter(d => d.descendant.isActive).length;
    const maxDepth = allDescendants.length > 0 ? Math.max(...allDescendants.map(d => d.depth)) : 0;
    
    return {
      directChildren,
      totalDownline,
      maxDepth,
      activeDownline
    };
    
  } catch (error) {
    console.error('Error in getMatrixStats:', error);
    throw new Error(`Failed to get matrix stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
