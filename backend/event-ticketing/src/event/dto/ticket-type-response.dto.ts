import { Expose } from 'class-transformer';
import { TicketType } from '@prisma/client';

export class TicketTypeResponseDto {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() price: number;
    @Expose() quantity: number;
    @Expose() sold: number;
    @Expose() available: number;
    @Expose() eventId: number;
    @Expose() createdAt: Date;
    @Expose() updatedAt: Date;

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