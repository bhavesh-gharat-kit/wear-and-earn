import axios from "axios";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordUpdateSetting = () => {
  const { data } = useSession();
  const userId = data?.user?.id;

  // State for password visibility toggle
  const [isPasswordVisible, setIsPasswordVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm();

  // Handle password visibility toggle
  const togglePasswordVisibility = (field) => {
    setIsPasswordVisible({
      ...isPasswordVisible,
      [field]: !isPasswordVisible[field],
    });
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        userId: userId,
      };

      const response = await axios.put(
        "/api/account/settings/password",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if(response.status ===200){
        toast.success("password updated sucessfully")
        reset()
      }
    } catch (error) {
      if(error.status === 409){
        toast.error("Your current password is not correct")
        return
      }
      console.log("Internal Server Error While Updting the Password" ,error);
      toast.error("Internal Server Error While Updting the Password");
    }
  };

  return (
    <div
      className="settings-section aos-init aos-animate"
      data-aos="fade-up"
      data-aos-delay="200"
    >
      <h3 className="text-xl font-semibold mb-4">Security</h3>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="settings-form space-y-6"
      >
        <input type="hidden" name="action" value="update-password" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Password */}
          <div className="col-span-1">
            <label
              htmlFor="currentPassword"
              className="form-label block text-sm font-medium text-gray-700"
            >
              Current Password
            </label>
            <div className="relative mt-2">
              <input
                type={isPasswordVisible.currentPassword ? "text" : "password"}
                className="form-control p-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                id="currentPassword"
                name="currentPassword"
                {...register("currentPassword", {
                  required: "Current password is required",
                })}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("currentPassword")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {isPasswordVisible.currentPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.currentPassword && (
              <span className="text-red-500">
                {errors.currentPassword.message}
              </span>
            )}
          </div>

          {/* New Password */}
          <div className="col-span-1">
            <label
              htmlFor="newPassword"
              className="form-label block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <div className="relative mt-2">
              <input
                type={isPasswordVisible.newPassword ? "text" : "password"}
                className="form-control p-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                id="newPassword"
                name="newPassword"
                {...register("newPassword", {
                  required: "New password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters long",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("newPassword")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {isPasswordVisible.newPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.newPassword && (
              <span className="text-red-500">{errors.newPassword.message}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="col-span-1">
            <label
              htmlFor="confirmPassword"
              className="form-label block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <div className="relative mt-2">
              <input
                type={isPasswordVisible.confirmPassword ? "text" : "password"}
                className="form-control p-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                id="confirmPassword"
                name="confirmPassword"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === getValues("newPassword") ||
                    "Passwords must match",
                })}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirmPassword")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {isPasswordVisible.confirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-red-500">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>
        </div>

        {/* Form Buttons */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="btn-save bg-blue-600 text-white py-2 px-6 rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordUpdateSetting;
