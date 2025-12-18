from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import os
import json

from database import get_db, User, Subscription, ReceiptScan, SubscriptionPlanType
from auth import get_current_user
from models import ReceiptScanRequest

router = APIRouter()


def get_or_create_subscription(db: Session, user_id: int) -> Subscription:
    """Get or create a subscription for the user"""
    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    
    if not subscription:
        from database import SubscriptionStatus
        subscription = Subscription(
            user_id=user_id,
            plan_type=SubscriptionPlanType.LIMITED.value,
            status=SubscriptionStatus.ACTIVE.value,
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow()
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
    
    return subscription


def get_current_month_scans(db: Session, user_id: int) -> int:
    """Get number of scans for current month"""
    now = datetime.utcnow()
    month_year = f"{now.year}-{now.month:02d}"
    
    scans = db.query(ReceiptScan).filter(
        ReceiptScan.user_id == user_id,
        ReceiptScan.month_year == month_year
    ).count()
    
    return scans


def check_scan_limit(db: Session, user_id: int) -> tuple[bool, Optional[str]]:
    """Check if user can scan. Returns (allowed, error_message)"""
    subscription = get_or_create_subscription(db, user_id)
    
    # Unlimited plans can always scan
    if subscription.plan_type == SubscriptionPlanType.UNLIMITED.value:
        return True, None
    
    if subscription.plan_type == SubscriptionPlanType.FREE.value:
        return True, None  # Promo code unlimited
    
    # Get current month scans
    scans_used = get_current_month_scans(db, user_id)
    
    # Determine limit
    if subscription.plan_type == SubscriptionPlanType.EXTRA_30.value:
        limit = 40  # 10 base + 30 extra
    else:  # LIMITED
        limit = 10
    
    if scans_used >= limit:
        return False, f"You have reached your monthly scan limit of {limit}. Upgrade to continue scanning."
    
    return True, None


def record_scan(db: Session, user_id: int):
    """Record a receipt scan"""
    now = datetime.utcnow()
    month_year = f"{now.year}-{now.month:02d}"
    
    scan = ReceiptScan(
        user_id=user_id,
        scan_date=now,
        month_year=month_year
    )
    db.add(scan)
    db.commit()


@router.post("/receipts/scan")
async def scan_receipt(
    request: ReceiptScanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Scan receipt image using GPT-4 Turbo and extract expense data"""
    from openai import OpenAI
    
    # Check scan limit
    allowed, error_msg = check_scan_limit(db, current_user.id)
    if not allowed:
        raise HTTPException(status_code=403, detail=error_msg)
    
    # Your app's category list
    CATEGORIES = [
        "Groceries", "Utilities", "Transportation", "Housing", "Home Maintenance",
        "Healthcare", "Education", "Childcare", "Entertainment", "Subscriptions",
        "Dining Out", "Clothing", "Personal Care", "Fitness & Sports",
        "Household Supplies", "Pet Care", "Gifts & Donations", "Travel",
        "Loans & Debt Payments", "Bank Fees", "Insurance", "Taxes", "Other"
    ]
    
    try:
        # Get base64 from request
        image_base64 = request.image_base64
        if not image_base64:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        # Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        print(f"Receipt scan request received, image size: {len(image_base64)} chars")
        
        # Initialize OpenAI client
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            print("ERROR: OPENAI_API_KEY not set")
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            )
        
        print(f"OpenAI API key found, length: {len(openai_api_key)}")
        client = OpenAI(api_key=openai_api_key)
        
        # Language mapping for descriptions
        language_map = {
            'en': 'English',
            'sr': 'Serbian (Latin script, not Cyrillic)',
            'es': 'Spanish',
            'pt': 'Portuguese',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'ar': 'Arabic'
        }
        user_language = request.language or 'en'
        description_language = language_map.get(user_language, 'English')
        
        # Additional instruction for Serbian
        serbian_note = ""
        if user_language == 'sr':
            serbian_note = " IMPORTANT: For Serbian, use Latin script (not Cyrillic). Use letters like a, b, c, d, e, etc., not Cyrillic characters."
        
        # Create prompt with categories
        prompt = f"""Extract expense data from this receipt image. First, determine if this is a UTILITY/BILL receipt (electric, phone, internet, water, gas) or a STORE receipt (grocery, retail, etc.).

For UTILITY/BILL receipts (electric, phone, internet, water, gas companies):
- Return single entry format with receipt_type: "utility"
- category should be "Utilities"
- Return: {{"receipt_type": "utility", "amount": 150.00, "date": "2024-01-15", "merchant": "Electric Company", "category": "Utilities", "description": "Electric bill"}}

For STORE receipts (grocery stores, retail shops, supermarkets):
- Return itemized format with receipt_type: "store"
- Extract each item with its price, category, and description
- Extract tax amount if present
- Return: {{"receipt_type": "store", "date": "2024-01-15", "merchant": "Walmart", "items": [{{"amount": 10.00, "category": "Groceries", "description": "Milk, bread"}}, {{"amount": 20.00, "category": "Household Supplies", "description": "Cleaning products"}}], "tax": 1.80, "subtotal": 30.00, "total": 31.80}}

Categories available: {', '.join(CATEGORIES)}

IMPORTANT RULES:
- merchant: Only extract if clearly visible. Do NOT guess or infer. Set to null if not visible.
- For store receipts: Each item's category MUST match one of the available categories exactly
- For store receipts: Extract ONLY the tax amount from the tax field. Ignore discounts, savings, or promotional amounts - they are informational only and should NOT be included in the tax calculation. Extract tax amount if visible (can be 0 or null if no tax)
- date: YYYY-MM-DD format (use today {datetime.now().date()} if not found)
- description: Write in {description_language}, not English.{serbian_note}
- Only extract information actually visible on receipt. Do NOT use your knowledge or make assumptions.

Return ONLY valid JSON, no other text."""

        # Call GPT-4 Turbo with vision
        print("Calling OpenAI API...")
        try:
            response = client.chat.completions.create(
                model="gpt-4o",  # Using gpt-4o which is more available
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }],
                response_format={"type": "json_object"},
                max_tokens=500
            )
            print("OpenAI API call successful")
            
            # Log token usage and cost
            if hasattr(response, 'usage') and response.usage:
                usage = response.usage
                prompt_tokens = usage.prompt_tokens if hasattr(usage, 'prompt_tokens') else 0
                completion_tokens = usage.completion_tokens if hasattr(usage, 'completion_tokens') else 0
                total_tokens = usage.total_tokens if hasattr(usage, 'total_tokens') else 0
                
                # GPT-4o pricing (as of 2024): $2.50 per 1M input tokens, $10.00 per 1M output tokens
                input_cost_per_1k = 0.0025  # $2.50 per 1M = $0.0025 per 1K
                output_cost_per_1k = 0.01   # $10.00 per 1M = $0.01 per 1K
                
                input_cost = (prompt_tokens / 1000) * input_cost_per_1k
                output_cost = (completion_tokens / 1000) * output_cost_per_1k
                total_cost = input_cost + output_cost
                
                print(f"OpenAI Usage - Prompt tokens: {prompt_tokens}, Completion tokens: {completion_tokens}, Total: {total_tokens}")
                print(f"OpenAI Cost - Input: ${input_cost:.6f}, Output: ${output_cost:.6f}, Total: ${total_cost:.6f}")
            else:
                print("OpenAI Usage: No usage data available")
        except Exception as api_error:
            print(f"OpenAI API error: {str(api_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"OpenAI API error: {str(api_error)}"
            )
        
        # Parse response
        try:
            result = json.loads(response.choices[0].message.content)
            print(f"Parsed result: {result}")
        except json.JSONDecodeError as parse_error:
            print(f"Failed to parse JSON: {response.choices[0].message.content}")
            raise
        
        # Determine receipt type
        receipt_type = result.get("receipt_type", "utility")  # Default to utility for backward compatibility
        
        print(f"Receipt type: {receipt_type}")
        print(f"Raw extracted data from OpenAI: {result}")
        
        # Validate date format - always provide a date
        date = result.get("date")
        if date:
            try:
                datetime.strptime(date, "%Y-%m-%d")
            except (ValueError, TypeError):
                date = datetime.now().date().isoformat()
                print(f"Invalid date format, using today")
        else:
            date = datetime.now().date().isoformat()
            print("No date extracted, using today")
        
        if receipt_type == "store":
            # Handle itemized store receipt
            items = result.get("items", [])
            tax = result.get("tax") or 0
            subtotal = result.get("subtotal") or 0
            total = result.get("total") or 0
            merchant = result.get("merchant")
            
            # Validate and clean items
            validated_items = []
            for item in items:
                item_amount = item.get("amount")
                item_category = item.get("category")
                item_description = item.get("description", "")
                
                # Validate amount
                try:
                    item_amount = float(item_amount) if item_amount else 0
                except (ValueError, TypeError):
                    print(f"Invalid item amount: {item_amount}, skipping")
                    continue
                
                # Validate category
                if item_category and item_category not in CATEGORIES:
                    print(f"Category '{item_category}' not in list, setting to 'Other'")
                    item_category = "Other"
                
                validated_items.append({
                    "amount": item_amount,
                    "category": item_category or "Other",
                    "description": item_description
                })
            
            # Calculate items total
            items_total = sum(item["amount"] for item in validated_items)
            
            # Validate tax and fix if needed (for American-style receipts)
            try:
                tax = float(tax) if tax else 0
                subtotal = float(subtotal) if subtotal else items_total
                total = float(total) if total else 0
            except (ValueError, TypeError):
                tax = 0
                subtotal = items_total
                total = items_total
            
            # Check if American-style (tax added on top): itemsTotal !== total
            # If they don't match, calculate correct tax from the difference
            tax_included = abs(items_total - total) < 0.01
            
            if not tax_included and total > 0 and items_total > 0:
                # American-style: tax is added on top
                # Calculate correct tax: total - itemsTotal
                tax_calculated = round(total - items_total, 2)
                
                # Use calculated tax if extracted tax is wrong or missing
                if tax_calculated > 0:
                    if abs(tax - tax_calculated) > 0.01:  # Tax doesn't match
                        print(f"Tax mismatch: extracted={tax}, calculated={tax_calculated}. Using calculated tax.")
                        tax = tax_calculated
                    elif tax == 0:  # No tax extracted
                        print(f"No tax extracted, using calculated tax: {tax_calculated}")
                        tax = tax_calculated
                else:
                    tax = 0
            else:
                # European-style: tax included in prices, set tax to 0
                tax = 0
            
            extracted_data = {
                "receipt_type": "store",
                "date": date,
                "merchant": merchant,
                "items": validated_items,
                "tax": tax,
                "subtotal": subtotal,
                "total": total
            }
        else:
            # Handle utility/bill receipt (single entry)
            amount = result.get("amount")
            merchant = result.get("merchant")
            category = result.get("category", "Utilities")
            description = result.get("description", "")
            
            # Validate category
            if category and category not in CATEGORIES:
                print(f"Category '{category}' not in list, setting to 'Utilities'")
                category = "Utilities"
            
            # Validate amount
            try:
                amount = float(amount) if amount else None
            except (ValueError, TypeError):
                print(f"Invalid amount: {amount}")
                amount = None
            
            extracted_data = {
                "receipt_type": "utility",
                "amount": amount,
                "date": date,
                "merchant": merchant,
                "category": category,
                "description": description
            }
        
        print(f"Final extracted data: {extracted_data}")
        
        # Record the scan
        record_scan(db, current_user.id)
        
        return {
            "success": True,
            "data": extracted_data,
            "confidence": "high"
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse OCR response: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing receipt: {str(e)}"
        )

