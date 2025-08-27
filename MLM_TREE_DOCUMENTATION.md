# MLM Tree Management System Documentation

## Overview
This MLM tree management system implements a 5-level, 3-wide matrix structure with BFS (Breadth-First Search) auto-filling capability. It's designed for optimal performance with O(1) ancestor queries using a closure table pattern.

## Core Components

### 1. MLM Tree Utilities (`/lib/mlm-tree.ts`)

#### Key Functions:

##### `bfsFindOpenSlot(rootUserId: number)`
- **Purpose**: Finds the first available slot in the 3-wide matrix using BFS algorithm
- **Parameters**: `rootUserId` - Starting point for search (typically user ID 1)
- **Returns**: `{parentId, position}` where position is 1, 2, or 3
- **Algorithm**: Traverses tree level by level, checking each node for available child positions

##### `placeUserInMatrix(tx, newUserId, parentUserId?, position?)`
- **Purpose**: Places a user in the matrix with transaction safety
- **Parameters**: 
  - `tx` - Prisma transaction client
  - `newUserId` - User to place
  - `parentUserId` - Preferred parent (optional)
  - `position` - Specific position 1-3 (optional)
- **Returns**: Final placement location
- **Features**: Automatically builds hierarchy closure table up to 5 levels

##### `placeNewUserInMLMTree(newUserId, sponsorId?)`
- **Purpose**: High-level function for user placement with sponsor preference
- **Placement Logic**:
  1. If sponsorId provided → try placing under sponsor
  2. If sponsor placement fails → use BFS auto-filler
  3. If no sponsorId → use BFS auto-filler from root
- **Transaction Safe**: Uses Prisma transactions with automatic rollback

##### `getUplineAncestors(userId, maxDepth?)`
- **Purpose**: Retrieves all ancestors up to specified depth (default: 5)
- **Performance**: O(1) query using pre-built hierarchy closure table
- **Returns**: Array of ancestor info with depth levels

##### `getMatrixStats(userId)`
- **Purpose**: Provides comprehensive matrix statistics
- **Returns**:
  - `directChildren`: Count of immediate children
  - `totalDownline`: Total descendants at all levels
  - `activeDownline`: Count of active descendants
  - `maxDepth`: Maximum depth of downline tree

### 2. MLM Integration (`/lib/mlm-integration.ts`)

#### Registration & Onboarding:

##### `completeUserOnboarding(userData, sponsorReferralCode?)`
- **Purpose**: Complete user registration with MLM placement
- **Process**:
  1. Register user with sponsor relationship
  2. Generate unique referral code
  3. Place in matrix tree
  4. Return complete onboarding data

##### `activateUserInMLMSystem(userId, orderId)`
- **Purpose**: Activate user on first purchase
- **Actions**:
  - Set user.isActive = true
  - Mark order as joining order
  - Enable commission calculations

#### Dashboard & Analytics:

##### `getUserMLMDashboard(userId)`
- **Purpose**: Comprehensive MLM dashboard data
- **Returns**:
  - User profile information
  - Matrix statistics
  - Upline ancestor list
  - Recent commission history

## Database Schema

### MatrixNode Table
```sql
CREATE TABLE matrix_nodes (
  userId INT PRIMARY KEY,
  parentId INT NULL,
  position INT NULL, -- 1, 2, or 3
  INDEX(parentId)
);
```

### Hierarchy Closure Table
```sql
CREATE TABLE hierarchy (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ancestorId INT NOT NULL,
  descendantId INT NOT NULL,
  depth INT NOT NULL, -- 1 to 5
  UNIQUE(ancestorId, descendantId),
  INDEX(descendantId, depth),
  INDEX(ancestorId, depth)
);
```

## Placement Rules

### 1. Sponsor-Based Placement
- If user has sponsor → attempt placement under sponsor
- Find next available position (1 → 2 → 3) under sponsor
- If sponsor tree is full → use BFS auto-filler

### 2. BFS Auto-Filler
- Start from root user (typically ID 1)
- Use breadth-first search to find first available slot
- Ensures balanced tree growth
- Positions filled left to right (1 → 2 → 3)

### 3. Matrix Constraints
- Maximum 3 children per parent
- Maximum 5 levels deep
- Each position (1, 2, 3) filled sequentially

