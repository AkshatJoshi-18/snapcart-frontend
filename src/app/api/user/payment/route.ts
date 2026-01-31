import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
    try {
        // Validation happens here, at runtime
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error("STRIPE_SECRET_KEY missing");

        const stripe = new Stripe(key); 
        await connectDb();

        const { userId, items, totalAmount, address } = await req.json();
        
        // ... rest of your existing logic ...

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            success_url: `${process.env.NEXT_BASE_URL}/success`,
            cancel_url: `${process.env.NEXT_BASE_URL}/cancel`,
            line_items: [{
                price_data: {
                    currency: 'inr',
                    product_data: { name: 'Order Payment' },
                    unit_amount: totalAmount * 100,
                },
                quantity: 1,
            }],
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        return NextResponse.json({ message: `Error: ${error}` }, { status: 500 });
    }
}