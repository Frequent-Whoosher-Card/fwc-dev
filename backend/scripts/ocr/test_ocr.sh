#!/bin/bash
# Script untuk testing OCR KTP

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_IMAGE="${1:-/Users/rama/projects/paddle_5/ktp.jpg}"

echo -e "${YELLOW}=== Testing OCR KTP Script ===${NC}\n"

# Test 1: Check if Python script exists
echo -e "${YELLOW}Test 1: Checking Python script...${NC}"
if [ ! -f "$SCRIPT_DIR/ktp_extract.py" ]; then
    echo -e "${RED}✗ ktp_extract.py not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Script found${NC}\n"

# Test 2: Check if test image exists
echo -e "${YELLOW}Test 2: Checking test image...${NC}"
if [ ! -f "$TEST_IMAGE" ]; then
    echo -e "${RED}✗ Test image not found: $TEST_IMAGE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Test image found${NC}\n"

# Test 3: Run OCR script
echo -e "${YELLOW}Test 3: Running OCR extraction...${NC}"
cd "$SCRIPT_DIR"
OUTPUT=$(python3 ktp_extract.py "$TEST_IMAGE" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${RED}✗ OCR script failed${NC}"
    echo "$OUTPUT"
    exit 1
fi

# Extract JSON from output (last line should be JSON)
JSON_OUTPUT=$(echo "$OUTPUT" | tail -1)

# Test 4: Validate JSON output
echo -e "${YELLOW}Test 4: Validating JSON output...${NC}"
if ! echo "$JSON_OUTPUT" | python3 -m json.tool > /dev/null 2>&1; then
    echo -e "${RED}✗ Invalid JSON output${NC}"
    echo "$JSON_OUTPUT"
    exit 1
fi
echo -e "${GREEN}✓ Valid JSON${NC}\n"

# Test 5: Check required fields
echo -e "${YELLOW}Test 5: Checking required fields...${NC}"
SUCCESS=$(echo "$JSON_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))")

if [ "$SUCCESS" != "True" ]; then
    echo -e "${RED}✗ OCR extraction failed${NC}"
    echo "$JSON_OUTPUT" | python3 -m json.tool
    exit 1
fi

IDENTITY_NUMBER=$(echo "$JSON_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('identityNumber', ''))")
NAME=$(echo "$JSON_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('name', ''))")
GENDER=$(echo "$JSON_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('gender', ''))")
ALAMAT=$(echo "$JSON_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('alamat', ''))")

if [ -z "$IDENTITY_NUMBER" ]; then
    echo -e "${RED}✗ identityNumber is empty${NC}"
    FAILED=1
fi

if [ -z "$NAME" ]; then
    echo -e "${RED}✗ name is empty${NC}"
    FAILED=1
fi

if [ -z "$GENDER" ]; then
    echo -e "${YELLOW}⚠ gender is empty (optional)${NC}"
fi

if [ -z "$ALAMAT" ]; then
    echo -e "${YELLOW}⚠ alamat is empty (optional)${NC}"
fi

if [ -z "$FAILED" ]; then
    echo -e "${GREEN}✓ Required fields present${NC}\n"
else
    echo -e "${RED}✗ Some required fields missing${NC}\n"
    exit 1
fi

# Test 6: Display extracted data
echo -e "${YELLOW}Test 6: Extracted Data:${NC}"
echo "$JSON_OUTPUT" | python3 -m json.tool | grep -A 20 '"data"'

echo -e "\n${GREEN}=== All Tests Passed! ===${NC}"

