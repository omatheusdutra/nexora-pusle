import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import type {
  RealtimePublisher,
  WorkflowEvent
} from "../../application/contracts";

export class SocketRealtimePublisher implements RealtimePublisher {
  private io: SocketServer | null = null;
  private redisClients: Array<{ quit: () => Promise<unknown> }> = [];

  async attach(
    server: HttpServer,
    options: {
      corsOrigin: string | string[];
      redisUrl?: string;
      logger?: Pick<Console, "warn">;
    }
  ) {
    this.io = new SocketServer(server, {
      cors: {
        origin: options.corsOrigin,
        credentials: true
      },
      path: "/socket.io"
    });

    this.io.on("connection", (socket) => {
      socket.emit("dashboard.updated", { connected: true });
    });

    if (options.redisUrl) {
      try {
        const pubClient = createClient({ url: options.redisUrl });
        const subClient = pubClient.duplicate();
        await pubClient.connect();
        await subClient.connect();
        this.io.adapter(createAdapter(pubClient, subClient));
        this.redisClients = [pubClient, subClient];
      } catch (error) {
        options.logger?.warn(
          `Redis adapter disabled: ${
            error instanceof Error ? error.message : "unknown error"
          }`
        );
      }
    }
  }

  publish(event: WorkflowEvent) {
    this.io?.emit(event.name, event.payload);
  }

  async close() {
    await this.io?.close();
    await Promise.all(this.redisClients.map((client) => client.quit()));
  }
}
