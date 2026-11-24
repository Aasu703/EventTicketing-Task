import { TicketType } from '@prisma/client';

export class TicketTypeResponseDto {
    id: number;
    name: string;
    price: number;
    quantity: number;
    sold: number;
    available: number;
    eventId: number;
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<TicketTypeResponseDto>) {
        Object.assign(this, partial);
    }

    static fromEntity(ticketType: TicketType): TicketTypeResponseDto {
        return new TicketTypeResponseDto({
            ...ticketType,
            price: Number(ticketType.price),
            available: ticketType.quantity - ticketType.sold,
        });
    }
}