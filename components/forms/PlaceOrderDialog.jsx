import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import LoaderEffect from "../ui/LoaderEffect";
import Image from "next/image";
import toast from "react-hot-toast";
import { FaEdit } from "react-icons/fa";
import Link from "next/link";
import CreateContext from "../context/createContext";

export default function PlaceOrderDialog({
  isOpen,
  onClose,
  productId = null,
  totalAmount = 0,
  addToCartList = null,
  type = "single" // "single" for single product, "cart" for cart items
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    houseNo: "",
    area: "",
    landmark: "",
    villageCity: "",
    taluka: "",
    district: "",
    state: "",
  });

  const [userAddressDetails, setUserAddressDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();
  const { fetchUserProductCartDetails } = useContext(CreateContext);
  const userId = session?.user?.id;

  // Fetch user address details for cart type
  const fetchUserAddressDetails = async () => {
    if (type !== "cart" || !userId) return;
    
    try {
      const response = await axios.get(`/api/account/settings/address/${userId}`);
      const address = response.data.address;
      
      if (!address || address.area.length <= 0) {
        return toast.error("Please Update Address in Your Account Settings");
      }
      setUserAddressDetails(address);
    } catch (error) {
      console.log("Internal Server Error While Fetching the user address", error);
      toast.error("Please add your address in account settings");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserAddressDetails();
    }
  }, [userId, isOpen, type]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        userId,
        productId: type === "single" ? productId : null,
        cartItems: type === "cart" ? addToCartList : null,
        totalAmount,
        shippingAddress: type === "single" ? formData : userAddressDetails,
      };

      const response = await axios.post("/api/orders", orderData);
      
      if (response.status === 200) {
        toast.success("Order placed successfully!");
        
        // Refresh cart data if it was a cart order
        if (type === "cart" && fetchUserProductCartDetails) {
          await fetchUserProductCartDetails();
        }
        
        onClose();
        
        // Reset form
        setFormData({
          fullName: "",
          mobileNumber: "",
          houseNo: "",
          area: "",
          landmark: "",
          villageCity: "",
          taluka: "",
          district: "",
          state: "",
        });

        // Redirect to orders page after a short delay
        setTimeout(() => {
          window.location.href = '/account/orders';
        }, 2000);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || "Access denied");
      } else {
        toast.error(error.response?.data?.message || "Failed to place order. Please try again.");
      }
      console.error("Order placement error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Show loader for cart type when fetching address
  if (type === "cart" && userAddressDetails === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <LoaderEffect />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {type === "cart" ? "Complete Your Order" : "Place Order"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Order Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            {type === "cart" && addToCartList ? (
              <div className="space-y-2">
                {addToCartList.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.product?.title}</span>
                    <span className="text-sm font-medium">
                      ₹{item.product?.sellingPrice} × {item.quantity}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 font-bold">
                  Total: ₹{totalAmount}
                </div>
              </div>
            ) : (
              <div className="text-lg font-semibold">
                Total Amount: ₹{totalAmount}
              </div>
            )}
          </div>

          {/* Address Section */}
          {type === "cart" && userAddressDetails ? (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Shipping Address</h3>
                <Link
                  href="/account"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <FaEdit /> Edit Address
                </Link>
              </div>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p>{userAddressDetails.houseNumber}, {userAddressDetails.area}</p>
                <p>{userAddressDetails.landmark}</p>
                <p>
                  {userAddressDetails.villageOrCity}, {userAddressDetails.taluka}
                </p>
                <p>
                  {userAddressDetails.district}, {userAddressDetails.pinCode}
                </p>
              </div>
            </div>
          ) : type === "single" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-semibold mb-4">Shipping Address</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  name="mobileNumber"
                  placeholder="Mobile Number"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="houseNo"
                  placeholder="House/Flat No."
                  value={formData.houseNo}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="area"
                  placeholder="Area/Locality"
                  value={formData.area}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <input
                type="text"
                name="landmark"
                placeholder="Landmark (Optional)"
                value={formData.landmark}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="villageCity"
                  placeholder="Village/City"
                  value={formData.villageCity}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="taluka"
                  placeholder="Taluka"
                  value={formData.taluka}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="district"
                  placeholder="District"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </form>
          ) : null}

          {/* Place Order Button for Cart Type */}
          {type === "cart" && userAddressDetails && (
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
