

const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema') 


const loadCategories= async (req, res) => {
  try {
   
    const categories = await Category.find({isListed:true}).limit(4);
    
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch popular categories' });
  }
};


const bestselling =  async (req, res) => {
  try {
    const allowedCategories = await Category.find({isListed:true})
    const allowedBrands = await Brand.find({isBlocked:false})
    const bestSelling = await Product.find({isBlocked:false,
        category:{$in:allowedCategories.map(a=>a._id)},
        brand:{$in:allowedBrands.map(a=>a._id)},
        quantity:{$gt:0}

    })
      .sort({ quantity: -1 })   
      .limit(4)
      .populate('brand','brandName')        
      .populate('category','name');     
    res.json(bestSelling);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch best selling products' });
  }
};


const latest = async (req, res) => {
  try {

    const allowedCategories = await Category.find({isListed:true})
    const allowedBrands = await Brand.find({isBlocked:false})
    const latest = await Product.find({isBlocked:false,
        category:{$in:allowedCategories.map(a=>a._id)},
        brand:{$in:allowedBrands.map(a=>a._id)},
        quantity:{$gt:0}
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('brand','brandName')
      .populate('category');
    res.json(latest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch latest products' });
  }
};

module.exports = {
    loadCategories,
    bestselling,
    latest,
}
