import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'kds',
})
export class KdsGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
        client.join(room);
        console.log(`Client ${client.id} joined KDS room ${room}`);
    }

    emitNewOrder(tenantId: string, order: any) {
        const room = order.branchId ? `${tenantId}_${order.branchId}` : tenantId;
        this.server.to(room).emit('orderToKitchen', order);
        // Also emit to main tenant room for admins/head office if needed, but for isolation we stick to specific room
        // If we want admins to see ALL, they should join the tenantId room, and we should emit to BOTH?
        // For now, let's emit to the specific room. If order has no branch, it goes to tenant room.
        if (order.branchId) {
            // Optional: also emit to tenant room if we want a "Master KDS"
            // this.server.to(tenantId).emit('orderToKitchen', order);
        }
    }

    emitStatusUpdate(tenantId: string, update: any) {
        const room = update.branchId ? `${tenantId}_${update.branchId}` : tenantId;
        this.server.to(room).emit('updateStatus', update);
    }
}
