"use server";

import { ethers } from 'ethers';
import { db } from '@/db/drizzle';
import { userSubscription } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth0';
import { byteTokenContract } from '@/lib/ethers';

const SHOP_WALLET_ADDRESS = process.env.NEXT_PUBLIC_SHOP_WALLET_ADDRESS!;
const SUBSCRIPTION_COST_BYTE = 20000; // 20000 BYTE tokens for subscription (equivalent to $20)

export const createCryptoSubscription = async (txHash: string) => {
  const user = await requireUser();
  const userId = user.id;

  if (!txHash) {
    throw new Error("Transaction hash is required");
  }

  try {
    // Verify the transaction on blockchain
    const provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER_URL!);
    const tx = await provider.getTransaction(txHash);

    if (!tx) {
      throw new Error("Transaction not found on blockchain");
    }

    // Verify the transaction was sent to the shop wallet
    if (tx.to?.toLowerCase() !== SHOP_WALLET_ADDRESS.toLowerCase()) {
      throw new Error("Transaction was not sent to the correct address");
    }

    // Verify the amount (20000 BYTE tokens)
    const expectedAmount = ethers.parseUnits(SUBSCRIPTION_COST_BYTE.toString(), 18);
    if (tx.value !== expectedAmount) {
      throw new Error("Transaction amount is incorrect");
    }

    // Check if user already has an active subscription
    const existingSubscription = await db.query.userSubscription.findFirst({
      where: eq(userSubscription.userId, userId),
    });

    if (existingSubscription) {
      // Update existing subscription
      await db.update(userSubscription).set({
        cryptoSubscriptionId: txHash,
        cryptoPaymentTxHash: txHash,
        cryptoCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isCryptoSubscription: true,
      }).where(eq(userSubscription.userId, userId));
    } else {
      // Create new subscription
      await db.insert(userSubscription).values({
        userId,
        stripeCustomerId: `crypto_${userId}`, // Dummy stripe ID for crypto subs
        stripeSubscriptionId: `crypto_${txHash}`,
        stripePriceId: 'crypto_monthly',
        stripeCurrentPeriodEnd: new Date(), // Not used for crypto
        cryptoSubscriptionId: txHash,
        cryptoPaymentTxHash: txHash,
        cryptoCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isCryptoSubscription: true,
      });
    }

    return { success: true, message: "Crypto subscription activated successfully!" };
  } catch (error) {
    console.error("Error creating crypto subscription:", error);
    throw new Error("Failed to create crypto subscription");
  }
};