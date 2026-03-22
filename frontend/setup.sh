#!/bin/bash

# AURA Preprocessor Frontend Setup Script

echo "=================================="
echo "AURA Preprocessor Frontend Setup"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the frontend/ directory"
    exit 1
fi

echo "📦 Installing npm dependencies..."
echo ""

# Install dependencies
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
else
    echo ""
    echo "❌ Failed to install dependencies"
    echo "Please check for errors above"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
else
    echo "ℹ️  .env file already exists"
    echo ""
fi

echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Review the documentation:"
echo "   - README.md (Frontend guide)"
echo "   - BACKEND_CONNECTION_GUIDE.md (Backend setup)"
echo "   - TODO.md (Component checklist)"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open your browser:"
echo "   http://localhost:3000"
echo ""
echo "⚠️  Note: You'll need the backend running on port 8000"
echo ""
echo "=================================="
