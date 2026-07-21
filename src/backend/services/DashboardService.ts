import { prisma } from "../lib/prisma";

export class DashboardService{
    static async getOrganizerMetrics(organizerId : number){
        const user = await prisma.user.findUnique({
            where: { id: organizerId },
            select: { defaultCurrency: true }
        });
        const defaultCurrency = user?.defaultCurrency || "INR";

        const events = await prisma.event.findMany({
            where : {
                organizerId
            },
            include :{
                ticketTiers : {
                    select : {
                        totalSeats : true,
                        availableSeats : true,
                        tierName : true,
                        pricePerSeatExcludingTax : true
                    }
                },
                bookings:  {
                    where : {
                        paymentStatus : "SUCCESS"
                    },
                    select : {
                        quantity : true,
                        totalPricePaid : true
                    }
                }
            }
        });


        let totalRevenue = 0;
        let totalTicketsSold = 0;
        let totalCapacityAcrossEvents = 0;

        const eventBreakdown = events.map((event) => {
            const eventTicketsSold = event.bookings.reduce((sum: number, b: any) => sum + b.quantity, 0);
            const eventRevenue = event.bookings.reduce((sum: number, b: any) => sum + Number(b.totalPricePaid), 0);
            const eventTotalCapacity = event.ticketTiers.reduce((sum: number, t: any) => sum + t.totalSeats, 0);
      
            totalRevenue += eventRevenue;
            totalTicketsSold += eventTicketsSold;
            totalCapacityAcrossEvents += eventTotalCapacity;
      
            return {
              eventId: event.id,
              eventName: event.eventName,
              status: event.status,
              dateTime: event.dateTime,
              revenue: eventRevenue,
              currency: event.currency,
              ticketsSold: eventTicketsSold,
              totalCapacity: eventTotalCapacity,
              fillRatePercentage: eventTotalCapacity > 0 
                ? Math.round((eventTicketsSold / eventTotalCapacity) * 100) 
                : 0
            };
          });
      
          return {
            overview: {
              totalRevenue,
              totalTicketsSold,
              totalEventsPublished: events.length,
              defaultCurrency,
              globalFillRatePercentage: totalCapacityAcrossEvents > 0 
                ? Math.round((totalTicketsSold / totalCapacityAcrossEvents) * 100) 
                : 0
            },
            eventsList: eventBreakdown
          };
    }
}