import "dotenv/config";
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import {PrismaClient} from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
   constructor() {
    const url = process.env.DATABASE_URL;
    console.log('url loaded:', !!url);
    console.log('password parsed:', url ? !!new URL(url).password : false);
    const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
    };

  async onModuleInit() {
    await this.$connect(); // connect to db
  }

  async onModuleDestroy() {
    await this.$disconnect(); // disconnect from db
  }
}