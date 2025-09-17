"use client";

import React, { useEffect, useState } from "react";
import CreateContext from "./createContext";
import { useSession } from "next-auth/react";
import axios from "axios";

function AppContextProvider({ children }) {
  const [productList, setProductList] = useState([]);
  const [addToCartList, setAddtoCartList] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [productFilters, setProductFilters] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    category: "",
    sortBy: "",
  });

  const { data: session, status } = useSession();
  const loggedInUserId = session?.user?.id;

  const fetchUserProductCartDetails = async () => {
    if (!loggedInUserId) return;
    
    setCartLoading(true);
    try {
      const { data } = await axios.get(`/api/cart/${loggedInUserId}`);
      setAddtoCartList(data.data);
    } catch (error) {
      console.log("Internal Server Error While Adding to cart", error);
      setAddtoCartList([]);
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && loggedInUserId) {
      fetchUserProductCartDetails();
    } else if (status === "unauthenticated") {
      // Only clear cart if user is actually unauthenticated, not during loading
      setAddtoCartList([]);
    }
    // Don't do anything during "loading" status to prevent clearing cart during page refresh
  }, [loggedInUserId, status]);

  return (
          <CreateContext.Provider
        value={{
          productList,
          setProductList,
          productFilters,
          setProductFilters,
          addToCartList,
          setAddtoCartList,
          fetchUserProductCartDetails,
          cartLoading,
        }}
      >
      {children}
    </CreateContext.Provider>
  );
}

export default AppContextProvider;
