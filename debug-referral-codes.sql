-- Check users and their referral code status
SELECT 
  id,
  fullName,
  referralCode,
  isActive,
  createdAt
FROM users 
LIMIT 10;

-- Check orders and their payment status  
SELECT 
  id,
  userId,
  status,
  paidAt,
  total
FROM `order`
ORDER BY createdAt DESC
LIMIT 10;

-- Check which users have orders but no referral codes
SELECT 
  u.id,
  u.fullName,
  u.referralCode,
  u.isActive,
  COUNT(o.id) as order_count,
  COUNT(CASE WHEN o.paidAt IS NOT NULL THEN 1 END) as paid_order_count
FROM users u
LEFT JOIN `order` o ON u.id = o.userId
GROUP BY u.id, u.fullName, u.referralCode, u.isActive
HAVING paid_order_count > 0 AND u.referralCode IS NULL;
