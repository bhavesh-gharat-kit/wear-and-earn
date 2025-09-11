-- Database Performance Indexes for Pool MLM System
-- Run these SQL commands to improve performance

-- User level index for pool distribution
CREATE INDEX IF NOT EXISTS idx_user_level ON `User`(`level`);

-- Team completion index for team management
CREATE INDEX IF NOT EXISTS idx_team_complete ON `Team`(`isComplete`);

-- Pool distribution index
CREATE INDEX IF NOT EXISTS idx_pool_distributed ON `TurnoverPool`(`distributed`);

-- Wallet user index for transactions
CREATE INDEX IF NOT EXISTS idx_wallet_user ON `Wallet`(`userId`);

-- Self income installment status index
CREATE INDEX IF NOT EXISTS idx_installment_status ON `SelfIncomeInstallment`(`status`, `dueDate`);

-- Order user index for purchase tracking
CREATE INDEX IF NOT EXISTS idx_order_user ON `Order`(`userId`);

-- Team member user index
CREATE INDEX IF NOT EXISTS idx_team_member_user ON `TeamMember`(`userId`);

-- User sponsor index for MLM tree
CREATE INDEX IF NOT EXISTS idx_user_sponsor ON `User`(`sponsorId`);

-- Purchase user type index
CREATE INDEX IF NOT EXISTS idx_purchase_user_type ON `Purchase`(`userId`, `type`);

-- Pool distribution level index
CREATE INDEX IF NOT EXISTS idx_pool_dist_level ON `PoolDistribution`(`level`, `poolId`);
