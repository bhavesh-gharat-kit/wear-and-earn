# 🚨 **MLM POOL PLAN - ROLLBACK EMERGENCY PLAN** 🚨

## 📋 **EMERGENCY CONTACT INFO**
- **Implementation Date**: September 9, 2025
- **Backup Location**: `backups/20250909_214556/codebase_backup`
- **Git Commit Hash**: 9831caa (MLM Implementation Logbook)

---

## 🔥 **INSTANT ROLLBACK PROCEDURES**

### **SCENARIO 1: Database Issues** 
```bash
# Stop the application immediately
pm2 stop all  # or kill the process

# Restore from backup
cd /home/darshan/darshan/WEB\ DEVELOPMENT\ /WEAR\ AND\ EARN
cp -r backups/20250909_214556/codebase_backup/* .

# Reset database (if needed)
npx prisma db push --force-reset
npx prisma generate
```

### **SCENARIO 2: Code Breaking Changes**
```bash
# Git rollback to last working state
git reset --hard 9831caa
git clean -fd

# Restore Prisma
npx prisma generate
npm run dev
```

### **SCENARIO 3: Complete System Failure**
```bash
# Nuclear option - full restore
rm -rf * .[^.]*
cp -r backups/20250909_214556/codebase_backup/* .
cp -r backups/20250909_214556/codebase_backup/.[^.]* .
npm install
npx prisma generate
```

---

## ⚠️ **CRITICAL FILES TO MONITOR**
- `/prisma/schema.prisma` - Database schema changes
- `/lib/prisma.js` - Database connection
- All `/api/` routes - API functionality
- MLM-related components

---

## 📞 **EMERGENCY CHECKLIST**
- [ ] Backup verified and accessible
- [ ] Database connection working
- [ ] Git history preserved
- [ ] All dependencies installed
- [ ] Admin access functional

---

## 🛑 **ABORT IMPLEMENTATION IF:**
1. Database corruption detected
2. User data loss occurs  
3. Payment system affected
4. Admin access broken
5. Site completely down > 5 minutes

**Remember: Better to rollback and fix than push broken code!**
