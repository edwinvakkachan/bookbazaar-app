const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const env = require('dotenv').config();
const db = require("./config/db")
const userRoute = require('./routes/userRoute')
db()

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{
        secure:false,
        httpOnly:true,
        sameSite: 'lax', 
        maxAge:1000*60*60
    }
}))
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});


app.set("view engine","ejs");
app.set("views",[path.join(__dirname,"views/user"),path.join(__dirname,'views/admin')])
app.use(express.static(path.join(__dirname, "public")))  // path corrected should check this



app.use('/',userRoute)





app.listen(process.env.PORT,()=>{
    console.log('server is running in the port 3000')
})

module.exports = app;