const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("E-Commerce Backend is running!");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend service is healthy"
  });
});

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Unable to fetch products"
    });
  }
});

app.post("/api/orders", async (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({
      error: "Cart is empty"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let totalAmount = 0;

    for (const item of items) {
      totalAmount += Number(item.price) * item.quantity;
    }

    const orderResult = await client.query(
      "INSERT INTO orders (total_amount) VALUES ($1) RETURNING id",
      [totalAmount]
    );

    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items
        (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order placed successfully",
      orderId,
      totalAmount
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Order error:", error);

    res.status(500).json({
      error: "Unable to place order"
    });

  } finally {
    client.release();
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on port ${PORT}`);
});
