# Receipt Scanning Feature - Implementation Plan

## Overview
Add receipt scanning functionality that captures a photo, extracts expense data (amount, date, merchant, category), and pre-fills a form for user confirmation/editing.

## Technology Stack Options - Complete Comparison

### Option 1: Specialized Receipt OCR Services (Best for Receipts)
**Pros:** Highest accuracy for receipts, structured data extraction, merchant recognition
**Cons:** More expensive, specialized use case

**Services:**
1. **Taggun** ⭐ BEST OVERALL
   - Specialized for receipts/invoices
   - 85+ languages support
   - High accuracy, structured JSON output
   - Pricing: ~$0.10-0.20 per receipt (check current pricing)
   - Free tier available for testing

2. **Tabscanner**
   - 99% accuracy claim
   - Detailed line-item extraction
   - Global language support
   - Pricing: Contact for pricing

3. **Veryfi**
   - Specialized receipt OCR
   - High accuracy
   - Pricing: ~$0.10-0.50 per receipt

4. **DocuClipper**
   - 97% accuracy
   - Fast processing
   - Pricing: Contact for pricing

5. **Smartbills**
   - Multi-language, multi-currency
   - Detailed extraction
   - Pricing: Contact for pricing

6. **Cloudmersive**
   - Real-time extraction
   - 20+ languages
   - Pricing: Contact for pricing

### Option 2: General Cloud OCR Services (Cheaper)
**Pros:** Lower cost, good for basic OCR
**Cons:** Less specialized, may need custom parsing

**Services:**
1. **Google Cloud Vision API** ⭐ BEST VALUE
   - General OCR, good accuracy
   - Pricing: $1.50 per 1000 images = **$0.15 per 100 receipts**
   - Free tier: 1000 requests/month
   - Easy integration

2. **AWS Textract**
   - Document analysis
   - Pricing: ~$1.50 per 1000 pages
   - Free tier: 1000 pages/month

3. **Azure Form Recognizer**
   - Specialized for forms/receipts
   - Pricing: ~$1.50 per 1000 pages
   - Free tier: 500 pages/month

4. **Microsoft Computer Vision API**
   - General OCR
   - Pricing: Contact for pricing

### Option 3: AI-Powered Vision Models (Most Flexible)
**Pros:** Can extract structured data, understand context, suggest categories
**Cons:** More expensive, may be overkill

**Services:**
1. **OpenAI GPT-4 Turbo / GPT-4o**
   - Built-in vision capabilities
   - Can extract structured data + understand context
   - Pricing: ~$0.00765 per image (1080x1080) = **$0.77 per 100 receipts**
   - Best for: Smart extraction + category suggestions

2. **Anthropic Claude (with vision)**
   - Similar to GPT-4
   - Pricing: Check current rates

### Option 4: On-Device OCR (Free but Lower Accuracy)
**Pros:** Free, privacy, works offline
**Cons:** Lower accuracy, larger app size, needs custom parsing

**Libraries:**
1. **Tesseract.js** - Free, open-source, ~60-70% accuracy
2. **ML Kit Text Recognition** (Google) - Free, ~80-85% accuracy
3. **Vision Framework** (iOS) / **ML Kit** (Android) - Free, native

### Option 3: Hybrid Approach (Recommended)
- Use on-device for basic text extraction
- Use cloud API for structured data extraction
- Fallback to manual entry if both fail

## Recommended Architecture

### Frontend Components

1. **ReceiptCameraScreen.js**
   - Camera view (using `expo-camera` or `react-native-vision-camera`)
   - Capture button
   - Photo preview
   - Retake option
   - Process button

2. **ReceiptReviewScreen.js**
   - Display captured image
   - Show extracted data in editable form
   - Fields: Amount, Date, Merchant/Description, Category
   - Confidence indicators
   - Save/Edit buttons

3. **ReceiptProcessingService.js**
   - Handles image upload to backend
   - Receives extracted data
   - Error handling

### Backend Components

