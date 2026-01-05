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
    handleJoinRoom(@MessageBody() tenantId: string, @ConnectedSocket() client: Socket) {
        client.join(tenantId);
        console.log(`Client ${client.id} joined KDS room ${tenantId}`);
    }

    emitNewOrder(tenantId: string, order: any) {
        this.server.to(tenantId).emit('orderToKitchen', order);
    }

    emitStatusUpdate(tenantId: string, update: any) {
        this.server.to(tenantId).emit('updateStatus', update);
    }
}
