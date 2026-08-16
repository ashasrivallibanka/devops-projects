import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) => console.error("Error fetching products:", error));
  }, []);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

const placeOrder = async () => {
  if (cart.length === 0) {
    alert("Your cart is empty");
    return;
  }

  const groupedCart = Object.values(
    cart.reduce((items, product) => {
      if (items[product.id]) {
        items[product.id].quantity += 1;
      } else {
        items[product.id] = {
          ...product,
          quantity: 1
        };
      }

      return items;
    }, {})
  );

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: groupedCart
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to place order");
    }

    alert(`Order placed successfully! Order ID: ${data.orderId}`);

    setCart([]);

  } catch (error) {
    console.error("Order error:", error);
    alert("Unable to place order");
  }
};

  return (
    <div className="app">
      <header>
        <h1>E-Commerce Store</h1>
        <p>Cart: {cart.length} item(s)</p>
      </header>

      <main>
        <h2>Products</h2>

        <div className="products">
          {products.map((product) => (
            <div className="product-card" key={product.id}>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <h4>₹{product.price}</h4>

              <button onClick={() => addToCart(product)}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>

        <section className="cart">
  <h2>Cart</h2>

  {cart.length === 0 ? (
    <p>Your cart is empty.</p>
  ) : (
    cart.map((item, index) => (
      <p key={`${item.id}-${index}`}>
        {item.name} - ₹{item.price}
      </p>
    ))
  )}

  {cart.length > 0 && (
    <button onClick={placeOrder}>
      Place Order
    </button>
  )}

</section>
      </main>
    </div>
  );
}

export default App;
