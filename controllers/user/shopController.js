const User = require("../../models/userSchema")
const Product  = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');



const loadshoppingPage = async (req,res)=>{
  try {
   

res.render("shop");

  } catch (error) {
    console.error("Shop error:", error);
    res.status(500).send("Server Error");
  }
}





const getBookDetails = async (req,res)=>{
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId).populate("category");

    if (!product) {
      return res.status(404).send("Book not found");
    }

   
    const relatedItems = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id }
    })
    .limit(4); 



const stockStatus = await Product.findById(productId).select('isBlocked quantity').populate('brand','isBlocked').populate('category','isListed')
// console.log('stock status',stockStatus)
let status = true;
 if((stockStatus.brand.isBlocked==true) || 
    stockStatus.category.isListed==false ||
    stockStatus.quantity <=0 ||
    stockStatus.isBlocked==true
){
  status = false;
}
// console.log('status is',status)
    const book = {
      _id: product._id,  
  title: product.productName,
  author: product.author,  
  pages: product.pages,
  language: product.language,
  published: product.createdAt ? product.createdAt.toDateString() : "N/A",
  isbn: product.isbn,
  price: product.salePrice,
  oldPrice: product.regularPrice,
  quantity:product.quantity,
 stock:status,     //prodcut status
  // Ratings reviews
  rating: product.rating,
  avgRating: product.avgRating,
  reviews: product.reviews,
  ratingBreakdown: product.ratingBreakdown,
  reviewsList: product.reviewsList,

  // Descriptions
  description: product.description,
  longDescription: product.longDescription,
  benefits: product.benefits,

  // Images
  coverImg: product.productImage?.[0] || "/images/no-image.png",
  thumbnails: product.productImage?.slice(1) || []
};


// console.log(book)




    
    const related = relatedItems.map(item => ({
      id: item._id,
      title: item.productName,
      price: item.salePrice || 0,
      oldPrice: item.regularPrice || 0,
      rating: item.rating || 4,
      coverImg: item.productImage?.[0] || "/images/no-image.png"
    }));



    res.render("bookDetails", {
      book,
      related,
      user: req.session.user || null,
      active: "books"
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}


const buildQueryFromReq = (queryParams) => {
  let { category, brand, price, sort, page = 1, limit = 9 } = queryParams;

  console.log(category, brand, price, sort, page, limit)

  page = Number(page) || 1;
  limit = Number(limit) || 9;
  const skip = (page - 1) * limit;

  let query = { isBlocked: false };

  if (category) {
    // category 
    query.category = { $in: category.split(",") };
  }

  if (brand) {
    query.brand = { $in: brand.split(",") };
  }

  if (price) {
    if (price === "under100") query.salePrice = { $lt: 100 };
    if (price === "100-250") query.salePrice = { $gte: 100, $lte: 250 };
    if (price === "250-500") query.salePrice = { $gte: 250, $lte: 500 };
    if (price === "above500") query.salePrice = { $gt: 500 };
  }

  let sortQuery = { createdAt: -1 };
  if (sort === "popularity") {
    sortQuery = { quantity: -1 };
  } else if (sort === "newest") {
    sortQuery = { createdAt: -1 };
  } else if (sort === "priceAsc") {
    sortQuery = { salePrice: 1 };
  } else if (sort === "priceDesc") {
    sortQuery = { salePrice: -1 };
  }

  return { query, sortQuery, page, limit, skip };
};

const apiGetProducts = async (req, res) => {
  try {
    
    const { query: q, sortQuery, page, limit, skip } = buildQueryFromReq(req.query);

    if (!req.query.category) {
      const allowedCategories = await Category.find({ isListed: true }).select("_id");
      q.category = { $in: allowedCategories.map(c => c._id) };
    }
    if (!req.query.brand) {
      const allowedBrands = await Brand.find({ isBlocked: false }).select("_id");
      q.brand = { $in: allowedBrands.map(b => b._id) };
    }

    const [products, totalProducts] = await Promise.all([
      Product.find(q)
        .populate("category", "name")
        .populate("brand", "brandName")
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(q)
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    
    const items = products.map(p => ({
      id: p._id,
      productName: p.productName,
      brandName: p.brand ? p.brand.brandName : null,
      salePrice: p.salePrice,
      regularPrice: p.regularPrice,
      productImage: (p.productImage && p.productImage.length) ? p.productImage : ["/images/no-image.png"],
      rating: p.avgRating || p.rating || 0,
      stock: p.quantity > 0
    }));

    return res.json({
      success: true,
      products: items,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit: limit
      }
    });

  } catch (error) {
    console.error("apiGetProducts error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


const apiGetCategories = async (req, res) => {
  try {
    
    const cats = await Category.find({ isListed: true }).sort({ name: 1 }).lean();
    const items = cats.map(c => ({ id: c._id, name: c.name }));
    return res.json({ success: true, categories: items });
  } catch (err) {
    console.error('apiGetCategories error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


const apiGetBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isBlocked: false }).sort({ brandName: 1 }).lean();
    const items = brands.map(b => ({ id: b._id, brandName: b.brandName }));
    return res.json({ success: true, brands: items });
  } catch (err) {
    console.error('apiGetBrands error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


module.exports = {
    loadshoppingPage,
    getBookDetails,
    apiGetProducts,
    apiGetBrands,
    apiGetCategories,
}