const express = require('express');
const app = express();
const path = require('path');
const env = require('dotenv').config();
const db = require("./config/db")
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')
db()
const sessionMiddleware = require('./middlewares/session');
const passportMiddlewares = require('./middlewares/passport');
const localsMiddleware = require('./middlewares/locals');
const cacheControlMiddleware = require('./middlewares/cacheControl');




app.use(sessionMiddleware);
app.use(passportMiddlewares);
app.use(localsMiddleware);
app.use(cacheControlMiddleware);


app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.set("view engine","ejs");
app.set("views",[path.join(__dirname,"views/user"),path.join(__dirname,'views/admin')])
app.use(express.static(path.join(__dirname, "public")))  



app.use('/',userRoute)
app.use('/admin',adminRoute)





app.listen(process.env.PORT,()=>{
    console.log(`server is running in the port ${process.env.PORT}`)
})

module.exports = app;