## API Usage Examples

### Find Open Slot
```javascript
GET /api/mlm/tree-management?action=find-open-slot&rootUserId=1

Response:
{
  "success": true,
  "data": {
    "parentId": 45,
    "position": 2
  }
}
```

### Place User in Matrix
```javascript
POST /api/mlm/tree-management
{
  "action": "place-user",
  "userId": 123,
  "sponsorId": 45
}

Response:
{
  "success": true,
  "data": {
    "parentId": 45,
    "position": 1
  }
}
```

### Complete User Onboarding
```javascript
POST /api/mlm/tree-management
{
  "action": "complete-onboarding",
  "userData": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "mobileNo": "9876543210",
    "gender": "male"
  },
  "sponsorReferralCode": "ABC123"
}

Response:
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "placement": {
      "parentId": 45,
      "position": 2
    },
    "upline": [
      {
        "ancestorId": 45,
        "depth": 1,
        "fullName": "Sponsor Name"
      }
    ]
  }
}
```

### Get User MLM Dashboard
```javascript
GET /api/mlm/tree-management?action=get-dashboard&userId=123

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "fullName": "John Doe",
      "referralCode": "XYZ789",
      "isActive": true,
      "walletBalance": 50000
    },
    "matrixStats": {
      "directChildren": 3,
      "totalDownline": 15,
      "activeDownline": 12,
      "maxDepth": 4
    },
    "upline": [/* ancestor array */],
    "recentCommissions": [/* commission history */]
  }
}
```

## Performance Characteristics

### Query Performance
- **Ancestor Lookup**: O(1) - Direct query to hierarchy table
- **Descendant Count**: O(1) - Aggregation on indexed columns
- **BFS Search**: O(n) where n is number of nodes searched
- **Tree Placement**: O(1) - Single insert with foreign key checks

### Scalability Features
- **Indexed Queries**: All common queries use database indexes
- **Closure Table**: Pre-computed relationships for fast ancestor/descendant queries
- **Transaction Safety**: All tree modifications are atomic
- **Batch Operations**: Hierarchy entries created in batches

## Error Handling

### Common Error Scenarios
1. **User Already Placed**: Prevents duplicate matrix entries
2. **Invalid Parent**: Validates parent user exists
3. **Position Occupied**: Checks position availability
4. **Tree Full**: Handles cases where no slots available
5. **Transaction Failures**: Automatic rollback on errors

### Error Response Format
```javascript
{
  "success": false,
  "error": "Detailed error message explaining the issue"
}
```

## Integration with Existing MLM System

### Commission Calculation
- Tree placement triggers commission distribution
- Uses existing `distributeJoiningCommission` function
- Integrates with ledger system for transaction tracking

### User Activation
- Users activated on first purchase
- Triggers matrix placement if not already placed
- Enables commission earning capability

### Referral System
- Sponsor relationships maintained in User table
- Referral codes auto-generated and unique
- Tree placement follows sponsor preference when possible

## Best Practices

### 1. Transaction Usage
Always use transactions for tree modifications:
```javascript
await prisma.$transaction(async (tx) => {
  // Tree modification operations
});
```

### 2. Error Handling
Implement comprehensive error handling:
```javascript
try {
  const result = await placeNewUserInMLMTree(userId, sponsorId);
} catch (error) {
  console.error('Placement failed:', error.message);
  // Handle error appropriately
}
```

### 3. Performance Monitoring
Monitor key metrics:
- Tree placement success rate
- BFS search performance
- Database query response times
- Transaction rollback frequency

### 4. Data Validation
Validate inputs before tree operations:
- User existence
- Sponsor validity
- Position availability
- Depth constraints

## Future Enhancements

### Potential Improvements
1. **Caching**: Redis cache for frequently accessed tree data
2. **Analytics**: Real-time tree growth analytics
3. **Visualization**: Tree structure visualization tools
4. **Migration**: Tools for tree restructuring
5. **Bulk Operations**: Batch user placement capabilities

### Maintenance Tasks
1. **Data Integrity**: Regular checks for orphaned nodes
2. **Performance Tuning**: Index optimization based on usage patterns
3. **Cleanup**: Remove inactive user branches periodically
4. **Backup**: Regular backup of tree structure data
