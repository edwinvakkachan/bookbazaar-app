const loadHomepage = async (req,res)=>{
try {

return res.render('home')

    
} catch (error) {
    console.error('Home page rendering failed',error.message)
    res.status(500).send('server error')
}
}

module.exports = {
    loadHomepage
};