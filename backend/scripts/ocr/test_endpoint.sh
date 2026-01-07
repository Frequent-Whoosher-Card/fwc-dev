#!/bin/bash
# Script untuk testing OCR KTP Endpoint

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN="${TOKEN:-}"
TEST_IMAGE="${1:-/Users/rama/projects/paddle_5/ktp.jpg}"

echo -e "${BLUE}=== Testing OCR KTP Endpoint ===${NC}\n"
echo -e "Base URL: ${YELLOW}$BASE_URL${NC}"
echo -e "Test Image: ${YELLOW}$TEST_IMAGE${NC}\n"

# Check if token is provided
if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ TOKEN environment variable is required${NC}"
    echo -e "Usage: ${YELLOW}TOKEN=your_token ./test_endpoint.sh [image_path]${NC}"
    exit 1
fi

# Check if test image exists
if [ ! -f "$TEST_IMAGE" ]; then
    echo -e "${RED}✗ Test image not found: $TEST_IMAGE${NC}"
    exit 1
fi

# Test 1: Check if endpoint is accessible
echo -e "${YELLOW}Test 1: Checking endpoint accessibility...${NC}"
if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" | grep -q "200\|404"; then
    echo -e "${RED}✗ Backend server is not accessible${NC}"
    echo -e "Make sure backend is running on $BASE_URL"
    exit 1
fi
echo -e "${GREEN}✓ Endpoint accessible${NC}\n"

# Test 2: Test OCR extraction
echo -e "${YELLOW}Test 2: Testing OCR extraction...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/members/ocr-extract" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@$TEST_IMAGE")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/members/ocr-extract" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@$TEST_IMAGE")

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}✗ Request failed with HTTP $HTTP_CODE${NC}"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

# Validate JSON
if ! echo "$RESPONSE" | python3 -m json.tool > /dev/null 2>&1; then
    echo -e "${RED}✗ Invalid JSON response${NC}"
    echo "$RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Request successful${NC}\n"

# Test 3: Validate response structure
echo -e "${YELLOW}Test 3: Validating response structure...${NC}"
SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))")

if [ "$SUCCESS" != "True" ]; then
    echo -e "${RED}✗ OCR extraction failed${NC}"
    echo "$RESPONSE" | python3 -m json.tool
    exit 1
fi

IDENTITY_NUMBER=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('identityNumber', ''))")
NAME=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('name', ''))")
GENDER=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('gender', ''))")
ALAMAT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('alamat', ''))")

FAILED=0
if [ -z "$IDENTITY_NUMBER" ]; then
    echo -e "${RED}✗ identityNumber is empty${NC}"
    FAILED=1
fi

if [ -z "$NAME" ]; then
    echo -e "${RED}✗ name is empty${NC}"
    FAILED=1
fi

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Response structure valid${NC}\n"
else
    echo -e "${RED}✗ Some required fields missing${NC}\n"
    exit 1
fi

# Test 4: Display extracted data
echo -e "${YELLOW}Test 4: Extracted Data:${NC}"
echo "$RESPONSE" | python3 -m json.tool | grep -A 15 '"data"'

# Test 5: Test error handling - missing file
echo -e "\n${YELLOW}Test 5: Testing error handling (missing file)...${NC}"
ERROR_RESPONSE=$(curl -s -X POST "$BASE_URL/members/ocr-extract" \
  -H "Authorization: Bearer $TOKEN")

ERROR_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/members/ocr-extract" \
  -H "Authorization: Bearer $TOKEN")

if [ "$ERROR_CODE" == "400" ]; then
    echo -e "${GREEN}✓ Error handling works (400 Bad Request)${NC}"
else
    echo -e "${YELLOW}⚠ Expected 400, got $ERROR_CODE${NC}"
fi

# Test 6: Test error handling - unauthorized
echo -e "\n${YELLOW}Test 6: Testing error handling (unauthorized)...${NC}"
UNAUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/members/ocr-extract" \
  -F "image=@$TEST_IMAGE")

UNAUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/members/ocr-extract" \
  -F "image=@$TEST_IMAGE")

if [ "$UNAUTH_CODE" == "401" ]; then
    echo -e "${GREEN}✓ Authentication check works (401 Unauthorized)${NC}"
else
    echo -e "${YELLOW}⚠ Expected 401, got $UNAUTH_CODE${NC}"
fi

echo -e "\n${GREEN}=== All Tests Completed! ===${NC}"

