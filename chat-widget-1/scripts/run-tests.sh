#!/bin/bash

echo "🧪 Running Chat Widget Test Suite"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_status "❌ Node.js is not installed. Please install Node.js first." $RED
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_status "❌ npm is not installed. Please install npm first." $RED
    exit 1
fi

print_status "📦 Installing dependencies..." $YELLOW
npm install

if [ $? -ne 0 ]; then
    print_status "❌ Failed to install dependencies" $RED
    exit 1
fi

print_status "🔧 Running linting..." $YELLOW
npm run lint

if [ $? -ne 0 ]; then
    print_status "⚠️  Linting issues found, but continuing with tests..." $YELLOW
fi

print_status "🧪 Running unit tests..." $YELLOW
npm run test:ci

if [ $? -ne 0 ]; then
    print_status "❌ Unit tests failed" $RED
    exit 1
fi

print_status "📊 Generating coverage report..." $YELLOW
npm run test:coverage

if [ $? -ne 0 ]; then
    print_status "⚠️  Coverage generation failed, but tests passed" $YELLOW
fi

print_status "✅ All tests completed successfully!" $GREEN
print_status "📋 Coverage report available in coverage/ directory" $GREEN
print_status "🌐 Open coverage/lcov-report/index.html to view detailed coverage" $GREEN

# Check coverage thresholds
if [ -f "coverage/coverage-summary.json" ]; then
    print_status "📈 Coverage Summary:" $YELLOW
    node -e "
        const coverage = require('./coverage/coverage-summary.json');
        const total = coverage.total;
        console.log('Lines: ' + total.lines.pct + '%');
        console.log('Functions: ' + total.functions.pct + '%');
        console.log('Branches: ' + total.branches.pct + '%');
        console.log('Statements: ' + total.statements.pct + '%');
    "
fi

print_status "🎉 Test suite execution completed!" $GREEN
