import { NextResponse as res } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const GET = async () => {
    try {
        const [totalOrders, totalUsers, totalProducts, inStockTotal, mlmStats] = await Promise.all([
            prisma.order.count(),
            prisma.user.count(),
            prisma.product.count(),
            prisma.product.aggregate({
                _sum: {
                    inStock: true
                }
            }),
            // MLM Statistics
            Promise.all([
                prisma.user.count({
                    where: {
                        isActive: true
                    }
                }),
                prisma.ledger.aggregate({
                    _sum: {
                        amount: true
                    },
                    where: {
                        type: 'COMMISSION'
                    }
                }),
                prisma.user.count({
                    where: {
                        referralCode: {
                            not: null
                        }
                    }
                })
            ])
        ]);
        
        const totalInStockQuantity = inStockTotal._sum.inStock || 0;
        const [activeMLMUsers, totalCommissions, totalReferrals] = mlmStats;
        const totalCommissionAmount = totalCommissions._sum.amount || 0;
        
        return res.json({
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
        return res.json(
            { error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        );
    }
}