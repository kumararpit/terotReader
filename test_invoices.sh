#!/bin/bash

# API URL
API_URL="http://localhost:8000/api"
EMAIL="arpitkumar1101@gmail.com"

# Function to test a service
test_service() {
    SERVICE_TYPE=$1
    SERVICE_NAME=$2
    AMOUNT=$3
    BOOKING_DATA=$4

    echo "---------------------------------------------------"
    echo "Testing Service: $SERVICE_NAME ($SERVICE_TYPE)"
    
    # 1. Create Booking
    echo "Creating Booking..."
    RESPONSE=$(curl -s -X POST "$API_URL/bookings/create" \
      -H "Content-Type: application/json" \
      -d "$BOOKING_DATA")
    
    echo "Response: $RESPONSE"
    
    # Extract Booking ID (Simple grep as jq might not be installed, but python one-liner is safer)
    BOOKING_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('booking_id'))")
    
    if [ "$BOOKING_ID" == "None" ] || [ -z "$BOOKING_ID" ]; then
        echo "Failed to create booking."
        return
    fi
    
    echo "Booking ID: $BOOKING_ID"
    
    # 2. Verify Payment (Trigger Email)
    # Using a dummy payment ID containing 'demo' to bypass real PayPal check if supported by backend
    PAYMENT_ID="PAY-DEMO-$BOOKING_ID"
    
    echo "Verifying Payment to trigger email..."
    VERIFY_DATA="{\"booking_id\": \"$BOOKING_ID\", \"payment_id\": \"$PAYMENT_ID\", \"payer_id\": \"DEMO_PAYER\", \"payment_method\": \"paypal\"}"
    
    VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/bookings/verify-payment" \
      -H "Content-Type: application/json" \
      -d "$VERIFY_DATA")
      
    echo "Verify Response: $VERIFY_RESPONSE"
    echo "Check email ($EMAIL) for Invoice PDF."
    sleep 2
}

# 1. Delivered Reading (3 Questions)
JSON_1=$(cat <<EOF
{
  "full_name": "Arpit Test 3Q",
  "email": "$EMAIL",
  "service_type": "delivered-3",
  "payment_method": "paypal",
  "questions": "Q1: Career? Q2: Love? Q3: Health?",
  "situation_description": "Testing invoice for 3 questions.",
  "gender": "Male",
  "date_of_birth": "1990-01-01",
  "preferred_date": "2026-02-10"
}
EOF
)
test_service "delivered-3" "Delivered Reading (3 Questions)" "22" "$JSON_1"

# 2. Delivered Reading (5 Questions)
JSON_2=$(cat <<EOF
{
  "full_name": "Arpit Test 5Q",
  "email": "$EMAIL",
  "service_type": "delivered-5",
  "payment_method": "paypal",
  "questions": "Q1..Q5",
  "situation_description": "Testing invoice for 5 questions.",
  "gender": "Female",
  "date_of_birth": "1995-05-05",
  "preferred_date": "2026-02-11"
}
EOF
)
test_service "delivered-5" "Delivered Reading (5 Questions)" "33" "$JSON_2"

# 3. Live Reading (20 Mins)
JSON_3=$(cat <<EOF
{
  "full_name": "Arpit Test Live 20",
  "email": "$EMAIL",
  "service_type": "live-20",
  "payment_method": "paypal",
  "situation_description": "Live session request.",
  "gender": "Other",
  "date_of_birth": "2000-01-01",
  "preferred_date": "2026-02-12",
  "preferred_time": "14:00"
}
EOF
)
test_service "live-20" "Live Reading (20 Mins)" "66" "$JSON_3"

# 4. Live Reading (40 Mins)
JSON_4=$(cat <<EOF
{
  "full_name": "Arpit Test Live 40",
  "email": "$EMAIL",
  "service_type": "live-40",
  "payment_method": "paypal",
  "situation_description": "Long live session.",
  "gender": "Male",
  "date_of_birth": "1985-08-08",
  "preferred_date": "2026-02-13",
  "preferred_time": "10:00"
}
EOF
)
test_service "live-40" "Live Reading (40 Mins)" "129" "$JSON_4"

# 5. Aura Scanning (Image)
# Note: Simulating image upload is hard with simple JSON curl. 
# We'll send a dummy base64 string or URL if allowed by backend validation.
# Assuming backend accepts a URL or we just skip the image for this curl test unless we use multipart/form-data.
# The server endpoint 'create_booking' expects JSON (BookingCreate). 
# Aura image is likely a base64 string in the JSON if 'aura_image' field exists.
JSON_5=$(cat <<EOF
{
  "full_name": "Arpit Aura Test",
  "email": "$EMAIL",
  "service_type": "aura",
  "payment_method": "paypal",
  "situation_description": "Aura scan test.",
  "gender": "Female",
  "date_of_birth": "1999-09-09",
  "preferred_date": "2026-02-14",
  "aura_image": "https://via.placeholder.com/150"
}
EOF
)
test_service "aura" "Aura Scanning" "15" "$JSON_5"

echo "Done."
