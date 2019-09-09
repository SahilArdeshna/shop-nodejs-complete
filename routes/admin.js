const express = require("express");
const { check, body } = require("express-validator");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  [
    check("title")
      .trim()
      .isString()
      .isLength({ min: 3 })
      .withMessage("Please add a title."),
    body("price")
      .isFloat()
      .withMessage("Please add price."),
    body("description")
      .trim()
      .isLength({ min: 5, max: 400 })
      .withMessage("Description must be long enough.")
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    check("title")
      .trim()
      .isString()
      .isLength({ min: 3 })
      .withMessage("Please add a title."),
    body("price")
      .isFloat()      
      .withMessage("Please add price."),
    body("description")
      .trim()
      .isLength({ min: 5, max: 400 })
      .withMessage("Description must be long enough.")
  ],
  isAuth,
  adminController.postEditProduct
);

router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;