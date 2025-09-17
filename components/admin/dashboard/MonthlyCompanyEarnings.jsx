"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function MonthlyCompanyEarnings() {
    const [yearlyData, setYearlyData] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    const fetchMonthlyEarnings = async (year) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/admin/company-earnings?year=${year}`);
            if (response.status === 200) {
                setYearlyData(response.data);
            }
        } catch (error) {
            console.error('Error fetching monthly earnings:', error);
            toast.error('Failed to fetch monthly earnings data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonthlyEarnings(selectedYear);
    }, [selectedYear]);

    const handleYearChange = (year) => {
        setSelectedYear(year);
    };

    const getAvailableYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear; i >= currentYear - 3; i--) {
            years.push(i);
        }
        return years;
    };

    if (loading) {
        return (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
                    <div className="grid grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!yearlyData) {
        return null;
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentMonthData = yearlyData.monthlyData.find(month => month.month === currentMonth) || {};

    return (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-gray-800 dark:text-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    📊 Monthly Company Earnings
                </h2>
                <div className="flex items-center gap-4">
                    <select 
                        value={selectedYear} 
                        onChange={(e) => handleYearChange(parseInt(e.target.value))}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {getAvailableYears().map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                    >
                        {isExpanded ? 'Show Less' : 'View All Months'}
                    </button>
                </div>
            </div>

            {/* Current Month Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                        This Month ({currentMonthData.monthName || 'Current'})
                    </h3>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        ₹{currentMonthData.companyEarningsRupees?.toLocaleString('en-IN') || '0'}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        From {currentMonthData.orderCount || 0} delivered orders
                    </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <h3 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                        Year Total ({selectedYear})
                    </h3>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        ₹{yearlyData.yearlyTotals.companyEarningsRupees?.toLocaleString('en-IN') || '0'}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                        From {yearlyData.yearlyTotals.orderCount || 0} delivered orders
                    </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <h3 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">
                        Average Monthly
                    </h3>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        ₹{((yearlyData.yearlyTotals.companyEarningsRupees || 0) / 12).toFixed(0)}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                        Projected earnings
                    </p>
                </div>
            </div>

            {/* Monthly Breakdown */}
            {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-medium mb-4">Monthly Breakdown - {selectedYear}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {yearlyData.monthlyData.map((month) => (
                            <div 
                                key={month.month}
                                className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border ${
                                    month.month === currentMonth 
                                        ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {month.monthName}
                                    </h4>
                                    {month.month === currentMonth && (
                                        <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    ₹{month.companyEarningsRupees?.toLocaleString('en-IN') || '0'}
                                </p>
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                                    <span>Orders: {month.orderCount}</span>
                                    <span>MLM: ₹{month.totalMLMSalesRupees?.toLocaleString('en-IN') || '0'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Note */}
            <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Company Earnings Calculation
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            Only counts delivered orders. Company receives 30% of the MLM price set for each product. 
                            If MLM price is ₹100, company earnings = ₹30.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MonthlyCompanyEarnings;