import { NextResponse as res } from "next/server";
import prisma from "@/lib/prisma";



export const GET = async () => {
    try {
        // Basic counts
        const totalOrders = await prisma.order.count();
        const totalUsers = await prisma.user.count();
        const totalProducts = await prisma.product.count();
        
        // Aggregate for inStock
        const inStockResult = await prisma.product.aggregate({
            _sum: {
                inStock: true
            }
        });
        
        const totalInStockQuantity = inStockResult?._sum?.inStock || 0;
        
        // MLM stats
        const activeMLMUsers = await prisma.user.count({
            where: {
                isActive: true
            }
        });
        
        const totalReferrals = await prisma.user.count({
            where: {
                referralCode: {
                    not: null
                }
            }
        });
        
        // Commission from ledger with careful error handling
        let totalCommissionAmount = 0;
        try {
            const commissionResult = await prisma.ledger.aggregate({
                _sum: {
                    amount: true
                },
                where: {
                    type: 'COMMISSION'
                }
            });
            totalCommissionAmount = commissionResult?._sum?.amount || 0;
        } catch (ledgerError) {
            console.error('Ledger query error:', ledgerError);
            totalCommissionAmount = 0;
        }

        // Calculate company earnings (30% of all MLM sales)
        let totalCompanyEarnings = 0;
        try {
            const mlmSalesResult = await prisma.order.aggregate({
                _sum: {
                    commissionAmount: true
                },
                where: {
                    status: 'delivered' // Only count delivered orders
                }
            });
            const totalMLMSales = mlmSalesResult?._sum?.commissionAmount || 0;
            // Company gets 30% of MLM sales (commissionAmount is in paisa, so convert and calculate)
            totalCompanyEarnings = Math.floor(totalMLMSales * 0.30);
        } catch (companyEarningsError) {
            console.error('Company earnings calculation error:', companyEarningsError);
            totalCompanyEarnings = 0;
        }

        // Visitor statistics
        let visitorStats = {
            totalVisitors: 0,
            todayVisitors: 0,
            uniqueVisitors: 0
        };
        try {
            // Total visitors
            const totalVisitors = await prisma.visitor.count();
            
            // Today's visitors
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const todayVisitors = await prisma.visitor.count({
                where: {
                    timestamp: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            });

            // Unique visitors (unique IP addresses)
            const uniqueVisitors = await prisma.visitor.groupBy({
                by: ['ipAddress']
            });

            visitorStats = {
                totalVisitors,
                todayVisitors,
                uniqueVisitors: uniqueVisitors.length
            };
        } catch (visitorError) {
            console.error('Visitor stats calculation error:', visitorError);
        }
        
        return Response.json({
            totalOrders,
            totalUsers, 
            totalProducts,
            totalInStockQuantity,
            mlmStats: {
                activeMLMUsers,
                totalCommissionAmount,
                totalReferrals
            },
            companyEarnings: {
                totalEarnings: totalCompanyEarnings, // In paisa
                totalEarningsRupees: totalCompanyEarnings / 100 // In rupees for display
            },
            visitorStats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return Response.json(
            { error: 'Failed to fetch dashboard stats', details: error.message },
            { status: 500 }
        );
    }
}