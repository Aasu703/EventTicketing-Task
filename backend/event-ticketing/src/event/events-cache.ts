import { Inject, Injectable } from "@nestjs/common";
import type { Redis } from "ioredis";
import { PublicEventDto } from "./dto/public-event.dto.js";
import { createHash } from "crypto";

@Injectable()
export class EventsCache {
    private readonly ttl = 60;
    private readonly versionKey = 'events:list:version';

    constructor(@Inject('REDIS') private redis: Redis){}

    async listKey(q: PublicEventDto){
        const version = await this.redis.get(this.versionKey) ?? '0';
        const raw = JSON.stringify([q.page, q.limit, q.search, q.startTo, q.startFrom, q.maxPrice, q.minPrice]);
        const hash = createHash('sha1').update(raw).digest('hex');
        return `events:list:${version}:${hash}`;
    }

    async getList(key: string){
        const data = await this.redis.get(key);
        return data ? JSON.parse(data): null;
    }

    async setList(key: string, value: unknown){
        await this.redis.set(key, JSON.stringify(value), 'EX', this.ttl);
    }

    async getOne(id: number){
        const data = await this.redis.get(`events:${id}`);
        return data ? JSON.parse(data): null;
    }

    async setOne(id: number, value: unknown){
        await this.redis.set(`events:${id}`, JSON.stringify(value), 'EX', this.ttl);
    }

    async invalidate(id: number){
        await this.redis.del(`events:${id}`);
        await this.redis.incr(this.versionKey);
    }
}