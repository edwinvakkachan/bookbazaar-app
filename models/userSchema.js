const mongoose = require('mongoose');
const {Schema} = mongoose;

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
    }
},{timestamps:true});
module.exports = mongoose.model('User', userSchema);