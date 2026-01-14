import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StockAlert } from './entities/stock-alert.entity';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'inventory',
})
export class InventoryGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected to Inventory Gateway: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected from Inventory Gateway: ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, room: string) {
        client.join(room);
        console.log(`Client ${client.id} joined room: ${room}`);
    }

    notifyStockAlert(alert: StockAlert, tenantId: string, branchId?: string) {
        // Notify tenant admins
        this.server.to(tenantId).emit('stockAlert', alert);

        // Notify specific branch managers if branchId exists
        if (branchId) {
            this.server.to(`${tenantId}_${branchId}`).emit('stockAlert', alert);
        }
    }
}
