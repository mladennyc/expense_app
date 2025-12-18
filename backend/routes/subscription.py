from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import Optional
import os
import stripe
import logging

logger = logging.getLogger(__name__)

from database import get_db, User, Subscription, ReceiptScan, PromoCode, Notification, SubscriptionPlanType, SubscriptionStatus
from auth import get_current_user
from models import CheckoutRequest, PromoCodeRequest

router = APIRouter()

# Stripe configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8081")

# Price IDs from Stripe
PRICE_ID_EXTRA_30 = os.getenv("STRIPE_PRICE_ID_EXTRA_30")
PRICE_ID_UNLIMITED = os.getenv("STRIPE_PRICE_ID_UNLIMITED")


def get_or_create_subscription(db: Session, user_id: int) -> Subscription:
    """Get or create a subscription for the user"""
    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    
    if not subscription:
        # Create default limited subscription
        subscription = Subscription(
            user_id=user_id,
            plan_type=SubscriptionPlanType.LIMITED.value,
            status=SubscriptionStatus.ACTIVE.value,
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
    
    return subscription


def get_current_month_scans(db: Session, user_id: int) -> int:
    """Get number of scans for current month"""
    now = datetime.utcnow()
    month_start = date(now.year, now.month, 1)
    
    scans = db.query(ReceiptScan).filter(
        ReceiptScan.user_id == user_id,
        ReceiptScan.month_year == f"{now.year}-{now.month:02d}"
    ).count()
    
    return scans


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


def get_plan_limits(plan_type: str) -> dict:
    """Get scan limits for a plan type"""
    if plan_type == SubscriptionPlanType.UNLIMITED.value:
        return {"limit": None, "display": "Unlimited"}
    elif plan_type == SubscriptionPlanType.EXTRA_30.value:
        return {"limit": 30, "display": "30 scans"}
    elif plan_type == SubscriptionPlanType.FREE.value:
        return {"limit": None, "display": "Unlimited"}  # Free promo code = unlimited
    else:  # LIMITED
        return {"limit": 10, "display": "10 scans"}


def get_plan_display_name(plan_type: str) -> str:
    """Get display name for plan type"""
    names = {
        SubscriptionPlanType.LIMITED.value: "Free Plan",
        SubscriptionPlanType.FREE.value: "Free Plan",
        SubscriptionPlanType.EXTRA_30.value: "Extra 30 Scans",
        SubscriptionPlanType.UNLIMITED.value: "Unlimited Monthly"
    }
    return names.get(plan_type, "Unknown Plan")


@router.get("/subscription/status")
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current subscription status"""
    subscription = get_or_create_subscription(db, current_user.id)
    
    return {
        "plan_type": subscription.plan_type,
        "status": subscription.status,
        "plan_display_name": get_plan_display_name(subscription.plan_type),
        "current_period_start": subscription.current_period_start.isoformat() if subscription.current_period_start else None,
        "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None,
    }


@router.get("/subscription/usage")
async def get_subscription_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get subscription usage statistics"""
    subscription = get_or_create_subscription(db, current_user.id)
    scans_used = get_current_month_scans(db, current_user.id)
    
    limits = get_plan_limits(subscription.plan_type)
    scan_limit = limits["limit"]
    
    # For extra_30 plan, add 30 to base 10
    if subscription.plan_type == SubscriptionPlanType.EXTRA_30.value:
        scan_limit = 40  # 10 base + 30 extra
    
    scans_remaining = None if scan_limit is None else max(0, scan_limit - scans_used)
    
    return {
        "plan_type": subscription.plan_type,
        "scans_used": scans_used,
        "scan_limit": scan_limit,
        "scans_remaining": scans_remaining,
        "monthly_limit": scan_limit,
    }


@router.post("/subscription/create-checkout")
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create Stripe checkout session"""
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    subscription = get_or_create_subscription(db, current_user.id)
    
    # Determine price ID
    if request.plan_type == "extra_30":
        price_id = PRICE_ID_EXTRA_30
        if not price_id:
            raise HTTPException(status_code=500, detail="Extra 30 scans price ID not configured")
    elif request.plan_type == "unlimited":
        price_id = PRICE_ID_UNLIMITED
        if not price_id:
            raise HTTPException(status_code=500, detail="Unlimited plan price ID not configured")
    else:
        raise HTTPException(status_code=400, detail="Invalid plan type")
    
    try:
        # Create or get Stripe customer
        customer_id = subscription.stripe_customer_id
        if not customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                metadata={"user_id": str(current_user.id)}
            )
            customer_id = customer.id
            subscription.stripe_customer_id = customer_id
            db.commit()
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription' if request.plan_type == "unlimited" else 'payment',
            success_url=f"{FRONTEND_URL}/settings?success=true",
            cancel_url=f"{FRONTEND_URL}/settings?canceled=true",
            metadata={
                "user_id": str(current_user.id),
                "plan_type": request.plan_type
            }
        )
        
        return {"checkout_url": checkout_session.url}
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")


@router.post("/subscription/apply-promo-code")
async def apply_promo_code(
    request: PromoCodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Apply a promo code to user's subscription"""
    promo_code = db.query(PromoCode).filter(
        PromoCode.code == request.code.upper(),
        PromoCode.is_active == True
    ).first()
    
    if not promo_code:
        raise HTTPException(status_code=404, detail="Promo code not found or invalid")
    
    # Check if expired
    if promo_code.expires_at and promo_code.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Promo code has expired")
    
    # Check usage limit
    if promo_code.max_uses and promo_code.used_count >= promo_code.max_uses:
        raise HTTPException(status_code=400, detail="Promo code has reached maximum uses")
    
    subscription = get_or_create_subscription(db, current_user.id)
    
    # Apply promo code
    if promo_code.type == "unlimited_access":
        subscription.plan_type = SubscriptionPlanType.FREE.value
        subscription.promo_code_id = promo_code.id
        subscription.status = SubscriptionStatus.ACTIVE.value
        promo_code.used_count += 1
        db.commit()
        
        return {"message": "Promo code applied successfully", "plan_type": subscription.plan_type}
    else:
        raise HTTPException(status_code=400, detail="Invalid promo code type")


@router.post("/subscription/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel user's subscription"""
    subscription = get_or_create_subscription(db, current_user.id)
    
    logger.info(f"Cancelling subscription for user {current_user.id}, plan_type={subscription.plan_type}, stripe_subscription_id={subscription.stripe_subscription_id}")
    
    if subscription.plan_type != SubscriptionPlanType.UNLIMITED.value:
        logger.warning(f"Cannot cancel: plan_type is {subscription.plan_type}, not UNLIMITED")
        raise HTTPException(status_code=400, detail="Only unlimited subscriptions can be cancelled")
    
    if not subscription.stripe_subscription_id:
        logger.error(f"No stripe_subscription_id found for user {current_user.id}")
        raise HTTPException(status_code=400, detail="No active Stripe subscription found to cancel")
    
    try:
        stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            cancel_at_period_end=True
        )
        logger.info(f"Successfully set cancel_at_period_end=True for subscription {subscription.stripe_subscription_id}")
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error cancelling subscription: {e}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    
    # Note: Don't immediately cancel, let it expire at period end
    return {"message": "Subscription will be cancelled at the end of the current period"}


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(session["metadata"]["user_id"])
        plan_type = session["metadata"]["plan_type"]
        
        logger.info(f"Processing checkout.session.completed: user_id={user_id}, plan_type={plan_type}")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User not found: user_id={user_id}")
            return {"status": "error", "message": "User not found"}
        
        subscription = get_or_create_subscription(db, user_id)
        logger.info(f"Current subscription before update: plan_type={subscription.plan_type}, status={subscription.status}")
        
        if plan_type == "extra_30":
            # Add 30 scans to current month
            subscription.plan_type = SubscriptionPlanType.EXTRA_30.value
            subscription.status = SubscriptionStatus.ACTIVE.value
            logger.info(f"Updated subscription to EXTRA_30")
        elif plan_type == "unlimited":
            subscription.plan_type = SubscriptionPlanType.UNLIMITED.value
            subscription.status = SubscriptionStatus.ACTIVE.value
            stripe_subscription_id = session.get("subscription")
            subscription.stripe_subscription_id = stripe_subscription_id
            logger.info(f"Updated subscription to UNLIMITED, stripe_subscription_id={stripe_subscription_id}")
            
            if stripe_subscription_id:
                try:
                    sub = stripe.Subscription.retrieve(stripe_subscription_id)
                    subscription.current_period_start = datetime.fromtimestamp(sub.current_period_start)
                    subscription.current_period_end = datetime.fromtimestamp(sub.current_period_end)
                    logger.info(f"Retrieved subscription details: period_start={subscription.current_period_start}, period_end={subscription.current_period_end}")
                except Exception as e:
                    logger.error(f"Error retrieving Stripe subscription {stripe_subscription_id}: {e}")
            else:
                logger.warning("No subscription ID in checkout session")
        
        db.commit()
        db.refresh(subscription)
        logger.info(f"Subscription after commit: plan_type={subscription.plan_type}, status={subscription.status}")
        
    elif event["type"] == "customer.subscription.updated":
        subscription_obj = event["data"]["object"]
        stripe_subscription_id = subscription_obj["id"]
        
        subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        
        if subscription:
            if subscription_obj["status"] == "active":
                subscription.status = SubscriptionStatus.ACTIVE.value
                subscription.current_period_start = datetime.fromtimestamp(subscription_obj["current_period_start"])
                subscription.current_period_end = datetime.fromtimestamp(subscription_obj["current_period_end"])
            elif subscription_obj["status"] == "canceled":
                subscription.status = SubscriptionStatus.CANCELLED.value
            db.commit()
    
    elif event["type"] == "customer.subscription.deleted":
        subscription_obj = event["data"]["object"]
        stripe_subscription_id = subscription_obj["id"]
        
        subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        
        if subscription:
            subscription.status = SubscriptionStatus.CANCELLED.value
            subscription.plan_type = SubscriptionPlanType.LIMITED.value
            db.commit()
    
    elif event["type"] == "invoice.payment_failed":
        invoice = event["data"]["object"]
        customer_id = invoice.get("customer")
        
        # Find user by Stripe customer ID
        subscription = db.query(Subscription).filter(
            Subscription.stripe_customer_id == customer_id
        ).first()
        
        if subscription:
            user = db.query(User).filter(User.id == subscription.user_id).first()
            if user:
                # Create notification for payment failure
                notification = Notification(
                    user_id=user.id,
                    message=f"Your payment failed on {datetime.utcnow().strftime('%B %d, %Y')}. Please update your payment method to continue your subscription.",
                    type="payment_failed",
                    read=False
                )
                db.add(notification)
                
                # Update subscription status to indicate payment issue
                subscription.status = SubscriptionStatus.ACTIVE.value  # Keep active but notify user
                db.commit()
                logger.info(f"Created payment_failed notification for user {user.id}")
    
    return {"status": "success"}

