
const express = require("express");
const router = express.Router();
const Product = require("../models/product");

//  CREATE 
router.post("/", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();

        res.status(201).json({
            message: "Product created successfully",
            product
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


//  GET ALL 
router.get("/", async (req, res) => {
    try {
        const { category, sort, page = 1, limit = 10 } = req.query;

        let filter = {};
        if (category) filter.category = category;

        let sortOption = {};
        if (sort) {
            sortOption.price = sort === "asc" ? 1 : -1;
        }

        const skip = (page - 1) * limit;

        const products = await Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit));

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// LOW STOCK ALERT REPORT
router.get("/reports/low-stock", async (req, res) => {
    try {
        const products = await Product.find({
            $expr: { $lte: ["$quantity", "$reorderLevel"] }
        });

        res.status(200).json({
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET BY ID
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ message: "Invalid Product ID" });
    }
});


//UPDATE
router.put("/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// DELETE 
router.delete("/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        res.status(400).json({ message: "Invalid Product ID" });
    }
});




// CATEGORY-WISE INVENTORY SUMMARY
router.get("/reports/category-summary", async (req, res) => {
    try {
        const summary = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    totalProducts: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" },
                    totalValue: {
                        $sum: { $multiply: ["$price", "$quantity"] }
                    }
                }
            }
        ]);

        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


//  STOCK ADJUSTMENT 
router.patch("/:id/stock", async (req, res) => {
    try {
        const { type, quantity } = req.body;

        if (!["restock", "sale"].includes(type) ||
            !Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                message: "Invalid stock adjustment"
            });
        }

        const update = type === "restock"
            ? { $inc: { quantity: quantity } }
            : {
                $inc: { quantity: -quantity },

            };

        const product = await Product.findOneAndUpdate(
            {
                _id: req.params.id,
                ...(type === "sale" ? { quantity: { $gte: quantity } } : {})
            },
            update,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found or insufficient stock"
            });
        }

        res.status(200).json({
            message: "Stock adjusted successfully",
            product
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
