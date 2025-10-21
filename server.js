const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const session = require("express-session")
const flash = require("connect-flash")
const env = require("dotenv").config()
const app = express()

// Import middleware
const authMiddleware = require("./middleware/authMiddleware")

// Database initialization
const initializeDatabase = require("./database/databaseInit")

// Port configuration
const PORT = process.env.PORT || 5500

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'jaysam_enterprise_default_secret_2024',
    resave: false,
    saveUninitialized: false,
    name: "jaysam_session",
    cookie: {
      maxAge: 3600000, // 1 hour
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  })
)

// Flash messages
app.use(flash())

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))


// Template Engine
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout")

// Custom middleware
app.use(authMiddleware.addUserToLocals)

// Flash messages middleware
app.use((req, res, next) => {
  res.locals.messages = req.flash()
  next()
})

// Simple CSP Test Route
app.get("/test-csp", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CSP Test</title>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body { padding: 20px; }
        .icon-test { font-size: 2rem; margin: 10px; }
      </style>
    </head>
    <body>
      <h1>🔒 CSP Test Page</h1>
      <div class="alert alert-info">
        <h4>Testing External Resources</h4>
        <p>If you see icons and styled content below, CSP is working!</p>
      </div>
      
      <h3>Font Awesome Icons:</h3>
      <div>
        <i class="fas fa-camera icon-test text-primary"></i>
        <i class="fas fa-shopping-cart icon-test text-success"></i>
        <i class="fas fa-edit icon-test text-warning"></i>
        <i class="fas fa-box-open icon-test text-info"></i>
        <i class="fas fa-plus icon-test text-danger"></i>
      </div>
      
      <h3 class="mt-4">Bootstrap Styles:</h3>
      <button class="btn btn-primary">Primary Button</button>
      <button class="btn btn-success">Success Button</button>
      <button class="btn btn-warning">Warning Button</button>
      
      <h3 class="mt-4">Bootstrap JavaScript Test:</h3>
      <button class="btn btn-secondary" onclick="alert('JavaScript is working!')">
        Test JavaScript
      </button>

      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
      <script>
        console.log('✅ JavaScript is executing without CSP errors');
      </script>
    </body>
    </html>
  `)
})

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Initializing Jaysam Enterprise Database...')
    await initializeDatabase()
    console.log('✅ Database initialized successfully!')

    // Route definitions
    app.use("/", require("./routes/static"))
    app.use("/account", require("./routes/accountRoute"))
    app.use("/products", require("./routes/productRoute"))
    app.use("/customers", require("./routes/customerRoute"))
    app.use("/cart", require("./routes/cartRoute"))
    app.use("/orders", require("./routes/orderRoute"))

    // Error handler for 404
    app.use(async (req, res, next) => {
      next({ status: 404, message: "Sorry, we appear to have lost that page." })
    })

    // Global error handler
    app.use((error, req, res, next) => {
      console.error(`❌ Error at: "${req.originalUrl}": ${error.message}`);
      
      let status = error.status || 500;
      let message;
      
      if (status === 404) { 
        message = error.message || "Sorry, we appear to have lost that page.";
      } else {
        message = 'Oh no! There was a crash. Maybe try a different route?';
      }

      res.status(status).render("errors/error", {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        message: message,
        status: status,
        error: process.env.NODE_ENV === 'development' ? error : null
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🎉 Jaysam Enterprise Server Started Successfully!`)
      console.log(`=========================================`)
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🌐 Local: http://localhost:${PORT}`)
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`📊 Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}`)
      console.log(`🔒 CSP Test: http://localhost:${PORT}/test-csp`)
      console.log(`📦 Products: http://localhost:${PORT}/products`)
      console.log(`=========================================\n`)
    })

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the application
startServer()