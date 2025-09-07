"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCartArrowDown } from "react-icons/fa";

function ProduceLeftMenus() {

  const [productCategory, setProductCategory] = useState([]);

  const fetchAllCategoryList = async () => {
    try {
      const response = await axios.get("/api/category");
      const data = response.data.data;
      setProductCategory(data);
    } catch (error) {
      console.log("Internal Server Error While Fetching the Category", error);
      toast.error("Internal Server Error While Fetching the Category");
    }
  };

  useEffect(() => {
    fetchAllCategoryList();
  }, []);

  return (
    <div className="shadow-lg max-w-72 min-w-64 p-4 space-y-2.5 flex flex-col max-sm:grow max-sm:max-w-full max-md:min-w-full ">
      <Link
        href={"/cart"}
        className="btn btn-primary text-xl rounded w-fit"
      >
        Cart
        <i>
          <FaCartArrowDown />
        </i>
      </Link>
      <h1 className="text-2xl text-amber-600 font-semibold">Categories</h1>

      <div>
        <ul className="flex gap-4 flex-col justify-center items-center">
          {productCategory.map((product) => {
            return (
              <>
                <li
                  key={product.id}
                  className="border-b-slate-200 border-b w-full py-2"
                >
                  <button className="flex justify-between items-center grow gap-3">
                    <span>
                      <Image
                        width={200}
                        height={200}
                        className="h-12 w-12 object-fill rounded"
                        src={product.products[0]?.images && product.products[0].images.length > 0 ? product.products[0].images[0].imageUrl : "/images/brand-logo.png"}
                        alt={product.name}
                      />
                    </span>
                    <span className="  font-medium">{product.name}</span>
                  </button>
                </li>
              </>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default ProduceLeftMenus;
