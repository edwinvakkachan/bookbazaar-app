const mongoose = require('mongoose');
const {Schema} = mongoose;

const AddressSchema = new Schema({
  label: { type: String, default: 'Home' }, 
  name: { type: String, required: true },   
  line1: { type: String, required: true },  
  line2: { type: String, default: '' },    
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  country: { type: String, default: 'India' },
  phone: { type: String, default: '' },
  isPrimary: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });


const userSchema = new Schema({
    name: {
        type: String,
        required:true,
    },
    email:{
        type: String,
        required:true,
        unique:true,
    },
    phone:{
        type:Number,
        required:false,
        unique:true,
        sparse:true,
        default:null,
    },
    googleId:{
        type:String,
        unique:true,
        sparse: true,
    },
    password:{
        type:String,
        required:false,
    },
    dob: {
        type: Date,
        default: null
        },

    avatarUrl: {
        type: String,
        default: ''
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    isAdmin:{
        type:Boolean,
        default:false,
    },

    addresses: {
    type: [AddressSchema],
    default: [] 
  }

  
},{timestamps:true});





module.exports = mongoose.model('User', userSchema);