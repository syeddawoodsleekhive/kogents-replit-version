#!/bin/bash

echo "🧪 Running Chat Widget Test Suite"
echo "=================================="

echo "📦 Installing dependencies..."
npm install

echo "🔧 Running linting..."
npm run lint

echo "🧪 Running unit tests..."
npm run test:ci

echo "📊 Generating coverage report..."
npm run test:coverage

echo "✅ All tests completed!"
echo "📋 Coverage report available in coverage/ directory"
