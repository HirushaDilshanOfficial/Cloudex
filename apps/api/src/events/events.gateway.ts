import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class EventsGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('joinTenantRoom')
    handleJoinTenantRoom(
        @MessageBody() tenantId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`tenant_${tenantId}`);
        return { event: 'joinedRoom', data: `Joined tenant_${tenantId}` };
    }

    @SubscribeMessage('leaveTenantRoom')
    handleLeaveTenantRoom(
        @MessageBody() tenantId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(`tenant_${tenantId}`);
        return { event: 'leftRoom', data: `Left tenant_${tenantId}` };
    }

    // Method to emit order updates to specific tenant room
    emitOrderUpdate(tenantId: string, order: any) {
        this.server.to(`tenant_${tenantId}`).emit('orderUpdated', order);
    }
}
