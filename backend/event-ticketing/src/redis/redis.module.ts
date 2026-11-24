import { Global, Module } from "@nestjs/common";
import { createClient} from "redis";
@Global()
@Module({
    providers: [
        {
            provide: 'REDIS',
            useFactory: async () => {
                const client = createClient({
                    url: process.env.REDIS_URL
                })
                // console log error
                client.on('error', (err) => console.error('Redis Client Error', err));

                await client.connect();
                return client;
            }
        }
    ],
    exports: ['REDIS']
})
export class RedisModule {}
