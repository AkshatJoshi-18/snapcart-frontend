import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
    // MOVE INITIALIZATION INSIDE THE HANDLER
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey || !webhookSecret) {
        // We log this but don't crash the build process
        console.error("Runtime Environment Variables Missing");
        return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);

    const sig = req.headers.get("stripe-signature");
    const rawBody = await req.text();
    let event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret);
    } catch (error) {
        console.error("signature verification failed", error);
        return NextResponse.json({ message: "Invalid Signature" }, { status: 400 });
    }

    if (event?.type === "checkout.session.completed") {
        const session = event.data.object as any;
        await connectDb();
        await Order.findByIdAndUpdate(session?.metadata?.orderId, {
            isPaid: true
        });
    }

    return NextResponse.json({ received: true }, { status: 200 });
}