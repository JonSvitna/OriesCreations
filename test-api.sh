#!/bin/bash

echo "🧪 Testing OriesCreations Backend API with SQLite"
echo "=================================================="
echo ""

BASE_URL="http://localhost:3000"

# Test 1: Health Check
echo "1. Health Check:"
curl -s "$BASE_URL/api/health" | jq '.'
echo ""

# Test 2: Get Products
echo "2. Get Products (first 3):"
curl -s "$BASE_URL/api/products?limit=3" | jq '.products[] | {name, price, category}'
echo ""

# Test 3: Get Product by ID
echo "3. Get Product by ID (product 1):"
curl -s "$BASE_URL/api/products/1" | jq '{name, price, description}'
echo ""

# Test 4: Register New User
echo "4. Register New User:"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }')
echo "$REGISTER_RESPONSE" | jq '{message, user: .user, token: (.token[:20] + "...")}'
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
echo ""

# Test 5: Login
echo "5. Login with Demo User:"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "user1234"
  }')
echo "$LOGIN_RESPONSE" | jq '{message, user: .user, token: (.token[:20] + "...")}'
DEMO_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo ""

# Test 6: Get User Profile
echo "6. Get User Profile (authenticated):"
curl -s "$BASE_URL/api/auth/profile" \
  -H "Authorization: Bearer $DEMO_TOKEN" | jq '.'
echo ""

# Test 7: Add to Cart
echo "7. Add Product to Cart:"
curl -s -X POST "$BASE_URL/api/cart/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -d '{
    "product_id": 1,
    "quantity": 2
  }' | jq '.'
echo ""

# Test 8: Get Cart
echo "8. Get Cart Contents:"
curl -s "$BASE_URL/api/cart" \
  -H "Authorization: Bearer $DEMO_TOKEN" | jq '{itemCount, total, items: .items[] | {name, quantity, subtotal}}'
echo ""

echo "✅ API Testing Complete!"
echo ""
echo "Test Accounts Available:"
echo "  Admin: admin@oriescreations.com / admin123"
echo "  User: demo@example.com / user1234"
echo "  Creator: creator@oriescreations.com / creator123"
