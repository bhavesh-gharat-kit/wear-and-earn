"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, X } from 'lucide-react';

export default function AddressForm({ onAddressUpdate, existingAddress, onCancel }) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    houseNumber: '',
    area: '',
    landmark: '',
    villageOrCity: '',
    taluka: '',
    district: '',
    pinCode: '',
    state: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingAddress) {
      setFormData({
        houseNumber: existingAddress.houseNumber || '',
        area: existingAddress.area || '',
        landmark: existingAddress.landmark || '',
        villageOrCity: existingAddress.villageOrCity || '',
        taluka: existingAddress.taluka || '',
        district: existingAddress.district || '',
        pinCode: existingAddress.pinCode?.toString() || '',
        state: existingAddress.state || ''
      });
    }
  }, [existingAddress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.area || !formData.villageOrCity || !formData.taluka || 
        !formData.district || !formData.pinCode || !formData.state) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!/^\d{6}$/.test(formData.pinCode)) {
      toast.error('Please enter a valid 6-digit PIN code');
      return;
    }

    setIsLoading(true);

    try {
      const addressData = {
        ...formData,
        pinCode: parseInt(formData.pinCode)
      };

      const response = await axios.post('/api/user/address', addressData);
      
      if (response.data.success) {
        toast.success(existingAddress ? 'Address updated successfully' : 'Address added successfully');
        onAddressUpdate(response.data.address);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error(error.response?.data?.message || 'Failed to save address');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {existingAddress ? 'Edit Address' : 'Add Delivery Address'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              House/Flat Number
            </label>
            <input
              type="text"
              id="houseNumber"
              name="houseNumber"
              value={formData.houseNumber}
              onChange={handleChange}
              placeholder="House/Flat/Block No."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Area/Sector/Locality *
            </label>
            <input
              type="text"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              required
              placeholder="Area, Sector, Locality"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Landmark
          </label>
          <input
            type="text"
            id="landmark"
            name="landmark"
            value={formData.landmark}
            onChange={handleChange}
            placeholder="Nearby landmark (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="villageOrCity" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Village/City *
            </label>
            <input
              type="text"
              id="villageOrCity"
              name="villageOrCity"
              value={formData.villageOrCity}
              onChange={handleChange}
              required
              placeholder="Village or City"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="taluka" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Taluka *
            </label>
            <input
              type="text"
              id="taluka"
              name="taluka"
              value={formData.taluka}
              onChange={handleChange}
              required
              placeholder="Taluka"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              District *
            </label>
            <input
              type="text"
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              required
              placeholder="District"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              State *
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              placeholder="State"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              PIN Code *
            </label>
            <input
              type="text"
              id="pinCode"
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              required
              maxLength="6"
              pattern="[0-9]{6}"
              placeholder="6-digit PIN"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Address'}
          </button>
        </div>
      </form>
    </div>
  );
}
