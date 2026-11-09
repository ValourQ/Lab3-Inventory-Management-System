
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

6
app.use(express.json());


const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);


app.get("/", (req, res) => {
    res.send("Inventory Management API is running");
});


mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");

        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB Connection Error:", err.message);
    });
