import { prisma } from "../lib/prisma";
import { sendEmail } from "../lib/mail";

interface CreateBookingInput {
    userId: number;
    ticketTierId: number;
    quantity: number;
}

export class BookingService {
    static async reserveTicket(input: CreateBookingInput) {
        const result = await prisma.$transaction(async (tx) => {
            const tiers: any[] = await tx.$queryRaw`
        SELECT id, event_id, available_seats, price_per_seat_excluding_tax, tax_percentage 
        FROM ticket_tiers 
        WHERE id = ${input.ticketTierId} 
        FOR UPDATE
      `;

            const selectedTier = tiers[0];

            if (!selectedTier) {
                throw new Error("The requested ticket tier does not exist.");
            }

            if (selectedTier.available_seats < input.quantity) {
                throw new Error(`Not enough seats available. Only ${selectedTier.available_seats} remaining.`);
            }

            // Look up the event's active transaction currency
            const eventRecord = await tx.event.findUnique({
                where: { id: selectedTier.event_id },
                select: { currency: true }
            });

            const basePrice = Number(selectedTier.price_per_seat_excluding_tax) * input.quantity;
            const taxAmount = basePrice * (Number(selectedTier.tax_percentage) / 100);
            const finalPrice = basePrice + taxAmount;

            await tx.ticketTier.update({
                where: { id: input.ticketTierId },
                data: {
                    availableSeats: {
                        decrement: input.quantity
                    }
                }
            });

            const booking = await tx.booking.create({
                data: {
                    userId: input.userId,
                    eventId: selectedTier.event_id,
                    ticketTierId: input.ticketTierId,
                    quantity: input.quantity,
                    totalPricePaid: finalPrice,
                    currency: eventRecord?.currency || "INR", 
                    paymentStatus: "PENDING"
                },
                include: {
                    user: {
                        select: {
                            email: true,
                            name: true
                        }
                    },
                    event: {
                        select: {
                            eventName: true,
                            location: true,
                            dateTime: true
                        }
                    },
                    ticketTier: {
                        select: {
                            tierName: true
                        }
                    }
                }
            });

            return booking;
        });

        try {
            await sendEmail({
                to: result.user.email,
                subject: `Your Booking Reservation for ${result.event.eventName}`,
                html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Hi ${result.user.name}, Your Ticket Is Inbound!</h2>
            <p>Your booking reservation has been initialized successfully.</p>
            <hr style="border: 1px solid #eee;" />
            <p><strong>Event:</strong> ${result.event.eventName}</p>
            <p><strong>Location:</strong> ${result.event.location}</p>
            <p><strong>Date & Time:</strong> ${new Date(result.event.dateTime).toLocaleString()}</p>
            <p><strong>Tier:</strong> ${result.ticketTier.tierName} (x${result.quantity})</p>
            <p><strong>Total Paid (incl. tax):</strong> ${result.currency} ${Number(result.totalPricePaid).toFixed(2)}</p>
            <p><strong>Payment Status:</strong> PENDING</p>
            <hr style="border: 1px solid #eee;" />
            <p style="font-size: 12px; color: #666;">Thank you for booking with us!</p>
          </div>
        `
            });
        } catch (emailError) {
            console.log("Email service failed to dispatch message payload:", emailError);
        }

        return result;
    }
}