1. **New Endpoint: `POST /receipts/scan`**
   - Accepts image file (base64 or multipart/form-data)
   - Calls OCR service
   - Extracts structured data
   - Returns: `{ amount, date, merchant, category, confidence, raw_text }`

2. **OCR Service Integration**
   - Choose one OCR service (or multiple with fallback)
   - Parse response into structured format
   - Handle errors gracefully

## Implementation Steps

### Phase 1: Basic Camera Integration
1. Install dependencies:
   ```bash
   npm install expo-camera expo-image-picker
   # or
   npm install react-native-vision-camera react-native-image-picker
   ```

2. Create `ReceiptCameraScreen.js`
   - Request camera permissions
   - Display camera view
   - Capture photo
   - Show preview
   - Navigate to review screen with image

### Phase 2: Backend OCR Integration
1. Choose OCR service (recommend starting with OpenAI GPT-4 Vision or Veryfi)
2. Create `/receipts/scan` endpoint in `backend/main.py`
3. Add image upload handling (FastAPI `File` upload)
4. Integrate OCR API
5. Parse and return structured data

### Phase 3: Data Extraction & Parsing
1. Extract amount (currency, numbers)
2. Extract date (various formats)
3. Extract merchant/store name
4. Suggest category based on merchant/keywords
5. Calculate confidence scores

### Phase 4: Review & Confirmation UI
1. Create `ReceiptReviewScreen.js`
2. Display captured image
3. Show extracted data in form fields
4. Allow editing all fields
5. Highlight low-confidence fields
6. Save to expense/income

### Phase 5: Integration with Existing Forms
1. Add "Scan Receipt" button to `AddExpenseScreen.js`
2. Navigate to camera → review → back to form with pre-filled data
3. User can edit before submitting

## Detailed Implementation

### 1. Camera Screen (`ReceiptCameraScreen.js`)

```javascript
import { Camera } from 'expo-camera';
import { useState, useEffect } from 'react';

export default function ReceiptCameraScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      setCapturedImage(photo.uri);
    }
  };

  const processReceipt = () => {
    navigation.navigate('ReceiptReview', { imageUri: capturedImage });
  };

  // ... render camera view
}
```

### 2. Backend OCR Endpoint

```python
from fastapi import File, UploadFile
import base64
import requests

@app.post("/receipts/scan")
async def scan_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Scan receipt image and extract expense data"""
    
    # Read image
    image_data = await file.read()
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    
    # Call OCR service (example with OpenAI)
    ocr_result = await call_ocr_service(image_base64)
    
    # Parse and extract structured data
    extracted_data = parse_receipt_data(ocr_result)
    
    return {
        "amount": extracted_data.get("amount"),
        "date": extracted_data.get("date"),
        "merchant": extracted_data.get("merchant"),
        "category": extracted_data.get("category_suggestion"),
        "confidence": extracted_data.get("confidence"),
        "raw_text": ocr_result.get("text")
    }
```

### 3. OCR Service Integration Options

#### Option A: OpenAI GPT-4 Turbo (Recommended for Context + Category Matching)
```python
from openai import OpenAI
import json

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Your app's category list (from frontend)
CATEGORIES = [
    "Groceries", "Utilities", "Transportation", "Housing",
    "Healthcare", "Education", "Entertainment", "Dining Out",
    "Clothing", "Personal Care", "Gifts & Donations", "Travel",
    "Loans & Debt Payments", "Bank Fees", "Insurance", "Taxes", "Other"
]

async def call_ocr_service(image_base64, categories=None):
    categories = categories or CATEGORIES
    
    prompt = f"""Extract expense data from this receipt image and return JSON with:
- amount: numeric value only (float)
- date: YYYY-MM-DD format (extract from receipt, use today if not found)
- merchant: store/company name (string)
- category: MUST match one of these exactly: {', '.join(categories)}. Choose the best match based on merchant name and items purchased.
- description: brief description of purchase (optional)

Return ONLY valid JSON, no other text. Example:
{{"amount": 45.99, "date": "2024-01-15", "merchant": "Walmart", "category": "Groceries", "description": "Grocery shopping"}}"""

    response = client.chat.completions.create(
        model="gpt-4-turbo",  # or "gpt-4o" - both support vision
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
            ]
        }],
        response_format={"type": "json_object"}  # Force JSON response
    )
    
    result = json.loads(response.choices[0].message.content)
    
    # Validate category is in your list
    if result.get("category") not in categories:
        result["category"] = None  # Let user choose
    
    return result
```

