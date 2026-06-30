import { prisma } from "../lib/prisma";

export class DashboardService{
    static async getOrganizerMetrics(organizerId : number){
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
                        pricePerSeatExculdingTax : true
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
            const eventTicketsSold = event.bookings.reduce((sum, b) => sum + b.quantity, 0);
            const eventRevenue = event.bookings.reduce((sum, b) => sum + Number(b.totalPricePaid), 0);
            const eventTotalCapacity = event.ticketTiers.reduce((sum, t) => sum + t.totalSeats, 0);
      
            totalRevenue += eventRevenue;
            totalTicketsSold += eventTicketsSold;
            totalCapacityAcrossEvents += eventTotalCapacity;
      
            return {
              eventId: event.id,
              eventName: event.eventName,
              status: event.status,
              dateTime: event.dateTime,
              revenue: eventRevenue,
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
              globalFillRatePercentage: totalCapacityAcrossEvents > 0 
                ? Math.round((totalTicketsSold / totalCapacityAcrossEvents) * 100) 
                : 0
            },
            eventsList: eventBreakdown
          };
    }
}