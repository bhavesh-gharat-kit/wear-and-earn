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
        
        return Response.json({
            totalOrders,
            totalUsers, 
            totalProducts,
            totalInStockQuantity,
            mlmStats: {
                activeMLMUsers,
                totalCommissionAmount,
                totalReferrals
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return Response.json(
            { error: 'Failed to fetch dashboard stats', details: error.message },
            { status: 500 }
        );
    }
}