#### Option B: Veryfi API (Specialized for receipts)
```python
import requests

async def call_veryfi_api(image_base64):
    response = requests.post(
        "https://api.veryfi.com/api/v8/partner/document",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "CLIENT-ID": os.getenv("VERYFI_CLIENT_ID"),
            "AUTHORIZATION": f"apikey {os.getenv('VERYFI_API_KEY')}"
        },
        json={"file_data": image_base64}
    )
    return response.json()
```

#### Option C: Google Cloud Vision + Custom Parsing
```python
from google.cloud import vision

async def call_google_vision(image_data):
    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=image_data)
    response = client.text_detection(image=image)
    text = response.text_annotations[0].description if response.text_annotations else ""
    return {"text": text}
```

### 4. Data Parsing Logic

```python
import re
from datetime import datetime

def parse_receipt_data(ocr_result):
    text = ocr_result.get("text", "").upper()
    
    # Extract amount (look for currency patterns)
    amount_patterns = [
        r'TOTAL[:\s]+[\$€£¥]?([\d,]+\.?\d*)',
        r'AMOUNT[:\s]+[\$€£¥]?([\d,]+\.?\d*)',
        r'[\$€£¥]([\d,]+\.?\d*)',
    ]
    amount = None
    for pattern in amount_patterns:
        match = re.search(pattern, text)
        if match:
            amount = float(match.group(1).replace(',', ''))
            break
    
    # Extract date
    date_patterns = [
        r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',
        r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})',
    ]
    date = None
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            # Parse and format date
            date = parse_date_match(match)
            break
    
    # Extract merchant (usually first line or after "FROM:")
    merchant = extract_merchant(text)
    
    # Suggest category based on keywords
    category = suggest_category(merchant, text)
    
    return {
        "amount": amount,
        "date": date,
        "merchant": merchant,
        "category": category,
        "confidence": calculate_confidence(amount, date, merchant)
    }
```

## Cost Considerations

## Cost Comparison (per 100 receipts)

### Specialized Receipt Services:
- **Taggun**: ~$10-20 per 100 receipts (estimated, check current pricing)
- **Tabscanner**: Contact for pricing
- **Veryfi**: ~$10-50 per 100 receipts
- **DocuClipper**: Contact for pricing
- **Smartbills**: Contact for pricing
- **Cloudmersive**: Contact for pricing

### General OCR Services:
- **Google Cloud Vision**: **$0.15 per 100 receipts** ($1.50 per 1000) ⭐ CHEAPEST
- **AWS Textract**: ~$0.15 per 100 receipts ($1.50 per 1000)
- **Azure Form Recognizer**: ~$0.15 per 100 receipts ($1.50 per 1000)

### AI Vision Models:
- **OpenAI GPT-4 Turbo**: **$0.77 per 100 receipts** (~$0.00765 per image)
- **Anthropic Claude**: Check current pricing

### Free Options:
- **Tesseract.js**: FREE (but lower accuracy ~60-70%)
- **ML Kit**: FREE (better accuracy ~80-85%)

## 🏆 RECOMMENDATION: Best Overall Solution

### **⭐ RECOMMENDED: OpenAI GPT-4 Turbo (For Context Understanding + Category Matching)**
**Use OpenAI GPT-4 Turbo / GPT-4o**
- **Cost**: $0.77 per 100 receipts (~$0.00765 per image)
- **Why this is best for your needs:**
  1. ✅ **Understands context** - Can analyze what the purchase is about
  2. ✅ **Smart category matching** - Can match to your existing category list
  3. ✅ **Handles edge cases** - Understands different receipt formats
  4. ✅ **Extracts structured data** - Amount, date, merchant, category in one call
  5. ✅ **You already have OpenAI account** - Easy to integrate

