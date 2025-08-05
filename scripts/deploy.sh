#!/bin/bash

# Staff Pulse Deployment Script
# This script prepares and builds the project for deployment

set -e  # Exit on any error

echo "🚀 Starting Staff Pulse deployment preparation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version check passed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_success "npm version: $(npm --version)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Make sure to set environment variables in your deployment platform."
    print_status "You can copy .env.example to .env and fill in your values for local development."
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci --silent

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Run linting
print_status "Running linting checks..."
npm run lint

if [ $? -eq 0 ]; then
    print_success "Linting passed"
else
    print_warning "Linting issues found. Run 'npm run lint:fix' to auto-fix some issues."
fi

# Clean previous build
print_status "Cleaning previous build..."
npm run clean

# Build the project
print_status "Building the project..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully!"
else
    print_error "Build failed"
    exit 1
fi

# Check if dist folder was created
if [ ! -d "dist" ]; then
    print_error "Build output directory 'dist' not found"
    exit 1
fi

# Display build info
BUILD_SIZE=$(du -sh dist | cut -f1)
print_success "Build size: $BUILD_SIZE"

# List important files
print_status "Build output files:"
ls -la dist/

echo ""
print_success "🎉 Deployment preparation complete!"
echo ""
print_status "Next steps:"
echo "  1. Upload the 'dist' folder to your hosting provider"
echo "  2. Set environment variables in your hosting dashboard"
echo "  3. Configure your domain and SSL certificate"
echo ""
print_status "For Netlify deployment:"
echo "  1. Connect your repository to Netlify"
echo "  2. Set build command: npm run build"
echo "  3. Set publish directory: dist"
echo "  4. Add environment variables in Netlify dashboard"
echo ""
print_success "Happy deploying! 🚀"
