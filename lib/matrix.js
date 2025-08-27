import { PrismaClient } from "@/app/generated/prisma";

export async function bfsFindOpenSlot(tx, rootUserId) {
  const queue = [rootUserId];
  
  while (queue.length) {
    const uid = queue.shift();
    
    const children = await tx.matrixNode.findMany({
      where: { parentId: uid },
      orderBy: { position: 'asc' }
    });
    
    if (children.length < 3) {
      const used = new Set(children.map(c => c.position).filter(p => p !== null));
      const pos = [1, 2, 3].find(p => !used.has(p));
      return { parentId: uid, position: pos };
    }
    
    queue.push(...children.map(c => c.userId));
  }
  
  // Should never happen if tree exists, but fallback to root
  return { parentId: rootUserId, position: 1 };
}

export async function placeUserInMatrix(tx, newUserId, parentUserId, position) {
  await tx.matrixNode.create({
    data: { 
      userId: newUserId, 
      parentId: parentUserId, 
      position: position || null 
    }
  });
  
  // Build closure up to 5 ancestors (reduced from 7)
  let current = await tx.matrixNode.findUnique({ 
    where: { userId: parentUserId }
  });
  
  let depth = 1;
  while (current && depth <= 5) {
    await tx.hierarchy.create({
      data: { 
        ancestorId: current.userId, 
        descendantId: newUserId, 
        depth 
      }
    });
    
    current = current.parentId
      ? await tx.matrixNode.findUnique({ where: { userId: current.parentId }})
      : null;
    depth++;
  }
}

export async function getGlobalRootId(tx) {
  // Find the global root user (company owner) - usually the first admin user
  const rootUser = await tx.user.findFirst({
    where: { 
      OR: [
        { role: "admin" },
        { id: 1 } // fallback to user ID 1
      ]
    },
    orderBy: { id: 'asc' }
  });
  
  if (!rootUser) {
    throw new Error('No root user found. Please create an admin user first.');
  }
  
  // Ensure root user has a matrix node
  const rootNode = await tx.matrixNode.findUnique({
    where: { userId: rootUser.id }
  });
  
  if (!rootNode) {
    await tx.matrixNode.create({
      data: {
        userId: rootUser.id,
        parentId: null,
        position: null
      }
    });
  }
  
  return rootUser.id;
}