**Implementation approach:**
- Send receipt image + your category list to GPT-4 Turbo
- Prompt: "Extract expense data and match to one of these categories: [your list]"
- Returns: `{amount, date, merchant, category, confidence}`
- User can edit if category is wrong

### **Option 2: Hybrid Approach (If Cost is Concern)**
**Google Cloud Vision + GPT-4 Turbo for Category Only**
- **Step 1**: Use Google Cloud Vision ($0.15 per 100) to extract text
- **Step 2**: Send extracted text to GPT-4 Turbo (cheaper, ~$0.10 per 100) for category matching
- **Total**: ~$0.25 per 100 receipts (cheaper than full GPT-4 vision)
- **Trade-off**: Slightly less accurate than full vision, but much cheaper

### **Option 3: If You Need Highest Receipt Accuracy**
**Taggun + Custom Category Matching**
- **Cost**: ~$10-20 per 100 receipts
- **Accuracy**: Highest for receipts (~95%+)
- **Features**: Structured data, merchant recognition
- **Then**: Use GPT-4 Turbo just for category matching (cheaper)
- **Best for**: Production apps where receipt accuracy is critical

### **Option 4: If Budget is Critical**
**ML Kit (On-Device) + GPT-4 Turbo for Category**
- **Cost**: ~$0.10 per 100 receipts (only GPT-4 for category matching)
- **Accuracy**: ~80-85% OCR + smart category matching
- **Best for**: High volume, privacy-focused, offline OCR + online category matching

## Privacy & Security

1. **Image Storage**: Don't store images permanently (only process and discard)
2. **Data Transmission**: Use HTTPS, encrypt images in transit
3. **User Consent**: Ask permission before processing
4. **Local Processing Option**: Consider on-device OCR for sensitive users

## UI/UX Flow

1. User taps "Scan Receipt" button in Add Expense screen
2. Camera screen opens → User takes photo
3. Photo preview → User confirms or retakes
4. Loading screen → "Processing receipt..."
5. Review screen → Shows extracted data with confidence indicators
6. User edits/confirms → Saves to expense form
7. Returns to Add Expense screen with pre-filled data

## Error Handling

1. **Camera permission denied**: Show message, link to settings
2. **Poor image quality**: Suggest retake, show tips
3. **OCR fails**: Allow manual entry fallback
4. **Low confidence**: Highlight uncertain fields
5. **Network error**: Cache image, retry when online

## Testing Strategy

1. Test with various receipt formats (different countries, languages)
2. Test with poor lighting, blurry images
3. Test with handwritten receipts
4. Test offline scenarios
5. Test with different currencies
6. Test date format variations

## Future Enhancements

1. **Batch scanning**: Process multiple receipts at once
2. **Receipt storage**: Save images for reference
3. **Auto-categorization**: Learn from user edits
4. **Multi-language support**: OCR in different languages
5. **Tax extraction**: Extract tax amounts separately
6. **Item-level extraction**: Extract individual line items

## Dependencies to Add

### Frontend:
```json
{
  "expo-camera": "^14.0.0",
  "expo-image-picker": "^14.0.0",
  "react-native-image-resizer": "^3.0.0"
}
```

### Backend:
```txt
openai>=1.0.0  # For GPT-4 Turbo with vision
# or
google-cloud-vision>=3.0.0
# or
requests>=2.31.0  # for Veryfi API
```

## Implementation Priority

1. **Phase 1 (MVP)**: Camera + Basic OCR + Simple parsing
2. **Phase 2**: Better parsing + Category suggestions
3. **Phase 3**: Confidence scores + Better UI
4. **Phase 4**: Offline support + Batch processing

## Estimated Timeline

- **Phase 1**: 2-3 days
- **Phase 2**: 1-2 days
- **Phase 3**: 1-2 days
- **Phase 4**: 2-3 days

**Total: ~1-2 weeks for full implementation**

