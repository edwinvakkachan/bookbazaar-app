const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
  productName: { type: String, required: true },
  description: { type: String, required: true },
  longDescription: { type: String, default: "No detailed description available." },

  brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
  author: { type: String, default: "Unknown Author" }, 

  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },

  regularPrice: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  productOffer: { type: Number, default: 0 },

  quantity: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Available', 'Out of Stock', 'Discontinued'],
    default: 'Available',
    required: true,
  },


  productImage: { type: [String], default: ["/images/no-image.png"] },

  
  pages: { type: Number, default: 0 },
  language: { type: String, default: "English" },
  isbn: { type: String, default: "N/A" },

  
  rating: { type: Number, default: 4.0 },
  avgRating: { type: Number, default: 4.8 },
  reviews: { type: Number, default: 0 },
  ratingBreakdown: {
    type: Map,
    of: Number,
    default: { 5: 70, 4: 15, 3: 10, 2: 3, 1: 2 }
  },
  reviewsList: {
    type: [
      {
        user: String,
        date: String,
        rating: Number,
        title: String,
        content: String,
      }
    ],
    default: [
      { user: "Nicolas Cage", date: "3 Days ago", rating: 5, title: "Great Product", content: "great product. very good quality" },
      { user: "Sr. Robert Downey", date: "3 Days ago", rating: 5, title: "The best product in Market", content: "great product. very good quality" }
    ]
  },

  
  benefits: {
    type: [String],
    default: [
      "Sustainable Change: Small, incremental adjustments to daily routines lead to lasting habits without overwhelming effort.",
      "Compounding Growth: Tiny changes accumulate over time, resulting in significant improvements.",
      "Improved Discipline: A system-focused approach enhances self-discipline."
    ]
  },

  
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
