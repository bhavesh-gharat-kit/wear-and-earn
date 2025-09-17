import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const GET = async (request) => {
    try {

        const { searchParams } = new URL(request.url);
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : new Date().getFullYear();
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : null;

        if (month) {
            // Get specific month data
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);

            const monthlyResult = await prisma.order.aggregate({
                _sum: {
                    commissionAmount: true
                },
                where: {
                    status: 'delivered',
                    OR: [
                        {
                            deliveredAt: {
                                gte: startDate,
                                lte: endDate
                            }
                        },
                        {
                            deliveredAt: null,
                            createdAt: {
                                gte: startDate,
                                lte: endDate
                            }
                        }
                    ]
                }
            });

            const totalMLMSales = monthlyResult?._sum?.commissionAmount || 0;
            const companyEarnings = Math.floor(totalMLMSales * 0.30);

            return NextResponse.json({
                period: {
                    year,
                    month,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                },
                totalMLMSales: totalMLMSales,
                totalMLMSalesRupees: totalMLMSales / 100,
                companyEarnings: companyEarnings,
                companyEarningsRupees: companyEarnings / 100,
                companySharePercentage: 30
            });
        } else {
            // Get yearly data (monthly breakdown)
            const monthlyData = [];
            
            for (let monthNum = 1; monthNum <= 12; monthNum++) {
                const startDate = new Date(year, monthNum - 1, 1);
                const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

                const monthlyResult = await prisma.order.aggregate({
                    _sum: {
                        commissionAmount: true
                    },
                    _count: {
                        id: true
                    },
                    where: {
                        status: 'delivered',
                        OR: [
                            {
                                deliveredAt: {
                                    gte: startDate,
                                    lte: endDate
                                }
                            },
                            {
                                deliveredAt: null,
                                createdAt: {
                                    gte: startDate,
                                    lte: endDate
                                }
                            }
                        ]
                    }
                });

                const totalMLMSales = monthlyResult?._sum?.commissionAmount || 0;
                const companyEarnings = Math.floor(totalMLMSales * 0.30);
                const orderCount = monthlyResult?._count?.id || 0;

                monthlyData.push({
                    month: monthNum,
                    monthName: startDate.toLocaleDateString('en-US', { month: 'long' }),
                    totalMLMSales: totalMLMSales,
                    totalMLMSalesRupees: totalMLMSales / 100,
                    companyEarnings: companyEarnings,
                    companyEarningsRupees: companyEarnings / 100,
                    orderCount: orderCount,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });
            }

            // Calculate yearly totals
            const yearlyTotals = monthlyData.reduce((acc, month) => ({
                totalMLMSales: acc.totalMLMSales + month.totalMLMSales,
                companyEarnings: acc.companyEarnings + month.companyEarnings,
                orderCount: acc.orderCount + month.orderCount
            }), { totalMLMSales: 0, companyEarnings: 0, orderCount: 0 });

            return NextResponse.json({
                year,
                monthlyData,
                yearlyTotals: {
                    ...yearlyTotals,
                    totalMLMSalesRupees: yearlyTotals.totalMLMSales / 100,
                    companyEarningsRupees: yearlyTotals.companyEarnings / 100
                },
                companySharePercentage: 30
            });
        }

    } catch (error) {
        console.error('Error fetching company earnings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch company earnings', details: error.message },
            { status: 500 }
        );
    }
};