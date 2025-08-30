import React from "react";

function AccountCart() {
  return (
    <div className="bg-base-100 rounded-box shadow p-6">
      <section id="cart">
        <h2 className="text-2xl font-bold mb-4">My Cart</h2>

        {/* Cart Total + Order Button */}
        <div className="flex flex-wrap justify-between items-center mb-4">
          <div className="text-lg font-semibold text-primary">
            Total: ₹12,255.00
          </div>
          <button className="btn btn-success">Place Order</button>
        </div>

        {/* Cart Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Card 1 */}
          <div className="card bg-base-100 shadow-md">
            <figure>
              <img
                src="https://wearearn.kumarinfotech.net/uploads/products/img_68775741612128.57042302.jpg"
                alt="Product 1"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">Pastel Botanical Breeze Cordset</h2>
              <p>₹1,615.00</p>
              <p className="text-success font-bold">₹11,305.00</p>
              <div className="flex items-center gap-2">
                <label>Qty:</label>
                <input
                  type="number"
                  className="input input-bordered w-20"
                  defaultValue={7}
                  min={1}
                />
              </div>
              <button className="btn btn-outline btn-error mt-3">Remove</button>
            </div>
          </div>

          {/* Product Card 2 */}
          <div className="card bg-base-100 shadow-md">
            <figure>
              <img
                src="https://wearearn.kumarinfotech.net/uploads/products/img_687755f3562541.40372571.jpg"
                alt="Product 2"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">Palm Breeze Cotton Cordset</h2>
              <p>₹950.00</p>
              <p className="text-success font-bold">₹950.00</p>
              <div className="flex items-center gap-2">
                <label>Qty:</label>
                <input
                  type="number"
                  className="input input-bordered w-20"
                  defaultValue={1}
                  min={1}
                />
              </div>
              <button className="btn btn-outline btn-error mt-3">Remove</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AccountCart;
